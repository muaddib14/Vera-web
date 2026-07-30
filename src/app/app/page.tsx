"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  PLATFORM_FEE_BPS,
  SOL_MINT,
  getQuote,
  getReferralFeeAccount,
  getSwapTransaction,
  referralFeeActive,
  type JupiterQuote,
} from "@/lib/jupiter";
import { sendBundle } from "@/lib/jito";
import { measureRealizedSwap, type MevComparison } from "@/lib/mev";
import type { ScoreResult } from "@/lib/scoring";

const LAMPORTS_PER_SOL = 1_000_000_000;
const JITO_TIP_LAMPORTS = 100_000; // 0.0001 SOL — fixed, not user-configurable in v1

const STATE_STYLE: Record<string, string> = {
  fail: "text-red-500",
  warn: "text-amber-500",
  pass: "text-[var(--accent-strong)]",
  unverified: "text-[var(--muted)]",
};

const STATE_MARK: Record<string, string> = {
  fail: "✗",
  warn: "!",
  pass: "✓",
  unverified: "?",
};

const VERDICT_BANNER: Record<ScoreResult["verdict"], { text: string; cls: string }> = {
  critical: {
    text: "CRITICAL — a Tier 1 check failed",
    cls: "border-red-500/40 bg-red-500/10 text-red-500",
  },
  caution: {
    text: "CAUTION — some signals need a closer look",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  },
  clear: {
    text: "No hard-kill signals found",
    cls: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  },
};

// wallet-adapter wraps real RPC/simulation failures in a generic
// "WalletSendTransactionError: Unexpected error" — the actual cause is
// usually attached as `.error` on the wrapper. Surface that instead.
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "error" in err) {
    const cause = (err as { error?: unknown }).error;
    if (cause instanceof Error && cause.message) return cause.message;
    if (typeof cause === "string" && cause) return cause;
  }
  if (err instanceof Error) return err.message;
  return "Swap failed.";
}

const INPUT =
  "rounded-lg border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]";
const LABEL = "text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]";

export default function AppPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const [outputMint, setOutputMint] = useState("");
  const [amountSol, setAmountSol] = useState("0.1");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
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

  async function handleGetQuote() {
    setStatus(null);
    setSignature(null);
    setQuote(null);
    setScore(null);
    setScoreError(null);
    setAckRisk(false);
    setMevResult(null);
    if (!outputMint) {
      setStatus("Paste a token mint address first.");
      return;
    }

    setBusy(true);
    setScoring(true);

    const amountLamports = Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL);

    // Quote and score fire together — the score panel never waits behind the quote.
    const quotePromise = getQuote({ inputMint: SOL_MINT, outputMint, amountLamports, includePlatformFee: true })
      .then(setQuote)
      .catch((err) => setStatus(err instanceof Error ? err.message : "Failed to fetch quote."))
      .finally(() => setBusy(false));

    const scorePromise = fetch(`/api/score/${outputMint}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to score mint.");
        setScore(body as ScoreResult);
      })
      .catch((err) => setScoreError(err instanceof Error ? err.message : "Failed to score mint."))
      .finally(() => setScoring(false));

    await Promise.all([quotePromise, scorePromise]);
  }

  async function handleSwap() {
    if (!quote || !publicKey) return;
    setBusy(true);
    setStatus(null);
    setMevResult(null);
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

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] font-sans">
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.jpeg"
              alt="VERA"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
            <span className="text-base font-semibold tracking-tight">VERA</span>
          </Link>
          <WalletMultiButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start lg:gap-12 lg:px-10 lg:py-16">
        {/* Trade panel */}
        <section className="flex w-full flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 lg:w-[26rem] lg:shrink-0">
          <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Trade</h1>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Amount (SOL)</span>
            <input
              className={INPUT}
              value={amountSol}
              onChange={(e) => setAmountSol(e.target.value)}
              inputMode="decimal"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Output token mint</span>
            <input
              className={`${INPUT} font-mono text-xs`}
              value={outputMint}
              onChange={(e) => setOutputMint(e.target.value)}
              placeholder="Paste a mint address"
            />
          </label>

          <button
            onClick={handleGetQuote}
            disabled={busy}
            className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-50"
          >
            Get quote
          </button>

          {quote && (
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--background)] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">You receive</span>
                <span className="font-mono text-[var(--foreground)]">{quote.outAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Price impact</span>
                <span className="font-mono text-[var(--foreground)]">{quote.priceImpactPct}%</span>
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
            <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] px-4 py-3 text-sm">
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
            <label className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-[var(--foreground)]">
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
              className="rounded-lg border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent-soft)] disabled:opacity-50"
            >
              Sign &amp; swap
            </button>
          )}

          {!publicKey && quote && (
            <p className="text-xs text-[var(--muted)]">Connect a wallet to sign this swap.</p>
          )}

          {status && <p className="text-xs text-[var(--muted)]">{status}</p>}

          {signature && (
            <a
              className="text-xs font-medium text-[var(--accent-strong)] underline underline-offset-2"
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction on Solscan
            </a>
          )}

          {measuring && (
            <p className="font-mono text-xs text-[var(--muted)]">Measuring realized fill…</p>
          )}

          {mevResult && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--background)] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Quoted out</span>
                <span className="font-mono text-[var(--foreground)]">{mevResult.quotedOutAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Realized out</span>
                <span className="font-mono text-[var(--foreground)]">{mevResult.realizedOutAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Delta vs quote</span>
                <span
                  className={`font-mono ${mevResult.deltaPct < 0 ? "text-red-500" : "text-[var(--accent-strong)]"}`}
                >
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

        {/* Score panel */}
        <section className="flex w-full flex-1 flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Safety score</h2>

          {!scoring && !score && !scoreError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-6 py-16 text-center">
              <p className="text-sm text-[var(--muted)]">
                Paste a mint and get a quote — the score renders here, in parallel.
              </p>
            </div>
          )}

          {scoring && !score && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="font-mono text-sm text-[var(--muted)]">
                Checking mint, freeze authority, holders…
              </p>
            </div>
          )}

          {scoreError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
              {scoreError}
            </p>
          )}

          {score && (
            <>
              <p
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${VERDICT_BANNER[score.verdict].cls}`}
              >
                {VERDICT_BANNER[score.verdict].text}
              </p>

              <ul className="flex flex-col divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] font-mono text-sm">
                {score.lines.map((line) => (
                  <li key={line.key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="flex items-center gap-2.5 text-[var(--foreground)]">
                      <span className={`w-3 text-center ${STATE_STYLE[line.state]}`}>
                        {STATE_MARK[line.state]}
                      </span>
                      <span className="font-sans">{line.label}</span>
                    </span>
                    <span className="text-right text-[var(--foreground)]">{line.value}</span>
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
                <span className="text-[var(--muted)]">
                  checked {new Date(score.checkedAt).toLocaleTimeString()}
                </span>
              </div>

              <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--muted)]">
                <li>A score is a snapshot, not a guarantee — a clean token today can still change tomorrow.</li>
                <li>An LP marked &quot;locked&quot; elsewhere can still lie — some lockers let the owner shorten the lock. Verify the contract, don&apos;t trust the badge.</li>
                <li>No rug-checker is unfoolable. Cross-reference before you size up a trade.</li>
                <li>This is a disclosure tool, not financial advice.</li>
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
