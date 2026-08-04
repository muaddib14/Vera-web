"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Skeleton from "@/components/Skeleton";
import { getTrendingTokens, formatUsd } from "@/lib/jupiter";
import type { TrendingToken } from "@/lib/jupiter";

const INTERVALS = [
  { value: "5m", label: "5m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
] as const;

function formatCompact(n?: number) {
  if (n === undefined) return "—";
  return "$" + new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

function volumeOf(t: TrendingToken) {
  const s = t.stats24h;
  if (!s) return undefined;
  return (s.buyVolume ?? 0) + (s.sellVolume ?? 0);
}

function ChangeCell({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-[var(--muted)]">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${up ? "text-[var(--accent-strong)]" : "text-red-400"}`}>
      <span className="text-[0.6rem]">{up ? "▲" : "▼"}</span>
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

const VerifiedBadge = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" fill="currentColor" aria-label="Verified">
    <path d="M8 0l1.8 1.4 2.3-.3 1 2.1L15 4.4l-.7 2.2.7 2.2-1.9 1.2-1 2.1-2.3-.3L8 13.4l-1.8-1.4-2.3.3-1-2.1L1 8.8l.7-2.2L1 4.4l1.9-1.2 1-2.1 2.3.3z" />
    <path d="M6.7 8.3 5.4 7l-.9.9L6.7 10l4-4-.9-.9z" fill="var(--surface)" />
  </svg>
);

type SortKey = "rank" | "price" | "1h" | "1d" | "fdv" | "volume";

export default function ExplorePage() {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]["value"]>("24h");
  const [tokens, setTokens] = useState<TrendingToken[] | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");

  useEffect(() => {
    let cancelled = false;
    setTokens(null);
    getTrendingTokens(interval, 30).then((data) => {
      if (!cancelled) setTokens(data);
    });
    return () => {
      cancelled = true;
    };
  }, [interval]);

  const filtered = useMemo(() => {
    if (!tokens) return null;
    const q = query.trim().toLowerCase();
    const rows = q ? tokens.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) : tokens;
    if (sortKey === "rank") return rows;
    const key = (t: TrendingToken) =>
      sortKey === "price"
        ? t.usdPrice ?? 0
        : sortKey === "1h"
        ? t.stats1h?.priceChange ?? 0
        : sortKey === "1d"
        ? t.stats24h?.priceChange ?? 0
        : sortKey === "fdv"
        ? t.fdv ?? 0
        : volumeOf(t) ?? 0;
    return [...rows].sort((a, b) => key(b) - key(a));
  }, [tokens, query, sortKey]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "price", label: "Price" },
    { key: "1h", label: "1H" },
    { key: "1d", label: "1D" },
    { key: "fdv", label: "FDV" },
    { key: "volume", label: "Volume" },
  ];

  return (
    <div className="landing-dark flex flex-1 flex-col font-sans">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 lg:px-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Explore</p>
            <h1 className="font-sans text-3xl font-extrabold tracking-tighter text-[var(--foreground)]">
              What&apos;s moving on Solana.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Pulled live from Jupiter&apos;s trending list — not a hand-picked or sponsored order.
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-[var(--surface)] p-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => setInterval(iv.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  interval === iv.value
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-full bg-[var(--surface)] px-4 py-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[var(--muted)]" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens by name or symbol"
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          {tokens && <span className="shrink-0 text-xs text-[var(--muted)]">{filtered?.length ?? 0} tokens</span>}
        </div>

        <div className="flex flex-col gap-1 overflow-x-auto rounded-[28px] bg-[var(--surface)] p-2">
          <div className="hidden min-w-[760px] grid-cols-[2rem_1.8fr_0.9fr_0.7fr_0.7fr_0.9fr_0.9fr] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] sm:grid">
            <span>#</span>
            <span>Token</span>
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => setSortKey(col.key)}
                className={`flex items-center justify-end gap-1 text-right transition-colors hover:text-[var(--foreground)] ${
                  sortKey === col.key ? "text-[var(--foreground)]" : ""
                }`}
              >
                {col.label}
                {sortKey === col.key && <span className="text-[0.6rem]">▼</span>}
              </button>
            ))}
          </div>

          {filtered === null &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid min-w-[760px] grid-cols-[2rem_1.8fr_0.9fr_0.7fr_0.7fr_0.9fr_0.9fr] items-center gap-4 rounded-2xl px-4 py-3">
                <Skeleton className="h-3 w-3" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="ml-auto h-3.5 w-16" />
                <Skeleton className="ml-auto h-3.5 w-10" />
                <Skeleton className="ml-auto h-3.5 w-10" />
                <Skeleton className="ml-auto h-3.5 w-14" />
                <Skeleton className="ml-auto h-3.5 w-14" />
              </div>
            ))}

          {filtered?.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
              {tokens?.length === 0
                ? "Jupiter didn't return a trending list for this window — try another interval."
                : "No tokens match that search."}
            </p>
          )}

          {filtered?.map((t, i) => (
            <Link
              key={t.id}
              href={`/token/${t.id}`}
              className="grid min-w-[760px] grid-cols-[2rem_1.8fr_0.9fr_0.7fr_0.7fr_0.9fr_0.9fr] items-center gap-4 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="font-mono text-xs text-[var(--muted)]">{i + 1}</span>
              <span className="flex items-center gap-3 overflow-hidden">
                {t.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.icon} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--muted)]">
                    {t.symbol.slice(0, 2)}
                  </span>
                )}
                <span className="flex flex-col overflow-hidden">
                  <span className="flex items-center gap-1 truncate font-semibold text-[var(--foreground)]">
                    {t.symbol}
                    {t.isVerified && <VerifiedBadge />}
                  </span>
                  <span className="truncate text-xs text-[var(--muted)]">{t.name}</span>
                </span>
              </span>
              <span className="text-right font-mono text-[var(--foreground)]">
                {t.usdPrice !== undefined ? formatUsd(t.usdPrice) : "—"}
              </span>
              <span className="flex justify-end">
                <ChangeCell value={t.stats1h?.priceChange} />
              </span>
              <span className="flex justify-end">
                <ChangeCell value={t.stats24h?.priceChange} />
              </span>
              <span className="text-right font-mono text-[var(--muted)]">{formatCompact(t.fdv)}</span>
              <span className="text-right font-mono text-[var(--muted)]">{formatCompact(volumeOf(t))}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
