import type { Connection } from "@solana/web3.js";

export type MevComparison = {
  quotedOutAmount: string;
  realizedOutAmount: string;
  deltaPct: number; // negative = got less than quoted, positive = got more
};

async function waitForConfirmation(connection: Connection, signature: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatus(signature);
    const status = value?.confirmationStatus;
    if (status === "confirmed" || status === "finalized") return;
    if (value?.err) throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Timed out waiting for confirmation.");
}

// Compares what Jupiter quoted against what the wallet's token account
// actually received, by diffing pre/post balances on the confirmed
// transaction. This is a real, per-swap number rather than an advertised
// static multiplier.
export async function measureRealizedSwap(params: {
  connection: Connection;
  signature: string;
  owner: string;
  outputMint: string;
  quotedOutAmount: string;
}): Promise<MevComparison> {
  await waitForConfirmation(params.connection, params.signature);

  const tx = await params.connection.getParsedTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta) throw new Error("Confirmed, but transaction details unavailable yet.");

  const post = tx.meta.postTokenBalances?.find(
    (b) => b.owner === params.owner && b.mint === params.outputMint
  );
  const pre = tx.meta.preTokenBalances?.find(
    (b) => b.owner === params.owner && b.mint === params.outputMint && b.accountIndex === post?.accountIndex
  );

  if (!post) throw new Error("Could not find the output token balance in this transaction.");

  const before = BigInt(pre?.uiTokenAmount.amount ?? "0");
  const after = BigInt(post.uiTokenAmount.amount);
  const realized = after - before;
  const quoted = BigInt(params.quotedOutAmount);

  const deltaPct = quoted > BigInt(0) ? (Number(realized - quoted) / Number(quoted)) * 100 : 0;

  return {
    quotedOutAmount: quoted.toString(),
    realizedOutAmount: realized.toString(),
    deltaPct,
  };
}
