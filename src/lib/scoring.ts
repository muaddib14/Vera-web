import {
  Connection,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
  type AccountInfo,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getExtensionData,
  unpackMint,
} from "@solana/spl-token";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { SOL_MINT, getQuote } from "@/lib/jupiter";

export const RPC_URL = process.env.HELIUS_RPC_URL ?? clusterApiUrl("mainnet-beta");
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const RAYDIUM_V4_PROGRAM_ID = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
// Publicly known Solana burn address (Phantom's "burn" feature and others
// send tokens here to make them permanently unspendable).
const INCINERATOR_ADDRESS = "1nc1nerator11111111111111111111111111111111";

// Known AMM program ids — used to recognize pool-owned holder accounts so they
// don't get counted as "whale" concentration. General by program id rather
// than a maintained per-pool address list, so it covers pools we haven't
// seen yet, at the cost of missing brand-new/forked AMM programs.
const KNOWN_POOL_PROGRAMS = new Set([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM v4
  "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", // Raydium CPMM
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpool
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", // Meteora DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora Dynamic AMM
]);

export type CheckState = "pass" | "warn" | "fail" | "unverified";

export type ScoreLine = {
  key: string;
  label: string;
  state: CheckState;
  value: string;
  note: string;
};

export type ScoreResult = {
  mint: string;
  verdict: "critical" | "caution" | "clear";
  lines: ScoreLine[];
  checkedAt: string;
};

function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

// ---- Tier 1 — hard kills ---------------------------------------------------

async function tier1Checks(connection: Connection, mint: PublicKey): Promise<ScoreLine[]> {
  const mintAccountInfo = await connection.getAccountInfo(mint);
  if (!mintAccountInfo) {
    throw new Error("Mint account not found — check the address.");
  }

  const programId = mintAccountInfo.owner;
  const isToken2022 = programId.equals(TOKEN_2022_PROGRAM_ID);
  if (!isToken2022 && !programId.equals(TOKEN_PROGRAM_ID)) {
    throw new Error("Address is not an SPL token mint.");
  }

  const mintData = unpackMint(mint, mintAccountInfo, programId);

  const lines: ScoreLine[] = [];

  lines.push({
    key: "freeze_authority",
    label: "Freeze authority",
    state: mintData.freezeAuthority ? "fail" : "pass",
    value: mintData.freezeAuthority ? shortenAddress(mintData.freezeAuthority.toBase58()) : "revoked",
    note: mintData.freezeAuthority ? "can block your sell" : "cannot freeze your account",
  });

  lines.push({
    key: "mint_authority",
    label: "Mint authority",
    state: mintData.mintAuthority ? "fail" : "pass",
    value: mintData.mintAuthority ? shortenAddress(mintData.mintAuthority.toBase58()) : "revoked",
    note: mintData.mintAuthority ? "supply can still be inflated" : "supply is fixed",
  });

  if (isToken2022) {
    const permanentDelegate = getExtensionData(ExtensionType.PermanentDelegate, mintData.tlvData);
    lines.push({
      key: "permanent_delegate",
      label: "Permanent delegate",
      state: permanentDelegate ? "fail" : "pass",
      value: permanentDelegate ? "present" : "none",
      note: permanentDelegate ? "built-in confiscation authority" : "no forced transfers",
    });

    const transferHook = getExtensionData(ExtensionType.TransferHook, mintData.tlvData);
    lines.push({
      key: "transfer_hook",
      label: "Transfer hook",
      state: transferHook ? "warn" : "pass",
      value: transferHook ? "present" : "none",
      note: transferHook ? "a program can intercept every transfer" : "no mid-trade logic",
    });
  }

  return lines;
}

// ---- Tier 2 — soft signals -------------------------------------------------

