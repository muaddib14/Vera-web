"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import SiteHeader from "@/components/SiteHeader";
import Skeleton from "@/components/Skeleton";
import ConnectButton from "@/components/ConnectButton";
import { getTokenInfo, getPrices, formatUsd } from "@/lib/jupiter";
import type { TokenInfo, PriceInfo } from "@/lib/jupiter";

type Holding = { mint: string; amount: number; info: TokenInfo | null; price: PriceInfo | null };

// Illustrative only, same as the mock checklist/MEV cards on the landing
// page — clearly labeled "Demo wallet", not real data pretending to be real.
const DEMO_HOLDINGS = [
  { symbol: "SOL", name: "Solana", balance: "12.40", price: "$188.20", value: "$2,333.68", pnl: "+$142.05", pnlPct: "+6.5%", up: true },
  { symbol: "USDC", name: "USD Coin", balance: "540.00", price: "$1.00", value: "$540.00", pnl: "$0.00", pnlPct: "0%", up: true },
  { symbol: "JUP", name: "Jupiter", balance: "1,205.30", price: "$0.19", value: "$228.85", pnl: "-$14.22", pnlPct: "-5.8%", up: false },
  { symbol: "BONK", name: "Bonk", balance: "8,204,112", price: "<$0.01", value: "$91.44", pnl: "+$9.10", pnlPct: "+11.1%", up: true },
];
const DEMO_TOTAL = "$3,193.97";
const DEMO_CHANGE = "+$121.07 (3.9%) today";

const DEMO_SPARK = "M0,44 L20,38 L40,42 L60,26 L80,30 L100,14 L120,20 L140,8 L160,12 L180,2";

function DemoPortfolio() {
  return (
    <div aria-hidden className="pointer-events-none flex select-none flex-col gap-2 rounded-[28px] bg-[var(--surface)] p-2 opacity-50">
      <div className="flex flex-col gap-2 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Demo wallet
        </span>
        <span className="font-sans text-2xl font-extrabold text-[var(--foreground)]">{DEMO_TOTAL}</span>
        <span className="text-xs font-semibold text-[var(--accent-strong)]">{DEMO_CHANGE}</span>
        <svg viewBox="0 0 180 48" className="mt-2 h-16 w-full max-w-sm">
          <path d={DEMO_SPARK} fill="none" stroke="var(--accent-strong)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] sm:grid">
        <span>Token</span>
        <span className="text-right">Price</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Value</span>
        <span className="text-right">Unrealized P/L</span>
      </div>

      {DEMO_HOLDINGS.map((h) => (
        <div key={h.symbol} className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 rounded-2xl px-4 py-3 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <span className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--muted)]">
              {h.symbol.slice(0, 2)}
            </span>
            <span className="flex flex-col overflow-hidden">
              <span className="truncate font-semibold text-[var(--foreground)]">{h.symbol}</span>
              <span className="truncate text-xs text-[var(--muted)]">{h.name}</span>
            </span>
          </span>
          <span className="hidden text-right font-mono text-[var(--foreground)] sm:block">{h.price}</span>
          <span className="text-right font-mono text-[var(--foreground)]">{h.balance}</span>
          <span className="hidden text-right font-mono text-[var(--foreground)] sm:block">{h.value}</span>
          <span className={`hidden text-right font-mono sm:block ${h.up ? "text-[var(--accent-strong)]" : "text-red-400"}`}>
            {h.pnl} <span className="text-xs">{h.pnlPct}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PortfolioPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setHoldings(null);
      return;
    }
    let cancelled = false;
    setHoldings(null);

    (async () => {
      const [legacy, token2022] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
      ]);

      const balances = [...legacy.value, ...token2022.value]
        .map((a) => {
          const parsed = a.account.data.parsed.info;
          return { mint: parsed.mint as string, amount: parsed.tokenAmount.uiAmount as number };
        })
        .filter((b) => b.amount > 0);

      if (cancelled) return;
      if (balances.length === 0) {
        setHoldings([]);
        return;
      }

      const mints = balances.map((b) => b.mint);
      const [prices, infos] = await Promise.all([getPrices(mints), Promise.all(mints.map((m) => getTokenInfo(m)))]);
      if (cancelled) return;

      const rows: Holding[] = balances.map((b, i) => ({
        mint: b.mint,
        amount: b.amount,
        info: infos[i],
        price: prices[b.mint] ?? null,
      }));
      rows.sort((a, b) => (b.price?.usdPrice ?? 0) * b.amount - (a.price?.usdPrice ?? 0) * a.amount);
      setHoldings(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  const totalValue = holdings?.reduce((sum, h) => sum + h.amount * (h.price?.usdPrice ?? 0), 0);

  return (
    <div className="landing-dark flex flex-1 flex-col font-sans">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12 lg:px-12 lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Portfolio</p>
          <h1 className="font-sans text-3xl font-extrabold tracking-tighter text-[var(--foreground)]">Your tokens.</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Read straight off your wallet — every SPL and Token-2022 account with a balance. No cost-basis
            tracking here yet, so the real view below shows value, not unrealized P/L.
          </p>
        </div>

        {!publicKey && (
          <div className="flex flex-col items-center gap-6">
            <DemoPortfolio />
            <div className="flex items-center gap-4 rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
              <span className="text-sm font-semibold text-[var(--muted)]">Track your portfolio</span>
              <ConnectButton />
            </div>
          </div>
        )}

        {publicKey && (
          <div className="flex flex-col gap-2 rounded-[28px] bg-[var(--surface)] p-2">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--muted)]">Total value</span>
              {totalValue === undefined ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className="font-sans text-xl font-extrabold text-[var(--foreground)]">{formatUsd(totalValue)}</span>
              )}
            </div>

            <div className="hidden grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] sm:grid">
              <span>Token</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Value</span>
            </div>

            {holdings === null &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl px-4 py-3">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="ml-auto h-3.5 w-16" />
                </div>
              ))}

            {holdings?.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                No token balances found in this wallet yet.
              </p>
            )}

            {holdings?.map((h) => (
              <div
                key={h.mint}
                className="grid grid-cols-[2fr_1fr] items-center gap-4 rounded-2xl px-4 py-3 text-sm sm:grid-cols-[2fr_1fr_1fr]"
              >
                <span className="flex items-center gap-3 overflow-hidden">
                  {h.info?.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.info.icon} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--muted)]">
                      {(h.info?.symbol ?? "?").slice(0, 2)}
                    </span>
                  )}
                  <span className="flex flex-col overflow-hidden">
                    <span className="truncate font-semibold text-[var(--foreground)]">{h.info?.symbol ?? "Unknown"}</span>
                    <span className="truncate text-xs text-[var(--muted)]">{h.info?.name ?? `${h.mint.slice(0, 4)}…${h.mint.slice(-4)}`}</span>
                  </span>
                </span>
                <span className="text-right font-mono text-[var(--foreground)]">
                  {h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
                <span className="hidden text-right font-mono text-[var(--foreground)] sm:block">
                  {h.price ? formatUsd(h.amount * h.price.usdPrice) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
