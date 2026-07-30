import { PublicKey } from "@solana/web3.js";

const JUP_BASE = "https://lite-api.jup.ag/swap/v1";
const JUPITER_REFERRAL_PROGRAM_ID = new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3");

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

  const res = await fetch(url.toString());
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
    headers: { "Content-Type": "application/json" },
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