async function holderConcentration(connection: Connection, mint: PublicKey, supply: bigint, decimals: number): Promise<ScoreLine> {
  const largest = await connection.getTokenLargestAccounts(mint);
  const top = largest.value.slice(0, 10);

  const owners = await connection.getMultipleParsedAccounts(top.map((a) => a.address));
  const ownerPubkeys: PublicKey[] = [];
  for (const acc of owners.value) {
    const parsed = (acc?.data as { parsed?: { info?: { owner?: string } } } | undefined)?.parsed;
    if (parsed?.info?.owner) ownerPubkeys.push(new PublicKey(parsed.info.owner));
  }

  const ownerAccounts = ownerPubkeys.length
    ? await connection.getMultipleAccountsInfo(ownerPubkeys)
    : [];

  let poolExcludedAmount = BigInt(0);
  let total = BigInt(0);
  top.forEach((account, i) => {
    const amount = BigInt(account.amount);
    total += amount;
    const ownerAccount = ownerAccounts[i] as AccountInfo<Buffer> | null;
    const isPool = ownerAccount ? KNOWN_POOL_PROGRAMS.has(ownerAccount.owner.toBase58()) : false;
    if (isPool) poolExcludedAmount += amount;
  });

  const held = total - poolExcludedAmount;
  const pct = supply > BigInt(0) ? Number((held * BigInt(10000)) / supply) / 100 : 0;

  return {
    key: "top10_holders",
    label: "Top 10 holders",
    state: pct > 30 ? "warn" : "pass",
    value: `${pct.toFixed(1)}%`,
    note: "of supply, recognized pool accounts excluded",
  };
}

async function metadataMutability(connection: Connection, mint: PublicKey): Promise<ScoreLine> {
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(metadataPda);
  if (!info) {
    return {
      key: "metadata_mutable",
      label: "Metadata mutability",
      state: "unverified",
      value: "no metadata account",
      note: "nothing to check — token has no Metaplex metadata",
    };
  }

  const isMutable = parseMetadataIsMutable(info.data);
  return {
    key: "metadata_mutable",
    label: "Metadata mutability",
    state: isMutable ? "warn" : "pass",
    value: isMutable ? "mutable" : "locked",
    note: isMutable ? "name/symbol/image can still change" : "metadata is frozen",
  };
}

// Metaplex metadata account layout: key(1) + updateAuthority(32) + mint(32),
// then borsh strings (u32 length prefix) for name/symbol/uri, then
// sellerFeeBasisPoints(2), an optional creators vec, primarySaleHappened(1),
// isMutable(1). Hand-parsed to avoid pulling in the full metadata SDK for one flag.
function parseMetadataIsMutable(data: Buffer): boolean {
  let offset = 1 + 32 + 32;
  const readString = () => {
    const len = data.readUInt32LE(offset);
    offset += 4 + len;
  };
  readString(); // name
  readString(); // symbol
  readString(); // uri
  offset += 2; // sellerFeeBasisPoints
  const hasCreators = data[offset];
  offset += 1;
  if (hasCreators) {
    const creatorCount = data.readUInt32LE(offset);
    offset += 4 + creatorCount * (32 + 1 + 1);
  }
  offset += 1; // primarySaleHappened
  return data[offset] === 1;
}

async function tokenAge(connection: Connection, mint: PublicKey): Promise<ScoreLine> {
  let before: string | undefined;
  let oldest: { blockTime?: number | null } | null = null;
  let reachedGenesis = false;
  // Pagination is sequential (each page needs the prior page's cursor), so
  // this is the slowest check in the engine — capped low to keep the whole
  // score under ~1s. Understatement is still labeled honestly below.
  const maxPages = 2;

  for (let page = 0; page < maxPages; page++) {
    const sigs = await connection.getSignaturesForAddress(mint, { limit: 1000, before });
    if (sigs.length === 0) {
      reachedGenesis = true;
      break;
    }
    oldest = sigs[sigs.length - 1];
    if (sigs.length < 1000) {
      reachedGenesis = true;
      break;
    }
    before = sigs[sigs.length - 1].signature;
  }

  if (!oldest?.blockTime) {
    return {
      key: "token_age",
      label: "Token age",
      state: "unverified",
      value: "unknown",
      note: "signature history unavailable from this RPC",
    };
  }

  // A high-traffic mint can have more history than maxPages * 1000 signatures
  // reach back through. If we hit the scan cap without finding the genesis
  // signature, "oldest seen so far" understates the real age — surface that
  // honestly instead of asserting a number we can't back up.
  if (!reachedGenesis) {
    return {
      key: "token_age",
      label: "Token age",
      state: "unverified",
      value: `active before ${new Date(oldest.blockTime * 1000).toISOString().slice(0, 10)}`,
      note: `mint has ${maxPages * 1000}+ signatures — full history not traced, age is at least this old`,
    };
  }

  const ageMs = Date.now() - oldest.blockTime * 1000;
  const ageHours = ageMs / (1000 * 60 * 60);
  const label = ageHours < 24 ? `${ageHours.toFixed(1)}h` : `${(ageHours / 24).toFixed(0)}d`;

  return {
    key: "token_age",
    label: "Token age",
    state: ageHours < 1 ? "fail" : ageHours < 24 ? "warn" : "pass",
    value: label,
    note: "since oldest indexed activity on this mint",
  };
}

