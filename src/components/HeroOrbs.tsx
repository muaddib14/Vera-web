"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrendingTokens } from "@/lib/jupiter";
import type { TrendingToken } from "@/lib/jupiter";

// Positions/sizes/timing for the floating field — same slots as before, now
// filled from Explore's live trending list instead of five fixed tokens, so
// the background doesn't repeat the same handful of icons.
const ORB_SLOTS = [
  { top: "9%", left: "5%", size: 92, delay: "0s" },
  { top: "48%", left: "2%", size: 68, delay: "1.2s" },
  { top: "18%", left: "90%", size: 74, delay: "0.6s" },
  { top: "64%", left: "92%", size: 82, delay: "1.8s" },
  { top: "88%", left: "15%", size: 56, delay: "2.4s" },
  { top: "5%", left: "77%", size: 60, delay: "0.9s" },
  { top: "33%", left: "13%", size: 50, delay: "1.6s" },
  { top: "78%", left: "69%", size: 64, delay: "0.3s" },
  { top: "2%", left: "39%", size: 42, delay: "2.1s" },
  { top: "90%", left: "39%", size: 48, delay: "1.4s" },
  { top: "14%", left: "58%", size: 38, delay: "2.7s" },
  { top: "38%", left: "82%", size: 46, delay: "0.5s" },
  { top: "56%", left: "21%", size: 40, delay: "1.9s" },
  { top: "58%", left: "60%", size: 52, delay: "1.1s" },
  { top: "-2%", left: "18%", size: 46, delay: "0.2s" },
  { top: "96%", left: "80%", size: 50, delay: "1.7s" },
  { top: "26%", left: "48%", size: 30, delay: "2.9s" },
  { top: "-3%", left: "58%", size: 36, delay: "0.8s" },
  { top: "72%", left: "48%", size: 34, delay: "2.3s" },
  { top: "6%", left: "94%", size: 42, delay: "1.5s" },
  { top: "100%", left: "60%", size: 44, delay: "0.4s" },
  { top: "96%", left: "3%", size: 38, delay: "2.0s" },
  { top: "24%", left: "68%", size: 44, delay: "1.3s" },
  { top: "42%", left: "97%", size: 40, delay: "2.6s" },
  { top: "70%", left: "3%", size: 36, delay: "0.7s" },
  { top: "88%", left: "58%", size: 34, delay: "1.0s" },
  { top: "10%", left: "28%", size: 32, delay: "2.5s" },
  { top: "62%", left: "38%", size: 30, delay: "0.6s" },
  { top: "32%", left: "30%", size: 36, delay: "1.8s" },
  { top: "80%", left: "88%", size: 42, delay: "2.2s" },
  { top: "50%", left: "48%", size: 26, delay: "0.1s" },
  { top: "16%", left: "8%", size: 28, delay: "1.6s" },
] as const;

// Deterministic fallback gradients, cycled by index — only shown for the
// rare token with no icon on Jupiter, not the common case.
const FALLBACK_GRADIENTS = [
  ["#9945FF", "#14F195"],
  ["#2775ca", "#1e3a8a"],
  ["#a855f7", "#6366f1"],
  ["#22c55e", "#15803d"],
  ["#f59e0b", "#ea580c"],
  ["#fc72ff", "#7c3aed"],
];

export default function HeroOrbs() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);

  useEffect(() => {
    let cancelled = false;
    getTrendingTokens("24h", ORB_SLOTS.length).then((data) => {
      if (!cancelled) setTokens(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (tokens.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {ORB_SLOTS.map((slot, i) => {
        const token = tokens[i % tokens.length];
        const [from, to] = FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length];
        const style = {
          top: slot.top,
          left: slot.left,
          width: slot.size,
          height: slot.size,
          fontSize: Math.max(7, slot.size * 0.19),
          background: token.icon ? undefined : `linear-gradient(135deg, ${from}, ${to})`,
          ["--delay" as string]: slot.delay,
        };
        return (
          <Link key={`${token.id}-${i}`} href={`/token/${token.id}`} className="hero-orb overflow-hidden" style={style} title={`View ${token.symbol}`}>
            {token.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              token.symbol.slice(0, 2)
            )}
          </Link>
        );
      })}
    </div>
  );
}
