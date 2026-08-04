"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Skeleton from "@/components/Skeleton";
import TradeConsole from "@/components/TradeConsole";
import PriceChart from "@/components/PriceChart";
import TokenTrades from "@/components/TokenTrades";
import { getTokenInfo, getPrices, formatUsd } from "@/lib/jupiter";
import type { TokenInfo, PriceInfo } from "@/lib/jupiter";
import { findMostLiquidPool } from "@/lib/charts";

function formatCompactUsd(n?: number) {
  if (!n) return "—";
  return "$" + new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

function StatBox({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-xs text-[var(--muted)]">{label}</span>
      {loading ? (
        <Skeleton className="h-5 w-20 !rounded-lg" />
      ) : (
        <span className="truncate font-mono text-base text-[var(--foreground)]">{value}</span>
      )}
    </div>
  );
}

export default function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = use(params);
  const [info, setInfo] = useState<TokenInfo | null | undefined>(undefined);
  const [price, setPrice] = useState<PriceInfo | null>(null);
  const [pool, setPool] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setInfo(undefined);
    setPrice(null);
    setPool(undefined);
    Promise.all([getTokenInfo(mint), getPrices([mint])]).then(([tokenInfo, prices]) => {
      if (cancelled) return;
      setInfo(tokenInfo);
      setPrice(prices[mint] ?? null);
    });
    findMostLiquidPool(mint).then((p) => {
      if (!cancelled) setPool(p);
    });
    return () => {
      cancelled = true;
    };
  }, [mint]);

  const notFound = info === null;
  const loadingInfo = info === undefined;

  return (
    <div className="landing-dark flex flex-1 flex-col font-sans">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-12 lg:px-12 lg:py-16">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/explore" className="hover:text-[var(--foreground)]">
            Explore
          </Link>
          <span>›</span>
          <span className="font-semibold text-[var(--foreground)]">{loadingInfo ? "…" : info?.symbol ?? mint.slice(0, 4)}</span>
        </div>

        {notFound && (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            Jupiter doesn&apos;t recognize this mint. Double-check the address.
          </p>
        )}

        {!notFound && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {loadingInfo ? (
                  <Skeleton className="h-11 w-11" />
                ) : info?.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.icon} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--muted)]">
                    {info?.symbol.slice(0, 2)}
                  </span>
                )}
                <div className="flex flex-col gap-0.5">
                  {loadingInfo ? (
                    <Skeleton className="h-5 w-32 !rounded-lg" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <h1 className="font-sans text-xl font-extrabold tracking-tight text-[var(--foreground)]">{info?.name}</h1>
                      <span className="text-sm text-[var(--muted)]">{info?.symbol}</span>
                    </span>
                  )}
                  <span className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    Solana
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-2">
                {loadingInfo ? (
                  <Skeleton className="h-8 w-28 !rounded-lg" />
                ) : (
                  <>
                    <span className="font-sans text-2xl font-extrabold tracking-tighter text-[var(--foreground)]">
                      {price ? formatUsd(price.usdPrice) : "—"}
                    </span>
                    {price?.priceChange24h !== undefined && (
                      <span className={`pb-1 text-sm font-semibold ${price.priceChange24h >= 0 ? "text-[var(--accent-strong)]" : "text-red-400"}`}>
                        {price.priceChange24h >= 0 ? "+" : ""}
                        {price.priceChange24h.toFixed(2)}% (24h)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
              <div className="flex min-w-0 flex-col gap-6">
                <PriceChart pool={pool} />

                <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-[28px] bg-[var(--surface)] p-6 sm:grid-cols-4">
                  <StatBox label="Liquidity" value={formatCompactUsd(info?.liquidity)} loading={loadingInfo} />
                  <StatBox label="Market cap" value={formatCompactUsd(info?.mcap)} loading={loadingInfo} />
                  <StatBox label="FDV" value={formatCompactUsd(info?.fdv)} loading={loadingInfo} />
                  <StatBox label="Holders" value={info?.holderCount?.toLocaleString() ?? "—"} loading={loadingInfo} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://solscan.io/token/${mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Solscan ↗
                  </a>
                  {info?.website && (
                    <a
                      href={info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      Website ↗
                    </a>
                  )}
                  {info?.twitter && (
                    <a
                      href={info.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      Twitter ↗
                    </a>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Transactions</p>
                  <TokenTrades pool={pool} mint={mint} symbol={info?.symbol ?? "TOKEN"} />
                </div>
              </div>

              <TradeConsole initialMint={mint} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