// Decodes the actual Raydium AMM v4 pool account via the layout published
// in @raydium-io/raydium-sdk (not hand-parsed from memory — a wrong byte
// offset would silently produce a false pubkey and a confidently wrong
// answer). Finds the LP mint, then checks who holds it: burned to the
// incinerator is verifiably locked; concentrated in one ordinary wallet is
// a real rug lever; spread across many holders is lower-risk by
// construction. Never asserts "locked" without seeing the burn.
async function raydiumLpLockStatus(connection: Connection, ammKey: string): Promise<ScoreLine | null> {
  const poolInfo = await connection.getAccountInfo(new PublicKey(ammKey));
  if (!poolInfo || poolInfo.owner.toBase58() !== RAYDIUM_V4_PROGRAM_ID) return null;

  const decoded = LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data);
  const lpMint = decoded.lpMint as PublicKey;

  const [supply, largest] = await Promise.all([
    connection.getTokenSupply(lpMint),
    connection.getTokenLargestAccounts(lpMint),
  ]);

  const top = largest.value[0];
  if (!top || supply.value.uiAmount === 0) {
    return {
      key: "lp_lock",
      label: "LP lock/burn status",
      state: "unverified",
      value: "no LP supply found",
      note: `Raydium pool ${shortenAddress(ammKey)} — could not read LP token supply`,
    };
  }

  const totalSupply = BigInt(supply.value.amount);
  const topPct = totalSupply > BigInt(0) ? (Number(BigInt(top.amount) * BigInt(10000) / totalSupply) / 100) : 0;

  const ownerInfo = await connection.getParsedAccountInfo(top.address);
  const ownerAddress = (
    ownerInfo.value?.data as { parsed?: { info?: { owner?: string } } } | undefined
  )?.parsed?.info?.owner;

  const isBurned =
    topPct >= 95 &&
    (ownerAddress === INCINERATOR_ADDRESS || ownerAddress === SystemProgram.programId.toBase58());

  if (isBurned) {
    return {
      key: "lp_lock",
      label: "LP lock/burn status",
      state: "pass",
      value: `burned (${topPct.toFixed(0)}%)`,
      note: "LP tokens sent to a burn address — liquidity cannot be pulled",
    };
  }

  if (topPct >= 90) {
    return {
      key: "lp_lock",
      label: "LP lock/burn status",
      state: "warn",
      value: `${topPct.toFixed(0)}% held by one wallet`,
      note: `${shortenAddress(ownerAddress ?? top.address.toBase58())} can remove this liquidity at any time`,
    };
  }

  return {
    key: "lp_lock",
    label: "LP lock/burn status",
    state: "pass",
    value: `distributed (top holder ${topPct.toFixed(0)}%)`,
    note: "no single wallet controls enough LP to pull all liquidity alone",
  };
}

