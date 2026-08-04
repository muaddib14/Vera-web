"use client";

import { useEffect, useState } from "react";
import { getRecentTrades } from "@/lib/charts";
import type { Trade } from "@/lib/charts";
import Skeleton from "@/components/Skeleton";

function timeAgo(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function TokenTrades({ pool, mint, symbol }: { pool: string | null | undefined; mint: string; symbol: string }) {
  const [trades, setTrades] = useState<Trade[] | null>(null);

  useEffect(() => {
    if (pool === undefined) return;
    if (pool === null) {
      setTrades([]);
      return;
    }
    let cancelled = false;
    setTrades(null);
    getRecentTrades(pool, mint).then((data) => {
      if (!cancelled) setTrades(data);
    });
    return () => {
      cancelled = true;
    };
  }, [pool, mint]);

  return (
    <div className="flex flex-col gap-1 overflow-x-auto rounded-[28px] bg-[var(--surface)] p-2">
      <div className="hidden min-w-[560px] grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] sm:grid">
        <span>Time</span>
        <span>Type</span>
        <span className="text-right">{symbol}</span>
        <span className="text-right">USD</span>
        <span className="text-right">Wallet</span>
      </div>

      {(pool === undefined || trades === null) &&
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid min-w-[560px] grid-cols-[1fr_1fr_1fr_1fr_1fr] items-center gap-4 rounded-2xl px-4 py-3">
            <Skeleton className="h-3.5 w-8" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="ml-auto h-3.5 w-14" />
            <Skeleton className="ml-auto h-3.5 w-14" />
            <Skeleton className="ml-auto h-3.5 w-16" />
          </div>
        ))}

      {trades?.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No recent trades found for this pool.</p>
      )}

      {trades?.map((t) => (
        <a
          key={t.txHash}
          href={`https://solscan.io/tx/${t.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="grid min-w-[560px] grid-cols-[1fr_1fr_1fr_1fr_1fr] items-center gap-4 rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]"
        >
          <span className="font-mono text-xs text-[var(--muted)]">{timeAgo(t.time)}</span>
          <span className={`font-semibold capitalize ${t.kind === "buy" ? "text-[var(--accent-strong)]" : "text-red-400"}`}>{t.kind}</span>
          <span className="text-right font-mono text-[var(--foreground)]">
            {t.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className="text-right font-mono text-[var(--foreground)]">
            ${t.volumeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span className="text-right font-mono text-[var(--muted)]">
            {t.wallet.slice(0, 4)}…{t.wallet.slice(-4)}
          </span>
        </a>
      ))}
    </div>
  );
}
