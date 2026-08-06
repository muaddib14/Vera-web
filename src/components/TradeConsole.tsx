"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  PLATFORM_FEE_BPS,
  SOL_MINT,
  formatTokenAmount,
  formatUsd,
  getQuote,
  getReferralFeeAccount,
  getSwapTransaction,
  getTokenInfo,
  referralFeeActive,
} from "@/lib/jupiter";
import type { JupiterQuote, TokenInfo } from "@/lib/jupiter";
import { sendBundle } from "@/lib/jito";
import { measureRealizedSwap } from "@/lib/mev";
import type { MevComparison } from "@/lib/mev";
import type { ScoreResult } from "@/lib/scoring";
import { StatusIcon, pillClassFor } from "@/components/StatusIcon";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

const LAMPORTS_PER_SOL = 1_000_000_000;
const JITO_TIP_LAMPORTS = 100_000; // 0.0001 SOL — fixed, not user-configurable in v1

// ponytail: dry-run switch for rehearsing the record-flow with no SOL at
// risk — Jupiter has no devnet liquidity, so this fakes the swap step only
// (quote/checklist/wallet-connect stay real). Must be off for the actual
// recording; see .env.local.
const MOCK_SWAP = process.env.NEXT_PUBLIC_MOCK_SWAP === "true";

// Jupiter's API returns no expiry field on a quote — staleness is a
// convention we impose client-side because meme-coin prices move fast.
// 20s matches the window Jupiter's own swap UI treats as "stale, refresh me".
const QUOTE_TTL_MS = 20_000;

const SLIPPAGE_PRESETS: { bps: number; label: string }[] = [
  { bps: 10, label: "0.1%" },
  { bps: 50, label: "0.5%" },
  { bps: 100, label: "1%" },
];

const VERDICT_STAMP: Record<ScoreResult["verdict"], { label: string; text: string; cls: string }> = {
  critical: {
    label: "REJECTED",
    text: "CRITICAL — a Tier 1 check failed",
    cls: "border-red-400 text-red-400",
  },
  caution: {
    label: "REVIEW",
    text: "CAUTION — some signals need a closer look",
    cls: "border-amber-400 text-amber-400",
  },
  clear: {
    label: "PASSED",
    text: "No hard-kill signals found",
    cls: "border-[var(--accent-strong)] text-[var(--accent-strong)]",
  },
};

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "error" in err) {
    const cause = (err as { error?: unknown }).error;
    if (cause instanceof Error && cause.message) return cause.message;
    if (typeof cause === "string" && cause) return cause;
  }
  if (err instanceof Error) return err.message;
  return "Swap failed.";
}

// Jupiter's priceImpactPct has no severity of its own — a 0.01% and a 40%
// trade render identically as plain text otherwise. This is the one number
// most likely to matter on a thin meme-coin pool, so it gets a color.
function impactSeverity(pctStr: string): { cls: string; label: string } {
  const pct = Math.abs(parseFloat(pctStr));
  if (isNaN(pct)) return { cls: "text-[var(--muted)]", label: "" };
  if (pct >= 5) return { cls: "text-red-400", label: "high" };
  if (pct >= 1) return { cls: "text-amber-400", label: "moderate" };
  return { cls: "text-[var(--accent-strong)]", label: "low" };
}

// Jupiter returns priceImpactPct as a raw decimal string (sometimes 20+
// digits long) — display-only rounding, the unrounded value still goes to
// the API for the actual swap build.
function formatPct(pctStr: string): string {
  const pct = parseFloat(pctStr);
  if (isNaN(pct)) return pctStr;
  if (pct !== 0 && Math.abs(pct) < 0.01) return "<0.01";
  return pct.toFixed(2);
}

const POPULAR_TOKENS = [
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { symbol: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "VERA", mint: "5N78M6meJZN2vR7gnKNkiX64JcuHTRFTT9EN7EGBpump" },
];

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
    </svg>
  );
}

const LABEL = "text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]";

