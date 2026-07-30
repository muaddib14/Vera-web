const BLOCK_ENGINE_URL = "https://mainnet.block-engine.jito.wtf/api/v1/bundles";

// Published Jito tip accounts — a tip must go to one of these for the
// validator running Jito's engine to include the bundle.
export const JITO_TIP_ACCOUNTS = [
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxWsBFdBGVN25S5RNYLxLNQfMd8mm6X",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

export function randomTipAccount(): string {
  return JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)];
}

// A signed transaction, base64-encoded, submitted as a single-transaction
// bundle straight to Jito's Block Engine — this bypasses the public mempool,
// which is what makes it un-sandwichable, unlike a normal sendTransaction.
export async function sendBundle(signedTxBase64: string): Promise<string> {
  const res = await fetch(BLOCK_ENGINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sendBundle",
      params: [[signedTxBase64], { encoding: "base64" }],
    }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`Jito bundle rejected: ${body.error.message}`);
  return body.result as string; // bundle id
}
