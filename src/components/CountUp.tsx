"use client";

import { useEffect, useRef, useState } from "react";

// Splits "<1s" into prefix "<", number 1, suffix "s" — so any stat shaped
// like `<1s` / `4` / `0` can count up without hardcoding a format per stat.
const NUMBER_RE = /^([^\d]*)(\d+(?:\.\d+)?)([^\d]*)$/;

export default function CountUp({
  value,
  durationMs = 900,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const match = value.match(NUMBER_RE);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    setDisplay(`${prefix}0${suffix}`);
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const node = ref.current;
    if (!node) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    // Re-runs every time the stat scrolls into view, in either direction —
    // a static number reads as decoration, a recount reads as "live". Uses
    // setInterval (not rAF) so it still advances in a backgrounded/inactive
    // tab instead of silently freezing.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = Date.now();
        clearInterval(intervalId);
        intervalId = setInterval(() => {
          const t = Math.min(1, (Date.now() - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);
          if (t >= 1) clearInterval(intervalId);
        }, 16);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