// The live trade + checklist pair — the actual product, not a mockup of it.
// Shared between the full /app console and the marketing hero, so "the swap
// is right there" is literally true instead of a screenshot pretending it is.
export default function TradeConsole({ initialMint }: { initialMint?: string } = {}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const [outputMint, setOutputMint] = useState(initialMint ?? "");
  const [amountSol, setAmountSol] = useState("0.1");
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [ackRisk, setAckRisk] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [useJito, setUseJito] = useState(true);
  const [mevResult, setMevResult] = useState<MevComparison | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solInfo, setSolInfo] = useState<TokenInfo | null>(null);
  const [outputInfo, setOutputInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    getTokenInfo(SOL_MINT).then(setSolInfo);
  }, []);

  // Coming from a token detail page — run the quote immediately instead of
  // making the visitor paste the mint they just clicked on.
  useEffect(() => {
    if (initialMint) handleGetQuote(initialMint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMint]);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    connection.getBalance(publicKey).then((lamports) => {
      if (!cancelled) setSolBalance(lamports / LAMPORTS_PER_SOL);
    });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, signature]);

  // Ticks once a second only while a quote is on screen — drives the
  // freshness countdown without a live-updating clock the rest of the time.
  useEffect(() => {
    if (!quoteFetchedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quoteFetchedAt]);

  const quoteAgeMs = quoteFetchedAt ? now - quoteFetchedAt : null;
  const quoteStale = quoteAgeMs !== null && quoteAgeMs >= QUOTE_TTL_MS;
  const quoteRemainingS = quoteAgeMs !== null ? Math.max(0, Math.ceil((QUOTE_TTL_MS - quoteAgeMs) / 1000)) : null;

  async function handleGetQuote(mintOverride?: string) {
    const targetMint = mintOverride ?? outputMint;
    setStatus(null);
    setSignature(null);
    setQuote(null);
    setQuoteFetchedAt(null);
    setScore(null);
    setScoreError(null);
    setAckRisk(false);
    setMevResult(null);
    setOutputInfo(null);
    if (!targetMint) {
      setStatus("Paste a token mint address first.");
      return;
    }
    try {
      new PublicKey(targetMint);
    } catch {
      setStatus("That doesn't look like a valid mint address.");
      return;
    }
    const amountNum = parseFloat(amountSol);
    if (!amountSol || isNaN(amountNum) || amountNum <= 0) {
      setStatus("Enter an amount greater than 0.");
      return;
    }
    if (solBalance !== null && amountNum > solBalance) {
      setStatus(`You only have ${solBalance.toFixed(4)} SOL.`);
      return;
    }

    if (mintOverride) setOutputMint(mintOverride);

    setBusy(true);
    setScoring(true);

    const amountLamports = Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL);

    // Quote and score fire together — the score panel never waits behind the quote.
    const quotePromise = getQuote({ inputMint: SOL_MINT, outputMint: targetMint, amountLamports, slippageBps, includePlatformFee: true })
      .then((q) => {
        setQuote(q);
        setQuoteFetchedAt(Date.now());
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : "Failed to fetch quote."))
      .finally(() => setBusy(false));

    getTokenInfo(targetMint).then(setOutputInfo);

    const scorePromise = fetch(`/api/score/${targetMint}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to score mint.");
        setScore(body as ScoreResult);
      })
      .catch((err) => setScoreError(err instanceof Error ? err.message : "Failed to score mint."))
      .finally(() => setScoring(false));

    await Promise.all([quotePromise, scorePromise]);
  }

  // Re-prices without re-running the safety check — mint safety doesn't
  // change in 20 seconds, only the market does. Manual, not silent/auto:
  // a product built on disclosure shouldn't swap numbers under you unasked.
  async function refreshQuote() {
    if (!outputMint) return;
    const amountNum = parseFloat(amountSol);
    if (!amountSol || isNaN(amountNum) || amountNum <= 0) return;
    setBusy(true);
    try {
      const q = await getQuote({
        inputMint: SOL_MINT,
        outputMint,
        amountLamports: Math.round(amountNum * LAMPORTS_PER_SOL),
        slippageBps,
        includePlatformFee: true,
      });
      setQuote(q);
      setQuoteFetchedAt(Date.now());
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to refresh quote.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSwap() {
    if (!quote || !publicKey) return;
    setBusy(true);
    setStatus(null);
    setMevResult(null);

    if (MOCK_SWAP) {
      setStatus("Sent. Confirming on-chain…");
      await new Promise((r) => setTimeout(r, 1400));
      setSignature("MOCK" + Date.now().toString(36).toUpperCase());
      setStatus("Confirmed.");
      setBusy(false);
      return;
    }

    try {
      const { swapTransaction } = await getSwapTransaction({
        quoteResponse: quote,
        userPublicKey: publicKey.toBase58(),
        jitoTipLamports: useJito ? JITO_TIP_LAMPORTS : undefined,
        feeAccount: referralFeeActive() ? getReferralFeeAccount(outputMint) : undefined,
      });
      const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));

      let sig: string;
      if (useJito && signTransaction) {
        const signedTx = await signTransaction(tx);
        sig = bs58.encode(signedTx.signatures[0]);
        setStatus("Submitting via Jito bundle — bypasses the public mempool.");
        await sendBundle(Buffer.from(signedTx.serialize()).toString("base64"));
      } else {
        sig = await sendTransaction(tx, connection);
      }

      setSignature(sig);
      setStatus("Sent. Confirming on-chain…");
      setBusy(false);

      setMeasuring(true);
      try {
        const comparison = await measureRealizedSwap({
          connection,
          signature: sig,
          owner: publicKey.toBase58(),
          outputMint,
          quotedOutAmount: quote.outAmount,
        });
        setMevResult(comparison);
        setStatus("Confirmed.");
      } catch (measureErr) {
        setStatus(
          measureErr instanceof Error
            ? `Confirmed, but couldn't measure realized amount: ${measureErr.message}`
            : "Confirmed, but couldn't measure realized amount."
        );
      } finally {
        setMeasuring(false);
      }
    } catch (err) {
      setStatus(extractErrorMessage(err));
      setBusy(false);
    }
  }

  const needsAck = score?.verdict === "critical" && !ackRisk;
  const canSwap = quote && publicKey && !needsAck;
  const amountValid = amountSol !== "" && !isNaN(parseFloat(amountSol)) && parseFloat(amountSol) > 0;
  const minReceived =
    quote && outputInfo
      ? formatTokenAmount(String(Math.floor((Number(quote.outAmount) * (10_000 - slippageBps)) / 10_000)), outputInfo.decimals)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
      {/* Trade panel — one seamless shell, no border, no chrome, mirrors
          Uniswap's homepage widget instead of looking like a console tool. */}
      <section className="flex w-full flex-col gap-2 rounded-[32px] bg-[var(--surface)] p-2">
        <div className="rounded-[28px] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between">
            <span className={LABEL}>Sell</span>
            {publicKey && (
              <button
                type="button"
                onClick={() => solBalance !== null && setAmountSol(String(Math.max(solBalance - 0.01, 0)))}
                className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent-strong)] hover:underline"
              >
                Balance: {solBalance !== null ? solBalance.toFixed(4) : "—"} SOL{" "}
                <span className="text-[var(--accent-strong)]">Max</span>
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <input
              className="w-full bg-transparent text-4xl font-semibold tracking-tight text-[var(--foreground)] outline-none"
              value={amountSol}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) setAmountSol(v);
              }}
              inputMode="decimal"
            />
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface)] py-2 pl-2 pr-3.5 text-sm font-semibold text-[var(--foreground)] shadow-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] text-[0.6rem] font-black text-white">
                S
              </span>
              SOL
            </span>
          </div>
          {solInfo?.usdPrice && !isNaN(parseFloat(amountSol)) && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatUsd(parseFloat(amountSol) * solInfo.usdPrice)}
            </p>
          )}
        </div>

        <div className="relative -my-3 flex justify-center">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-4 border-[var(--surface)] bg-[var(--surface-2)] text-[var(--muted)]">
            ↓
          </span>
        </div>

        <div className="rounded-[28px] bg-[var(--surface-2)] p-4">
          <span className={LABEL}>Buy</span>
          <input
            className="mt-2 w-full bg-transparent font-mono text-sm text-[var(--foreground)] outline-none"
            value={outputMint}
            onChange={(e) => setOutputMint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGetQuote();
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").trim();
              if (pasted) {
                e.preventDefault();
                setOutputMint(pasted);
                handleGetQuote(pasted);
              }
            }}
            placeholder="Paste a mint address"
          />
          {outputInfo && (
            <div className="mt-2 flex items-center gap-2 border-t border-[var(--line)] pt-2">
              {outputInfo.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={outputInfo.icon} alt="" className="h-5 w-5 rounded-full" />
              )}
              <span className="text-sm font-semibold text-[var(--foreground)]">{outputInfo.symbol}</span>
              <span className="text-xs text-[var(--muted)]">{outputInfo.name}</span>
            </div>
          )}
          {!outputMint && (
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_TOKENS.map((token) => (
                <button
                  key={token.mint}
                  type="button"
                  onClick={() => handleGetQuote(token.mint)}
                  className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-[var(--muted)]">Slippage</span>
          <div className="flex gap-1">
            {SLIPPAGE_PRESETS.map((p) => (
              <button
                key={p.bps}
                type="button"
                onClick={() => setSlippageBps(p.bps)}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                  slippageBps === p.bps
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleGetQuote()}
          disabled={busy || !outputMint || !amountValid}
          className="flex items-center justify-center gap-2 rounded-full bg-[var(--background)] px-4 py-4 text-base font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent-soft)] disabled:opacity-50"
        >
          {busy && !quote && <Spinner />}
          {!outputMint ? "Paste a mint to start" : "Get quote"}
        </button>

        {quote && (
          <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Quote freshness</span>
              {quoteStale ? (
                <button
                  type="button"
                  onClick={refreshQuote}
                  className="font-semibold text-amber-400 underline underline-offset-2"
                >
                  Stale — refresh
                </button>
              ) : (
                <span className="font-mono text-[var(--muted)]">{quoteRemainingS}s</span>
              )}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className={`h-1 rounded-full transition-all duration-1000 ease-linear ${quoteStale ? "bg-amber-500" : "bg-[var(--accent)]"}`}
                style={{ width: `${quoteRemainingS !== null ? (quoteRemainingS / (QUOTE_TTL_MS / 1000)) * 100 : 0}%` }}
              />
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-[var(--muted)]">You receive</span>
              <span className="text-right font-mono text-[var(--foreground)]">
                {outputInfo ? formatTokenAmount(quote.outAmount, outputInfo.decimals) : quote.outAmount}{" "}
                {outputInfo?.symbol}
                {outputInfo?.usdPrice && (
                  <span className="ml-1 text-[var(--muted)]">
                    ({formatUsd((Number(quote.outAmount) / 10 ** outputInfo.decimals) * outputInfo.usdPrice)})
                  </span>
                )}
              </span>
            </div>
            {minReceived && (
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Minimum received</span>
                <span className="font-mono text-[var(--foreground)]">
                  {minReceived} {outputInfo?.symbol}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Price impact</span>
              <span className={`font-mono ${impactSeverity(quote.priceImpactPct).cls}`}>
                {formatPct(quote.priceImpactPct)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Route</span>
              <span className="text-[var(--foreground)]">Jupiter{useJito ? " · Jito bundle" : ""}</span>
            </div>
            {referralFeeActive() && (
              <div className="flex justify-between border-t border-[var(--line)] pt-2 text-xs">
                <span className="text-[var(--muted)]">Platform fee (disclosed)</span>
                <span className="font-mono text-[var(--foreground)]">
                  {((PLATFORM_FEE_BPS ?? 0) / 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {quote && (
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm">
            <span className="flex flex-col">
              <span className="font-medium text-[var(--foreground)]">Route via Jito</span>
              <span className="text-xs text-[var(--muted)]">
                Bundled straight to a validator — skips the public mempool a sandwich bot reads.
              </span>
            </span>
            <input
              type="checkbox"
              checked={useJito}
              onChange={(e) => setUseJito(e.target.checked)}
              className="accent-[var(--accent)]"
            />
          </label>
        )}

        {needsAck && (
          <label className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={ackRisk}
              onChange={(e) => setAckRisk(e.target.checked)}
              className="mt-0.5 accent-red-500"
            />
            I understand this token failed a hard-kill check and want to proceed anyway.
          </label>
        )}

        {quote && publicKey && (
          <button
            onClick={handleSwap}
            disabled={busy || !canSwap}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              needsAck
                ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                : "border-[var(--accent)] text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
            }`}
          >
            {busy && <Spinner />}
            {needsAck ? "Acknowledge risk to swap" : "Sign & swap"}
          </button>
        )}

        {!publicKey && quote && <WalletMultiButton />}

        {status && status !== "Confirmed." && <p className="text-xs text-[var(--muted)]">{status}</p>}

        {signature && status === "Confirmed." && (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-on)]">
              ✓
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--accent-strong)]">Swap confirmed</span>
              <a
                className="text-xs font-medium text-[var(--accent-strong)] underline underline-offset-2"
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Solscan
              </a>
            </div>
          </div>
        )}

        {signature && status !== "Confirmed." && (
          <a
            className="text-xs font-medium text-[var(--accent-strong)] underline underline-offset-2"
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View transaction on Solscan
          </a>
        )}

        {measuring && <p className="font-mono text-xs text-[var(--muted)]">Measuring realized fill…</p>}

        {mevResult && (
          <div className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              MEV comparison
            </p>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Quoted out</span>
              <span className="font-mono text-[var(--foreground)]">
                {outputInfo ? formatTokenAmount(mevResult.quotedOutAmount, outputInfo.decimals) : mevResult.quotedOutAmount}{" "}
                {outputInfo?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Realized out</span>
              <span className="font-mono text-[var(--foreground)]">
                {outputInfo ? formatTokenAmount(mevResult.realizedOutAmount, outputInfo.decimals) : mevResult.realizedOutAmount}{" "}
                {outputInfo?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Delta vs quote</span>
              <span className={`font-mono ${mevResult.deltaPct < 0 ? "text-red-500" : "text-[var(--accent-strong)]"}`}>
                {mevResult.deltaPct >= 0 ? "+" : ""}
                {mevResult.deltaPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              A real per-swap measurement, not an advertised static multiplier.
            </p>
          </div>
        )}
      </section>

      {/* Score panel — VERA's differentiator, but it only takes up space
          once there's something to show. Before that, the trade card is
          the whole page, same as Uniswap's homepage. */}
      {(scoring || score || scoreError) && (
      <section className="flex w-full flex-col gap-5 rounded-[32px] border-t-4 border-t-[var(--accent)] bg-[var(--surface)] p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Checklist</p>
          <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Safety score</h2>
        </div>

        {scoring && !score && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-mono text-sm text-[var(--muted)]">Checking mint, freeze authority, holders…</p>
          </div>
        )}

        {scoreError && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
            {scoreError}
          </p>
        )}

        {score && (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3">
              <span
                className={`rounded border-2 px-2 py-0.5 text-xs font-black uppercase tracking-[0.15em] ${VERDICT_STAMP[score.verdict].cls}`}
                style={{ transform: "rotate(-4deg)" }}
              >
                {VERDICT_STAMP[score.verdict].label}
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)]">{VERDICT_STAMP[score.verdict].text}</span>
            </div>

            <ul className="flex flex-col divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--background)] font-mono text-sm">
              {score.lines.map((line) => (
                <li key={line.key} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="flex items-start gap-2.5 text-[var(--foreground)]">
                    <span className="mt-0.5 w-3 shrink-0 text-center">
                      <StatusIcon state={line.state} />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-sans">{line.label}</span>
                      <span className="font-sans text-xs text-[var(--muted)]">{line.note}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-right text-xs font-semibold ${pillClassFor(line.state)}`}>
                    {line.value}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between text-xs">
              <a
                className="font-medium text-[var(--accent-strong)] underline underline-offset-2"
                href={`https://solscan.io/token/${outputMint}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify every line on Solscan
              </a>
              <span className="text-[var(--muted)]">checked {new Date(score.checkedAt).toLocaleTimeString()}</span>
            </div>

            <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
              <li>A score is a snapshot, not a guarantee — a clean token today can still change tomorrow.</li>
              <li>
                An LP marked &quot;locked&quot; elsewhere can still lie — some lockers let the owner shorten the lock.
                Verify the contract, don&apos;t trust the badge.
              </li>
              <li>No rug-checker is unfoolable. Cross-reference before you size up a trade.</li>
              <li>This is a disclosure tool, not financial advice.</li>
            </ul>
          </>
        )}
      </section>
      )}
    </div>
  );
}
