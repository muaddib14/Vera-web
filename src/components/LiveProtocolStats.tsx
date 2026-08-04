"use client";

import { useEffect, useState } from "react";
import { getTrendingTokens } from "@/lib/jupiter";
import CountUp from "@/components/CountUp";
import { BoltIcon, ShieldIcon, UsersIcon } from "@/components/icons";

function formatCompactUsd(n: number) {
  return "$" + new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// Three tiles off one fetch of the same trending feed Explore uses — real
// numbers instead of fixed marketing copy, each tied to a check VERA
// actually runs (liquidity → the swap itself, verified → the lock check,
// holders → the concentration check).
export default function LiveProtocolStats() {
  const [stats, setStats] = useState<{ liquidity: string; verified: string; holders: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTrendingTokens("24h", 30).then((tokens) => {
      if (cancelled || tokens.length === 0) return;
      const liquidity = tokens.reduce((sum, t) => sum + (t.liquidity ?? 0), 0);
      const holders = tokens.reduce((sum, t) => sum + (t.holderCount ?? 0), 0);
      const verified = tokens.filter((t) => t.isVerified).length;
      setStats({
        liquidity: formatCompactUsd(liquidity),
        verified: `${verified}/${tokens.length}`,
        holders: formatCompact(holders),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const TILE_CLASS = "flex flex-row items-center gap-4 p-5";
  const VALUE_CLASS = "font-sans font-extrabold text-3xl tracking-tighter text-white";

  return (
    <>
      <div className={`tile tile-orange ${TILE_CLASS}`}>
        <span className="tile-icon shrink-0">
          <BoltIcon />
        </span>
        <div className="flex flex-col gap-0.5">
          <CountUp value={stats?.liquidity ?? "$0"} className={VALUE_CLASS} />
          <span className="text-xs text-white/70">live liquidity across Jupiter&apos;s trending tokens right now</span>
        </div>
      </div>

      <div className="tile tile-pink flex flex-row items-center gap-4 p-5">
        <span className="tile-icon shrink-0">
          <ShieldIcon />
        </span>
        <div className="flex flex-col gap-0.5">
          <CountUp value={stats?.verified ?? "0/30"} className={VALUE_CLASS} />
          <span className="text-xs text-white/70">trending tokens right now pass Jupiter&apos;s own verification</span>
        </div>
      </div>

      <div className="tile tile-teal flex flex-row items-center gap-4 p-5">
        <span className="tile-icon shrink-0">
          <UsersIcon />
        </span>
        <div className="flex flex-col gap-0.5">
          <CountUp value={stats?.holders ?? "0"} className={VALUE_CLASS} />
          <span className="text-xs text-white/70">holders VERA&apos;s concentration check is reading right now</span>
        </div>
      </div>
    </>
  );
}
