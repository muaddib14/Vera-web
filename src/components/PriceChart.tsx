"use client";

import { useEffect, useState } from "react";
import { getPriceHistory } from "@/lib/charts";
import type { Candle, Timeframe } from "@/lib/charts";
import { formatUsd } from "@/lib/jupiter";

const RANGES: { value: Timeframe; limit: number; label: string }[] = [
  { value: "hour", limit: 24, label: "1D" },
  { value: "hour", limit: 168, label: "1W" },
  { value: "day", limit: 30, label: "1M" },
  { value: "day", limit: 365, label: "1Y" },
];

const W = 640;
const H = 220;

// A fixed sine wave, not the real curve — this is the loading placeholder,
// same idea as Uniswap's chart skeleton: a shape that reads as "chart" before
// data exists, not a promise about what the data will look like.
const SKELETON_PATH = Array.from({ length: 40 }, (_, i) => {
  const x = (i / 39) * W;
  const y = H / 2 + Math.sin(i * 0.45) * (H * 0.28);
  return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

export default function PriceChart({ pool }: { pool: string | null | undefined }) {
  const [rangeIdx, setRangeIdx] = useState(0);
  const [metric, setMetric] = useState<"price" | "volume">("price");
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const range = RANGES[rangeIdx];

  useEffect(() => {
    if (pool === undefined) return; // still resolving the pool upstream
    if (pool === null) {
      setCandles([]);
      return;
    }
    let cancelled = false;
    setCandles(null);
    setHoverIdx(null);
    getPriceHistory(pool, range.value, range.limit).then((data) => {
      if (!cancelled) setCandles(data);
    });
    return () => {
      cancelled = true;
    };
  }, [pool, range.value, range.limit]);

  const loading = pool === undefined || candles === null;

  if (loading) {
    return (
      <div className="flex h-72 flex-col gap-4 rounded-[28px] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-2">
          <div className="shimmer h-7 w-32 rounded-lg bg-[var(--surface-2)]" />
          <div className="shimmer h-3.5 w-20 rounded-lg bg-[var(--surface-2)]" />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full flex-1 opacity-60">
          <path
            d={SKELETON_PATH}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="3"
            strokeDasharray="10 6"
            vectorEffect="non-scaling-stroke"
            style={{ animation: "wave-march 1.2s linear infinite" }}
          />
        </svg>
      </div>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-[28px] bg-[var(--surface)] text-center">
        <p className="text-sm font-semibold text-[var(--muted)]">No chart data yet</p>
        <p className="max-w-xs text-xs text-[var(--muted)]">No liquid Solana pool found for this mint.</p>
      </div>
    );
  }

  const values = candles.map((c) => (metric === "price" ? c.close : c.volume));
  const min = metric === "price" ? Math.min(...values) : 0;
  const max = Math.max(...values);
  const span = max - min || 1;
  const up = candles[candles.length - 1].close >= candles[0].close;
  const color = metric === "volume" ? "var(--accent)" : up ? "var(--accent-strong)" : "#f87171";

  const points = candles.map((c, i) => {
    const v = metric === "price" ? c.close : c.volume;
    const x = (i / (candles.length - 1 || 1)) * W;
    const y = H - ((v - min) / span) * H;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const shownCandle = candles[hoverIdx ?? candles.length - 1];
  const shownValue = metric === "price" ? shownCandle.close : shownCandle.volume;

  return (
    <div className="flex h-72 flex-col gap-3 rounded-[28px] bg-[var(--surface)] p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-sans text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            {formatUsd(shownValue)}
          </span>
          <span className="text-xs text-[var(--muted)]">{new Date(shownCandle.time * 1000).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1">
            {(["price", "volume"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                  metric === m ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  i === rangeIdx ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full flex-1 cursor-crosshair"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setHoverIdx(Math.min(candles.length - 1, Math.max(0, Math.round(ratio * (candles.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chart-fill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {hoverIdx !== null && (
          <line x1={points[hoverIdx].x} x2={points[hoverIdx].x} y1={0} y2={H} stroke="var(--line)" strokeWidth="1" />
        )}
      </svg>
    </div>
  );
}