// Both signals ride the same Jupiter quote — the "free-check insight" from
// the spec (priceImpactPct comes with every quote at zero extra RPC cost),
// and the route's final hop tells us which pool actually holds this mint's
// liquidity.
async function jupiterSignals(connection: Connection, mint: PublicKey): Promise<ScoreLine[]> {
  try {
    const quote = await getQuote({
      inputMint: SOL_MINT,
      outputMint: mint.toBase58(),
      amountLamports: 1_000_000_000, // nominal 1 SOL, for a consistent liquidity-depth reading
    });

    const impactPct = parseFloat(String(quote.priceImpactPct ?? "0"));
    const liquidityLine: ScoreLine = {
      key: "liquidity_depth",
      label: "Liquidity depth (1 SOL trade)",
      // Capped at "warn", never "fail" — the critical/ack-required banner is
      // reserved for Tier 1 hard-kills (mint/freeze authority etc). Thin
      // liquidity is a real risk signal but a different kind of risk.
      state: impactPct >= 1 ? "warn" : "pass",
      value: `${impactPct.toFixed(2)}% impact`,
      note: "price impact routing 1 SOL through the current best route",
    };

    const routePlan = quote.routePlan as
      | Array<{ swapInfo: { ammKey: string; label: string; outputMint: string } }>
      | undefined;
    const finalHop = routePlan
      ?.slice()
      .reverse()
      .find((hop) => hop.swapInfo.outputMint === mint.toBase58());

    let lpLine: ScoreLine;
    if (finalHop?.swapInfo.label.toLowerCase().includes("raydium")) {
      lpLine = (await raydiumLpLockStatus(connection, finalHop.swapInfo.ammKey)) ?? {
        key: "lp_lock",
        label: "LP lock/burn status",
        state: "unverified",
        value: `${finalHop.swapInfo.label} pool`,
        note: `pool ${shortenAddress(finalHop.swapInfo.ammKey)} — lock status not decoded, verify on the AMM's own UI`,
      };
    } else if (finalHop) {
      lpLine = {
        key: "lp_lock",
        label: "LP lock/burn status",
        state: "unverified",
        value: `${finalHop.swapInfo.label} pool`,
        note: `pool ${shortenAddress(finalHop.swapInfo.ammKey)} — concentrated-liquidity AMM, no fungible LP token to check`,
      };
    } else {
      lpLine = {
        key: "lp_lock",
        label: "LP lock/burn status",
        state: "unverified",
        value: "no route found",
        note: "Jupiter has no live route for this mint — likely no liquidity yet",
      };
    }

    return [liquidityLine, lpLine];
  } catch {
    return [
      {
        key: "liquidity_depth",
        label: "Liquidity depth (1 SOL trade)",
        state: "unverified",
        value: "unavailable",
        note: "Jupiter quote failed for this mint",
      },
      {
        key: "lp_lock",
        label: "LP lock/burn status",
        state: "unverified",
        value: "unavailable",
        note: "pool resolution requires a live Jupiter route",
      },
    ];
  }
}

// ---- Assembly ---------------------------------------------------------------

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function verdictFor(lines: ScoreLine[]): ScoreResult["verdict"] {
  if (lines.some((l) => l.state === "fail")) return "critical";
  if (lines.some((l) => l.state === "warn")) return "caution";
  return "clear";
}

export async function scoreMint(mintAddress: string): Promise<ScoreResult> {
  const mint = new PublicKey(mintAddress);
  const connection = getConnection();

  const mintAccountInfo = await connection.getAccountInfo(mint);
  if (!mintAccountInfo) throw new Error("Mint account not found — check the address.");
  const programId = mintAccountInfo.owner;
  const mintData = unpackMint(mint, mintAccountInfo, programId);

  const [tier1, holders, metadata, age, jupiter] = await Promise.all([
    tier1Checks(connection, mint),
    holderConcentration(connection, mint, mintData.supply, mintData.decimals),
    metadataMutability(connection, mint),
    tokenAge(connection, mint),
    jupiterSignals(connection, mint),
  ]);

  const lines = [...tier1, holders, metadata, age, ...jupiter];

  return {
    mint: mintAddress,
    verdict: verdictFor(lines),
    lines,
    checkedAt: new Date().toISOString(),
  };
}
