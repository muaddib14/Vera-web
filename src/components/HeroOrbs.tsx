"use client";

import { useEffect, useState } from "react";
import { getTokenInfo, searchTokens } from "@/lib/jupiter";

// The five coins the lead asked for, by real mint where we know it —
// PUMP is looked up by symbol since its mint isn't hardcoded anywhere
// else in the app. Icons come from Jupiter's own token API, the same
// source TradeConsole already uses for the Buy-side token badge.
const HERO_TOKENS = [
  { key: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", from: "#2775ca", to: "#1e3a8a" },
  { key: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", from: "#26a17b", to: "#0d7a5f" },
  { key: "SOL", mint: "So11111111111111111111111111111111111111112", from: "#9945FF", to: "#14F195" },
  { key: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", from: "#a855f7", to: "#6366f1" },
  { key: "PUMP", symbolQuery: "PUMP", from: "#22c55e", to: "#15803d" },
] as const;

// Positions/sizes/timing for the floating field — cycles through the five
// real tokens above so the same coin can appear more than once, scattered.
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
] as const;

type IconMap = Partial<Record<(typeof HERO_TOKENS)[number]["key"], string>>;

export default function HeroOrbs() {
  const [icons, setIcons] = useState<IconMap>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      HERO_TOKENS.map(async (t) => {
        const info =
          "mint" in t
            ? await getTokenInfo(t.mint)
            : (await searchTokens(t.symbolQuery)).find((r) => r.symbol.toUpperCase() === t.key) ?? null;
        return [t.key, info?.icon] as const;
      })
    ).then((pairs) => {
      if (cancelled) return;
      setIcons(Object.fromEntries(pairs.filter(([, icon]) => icon)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {ORB_SLOTS.map((slot, i) => {
        const token = HERO_TOKENS[i % HERO_TOKENS.length];
        const icon = icons[token.key];
        return (
          <span
            key={i}
            className="hero-orb overflow-hidden"
            style={{
              top: slot.top,
              left: slot.left,
              width: slot.size,
              height: slot.size,
              fontSize: Math.max(7, slot.size * 0.19),
              background: icon ? undefined : `linear-gradient(135deg, ${token.from}, ${token.to})`,
              ["--delay" as string]: slot.delay,
            }}
          >
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-full w-full object-cover" />
            ) : (
              token.key
            )}
          </span>
        );
      })}
    </div>
  );
}
