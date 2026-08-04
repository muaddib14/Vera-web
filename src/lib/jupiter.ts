import { PublicKey } from "@solana/web3.js";

const JUPITER_REFERRAL_PROGRAM_ID = new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3");

// JUPITER_API_KEY is intentionally NOT prefixed with NEXT_PUBLIC_ — Next.js
// only inlines NEXT_PUBLIC_ vars into the browser bundle, so this reads as
// undefined in client code and the key never ships to visitors. Calls made
// from the server (the scoring engine) get the authenticated, higher-limit
// endpoint; calls made from the browser (the swap UI) transparently fall
// back to the free public endpoint. Same functions, correct behavior either side.
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const JUP_BASE = JUPITER_API_KEY ? "https://api.jup.ag/swap/v1" : "https://lite-api.jup.ag/swap/v1";

function jupiterHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    ...(JUPITER_API_KEY ? { "x-api-key": JUPITER_API_KEY } : {}),
    ...extra,
  };
}

export const SOL_MINT = "So11111111111111111111111111111111111111112";

// Referral fee is opt-in via env vars, off by default. Enabling it requires
// registering a referral account at referral.jup.ag first — a fee account
// that doesn't actually exist on-chain would make every swap fail, so this
// stays inert (both vars unset) until that's done. When it's on, disclose
// it: a hidden fee would undercut a product whose whole pitch is disclosure.
export const PLATFORM_FEE_BPS = process.env.NEXT_PUBLIC_JUPITER_PLATFORM_FEE_BPS
  ? Number(process.env.NEXT_PUBLIC_JUPITER_PLATFORM_FEE_BPS)
  : undefined;
const REFERRAL_ACCOUNT = process.env.NEXT_PUBLIC_JUPITER_REFERRAL_ACCOUNT;

export function referralFeeActive() {
  return Boolean(PLATFORM_FEE_BPS && REFERRAL_ACCOUNT);
}

export function getReferralFeeAccount(outputMint: string): string | undefined {
  if (!REFERRAL_ACCOUNT) return undefined;
  const [feeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("referral_ata"), new PublicKey(REFERRAL_ACCOUNT).toBuffer(), new PublicKey(outputMint).toBuffer()],
    JUPITER_REFERRAL_PROGRAM_ID
  );
  return feeAccount.toBase58();
}

const JUP_TOKENS_BASE = "https://lite-api.jup.ag/tokens/v2";

export type TokenInfo = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  usdPrice?: number;
  website?: string;
  twitter?: string;
  mcap?: number;
  fdv?: number;
  liquidity?: number;
  holderCount?: number;
};

export async function searchTokens(query: string): Promise<TokenInfo[]> {
  const res = await fetch(`${JUP_TOKENS_BASE}/search?query=${query}`, { headers: jupiterHeaders() });
  if (!res.ok) return [];
  return (await res.json()) as TokenInfo[];
}

export async function getTokenInfo(mint: string): Promise<TokenInfo | null> {
  const results = await searchTokens(mint);
  return results.find((t) => t.id === mint) ?? results[0] ?? null;
}

type IntervalStats = { priceChange?: number; buyVolume?: number; sellVolume?: number };

export type TrendingToken = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  usdPrice?: number;
  mcap?: number;
  fdv?: number;
  liquidity?: number;
  holderCount?: number;
  isVerified?: boolean;
  stats5m?: IntervalStats;
  stats1h?: IntervalStats;
  stats6h?: IntervalStats;
  stats24h?: IntervalStats;
};

// Powers the Explore page — Jupiter's own "what's moving" list, not a
// hand-picked one. `interval` matches the windows Jupiter exposes (5m/1h/6h/24h).
export async function getTrendingTokens(interval: "5m" | "1h" | "6h" | "24h" = "24h", limit = 30): Promise<TrendingToken[]> {
  const res = await fetch(`${JUP_TOKENS_BASE}/toptrending/${interval}?limit=${limit}`, { headers: jupiterHeaders() });
  if (!res.ok) return [];
  return (await res.json()) as TrendingToken[];
}

export type PriceInfo = { usdPrice: number; priceChange24h?: number; liquidity?: number; decimals: number };

// Batched price lookup for Portfolio — one request for every held mint
// instead of N. Jupiter's price/v3 caps ids per request, so this chunks.
export async function getPrices(mints: string[]): Promise<Record<string, PriceInfo>> {
  if (mints.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < mints.length; i += 50) chunks.push(mints.slice(i, i + 50));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${chunk.join(",")}`, { headers: jupiterHeaders() });
      if (!res.ok) return {};
      return (await res.json()) as Record<string, PriceInfo>;
    })
  );
  return Object.assign({}, ...results);
}

export function formatTokenAmount(rawAmount: string, decimals: number): string {
  const value = Number(rawAmount) / 10 ** decimals;
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals > 6 ? 4 : decimals });
}

export function formatUsd(amount: number): string {
  if (amount < 0.01) return "<$0.01";
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  [key: string]: unknown;
};

export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amountLamports: number;
  slippageBps?: number;
  /** Only meaningful when a referral account is configured — see referralFeeActive(). */
  includePlatformFee?: boolean;
}): Promise<JupiterQuote> {
  const url = new URL(`${JUP_BASE}/quote`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", String(params.amountLamports));
  url.searchParams.set("slippageBps", String(params.slippageBps ?? 50));
  if (params.includePlatformFee && referralFeeActive()) {
    url.searchParams.set("platformFeeBps", String(PLATFORM_FEE_BPS));
  }

  const res = await fetch(url.toString(), { headers: jupiterHeaders() });
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getSwapTransaction(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
  /** Lamports tipped to a Jito validator so this swap routes through the
   * Block Engine instead of the public mempool. Omit to build a normal tx. */
  jitoTipLamports?: number;
  /** Token account that receives the platform fee — only pass this when the
   * quote was fetched with includePlatformFee, and only if that account has
   * actually been initialized via referral.jup.ag first. */
  feeAccount?: string;
}): Promise<{ swapTransaction: string }> {
  const res = await fetch(`${JUP_BASE}/swap`, {
    method: "POST",
    headers: jupiterHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      ...(params.jitoTipLamports
        ? { prioritizationFeeLamports: { jitoTipLamports: params.jitoTipLamports } }
        : {}),
      ...(params.feeAccount ? { feeAccount: params.feeAccount } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap build failed: ${res.status} ${await res.text()}`);
  return res.json();
}
