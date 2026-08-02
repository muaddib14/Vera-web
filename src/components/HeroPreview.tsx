"use client";

import { useEffect, useRef, useState } from "react";
import { StatusIcon, type CheckState } from "@/components/StatusIcon";

type Verdict = "clear" | "caution" | "critical";

const TABS: { id: Verdict; label: string }[] = [
  { id: "clear", label: "CLEAR" },
  { id: "caution", label: "CAUTION" },
  { id: "critical", label: "CRITICAL" },
];

const INK: Record<Verdict, string> = {
  clear: "var(--accent-strong)",
  caution: "#b45309",
  critical: "#b91c1c",
};

const STAMP: Record<Verdict, string> = {
  clear: "PASSED",
  caution: "REVIEW",
  critical: "REJECTED",
};

const ROWS: Record<Verdict, { label: string; value: string; state: CheckState }[]> = {
  clear: [
    { label: "Freeze authority", value: "revoked", state: "pass" },
    { label: "Mint authority", value: "revoked", state: "pass" },
    { label: "Top 10 holders", value: "18%", state: "pass" },
    { label: "LP lock", value: "burned", state: "pass" },
  ],
  caution: [
    { label: "Freeze authority", value: "revoked", state: "pass" },
    { label: "Top 10 holders", value: "41%", state: "warn" },
    { label: "Trade impact", value: "-6.2%", state: "warn" },
    { label: "LP lock", value: "unverified", state: "warn" },
  ],
  critical: [
    { label: "Freeze authority", value: "Cxk9…4tRp", state: "fail" },
    { label: "Mint authority", value: "revoked", state: "pass" },
    { label: "Top 10 holders", value: "41%", state: "warn" },
    { label: "LP lock", value: "unverified", state: "warn" },
  ],
};

// Not a dashboard card — an inspection slip. Stamped verdict, perforated
// edge, monospace log that types itself in line by line. The product's
// proof-of-work lives in the hero fold, styled like a customs declaration
// rather than another glassy SaaS panel.
export default function HeroPreview() {
  const [active, setActive] = useState<Verdict>("critical");
  const [autoPaused, setAutoPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ink = INK[active];

  // Auto-advances through the three verdicts so the ticket demonstrates
  // itself without a click — a manual click still works, it just pauses
  // the cycle for a while before it resumes on its own.
  useEffect(() => {
    if (autoPaused) return;
    const id = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev);
        return TABS[(idx + 1) % TABS.length].id;
      });
    }, 3400);
    return () => clearInterval(id);
  }, [autoPaused]);

  function selectTab(id: Verdict) {
    setActive(id);
    setAutoPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setAutoPaused(false), 7000);
  }

  return (
    <div className="relative w-full">
      <div
        className="relative overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_70px_-40px_rgba(13,21,18,0.45)]"
        style={{ borderRadius: "4px" }}
      >
        {/* stamped verdict, ink-rotated in the corner */}
        <div
          key={active}
          aria-hidden
          className="pointer-events-none absolute -right-2 top-5 z-10 animate-[stamp-in_0.4s_ease-out] select-none rounded border-[3px] px-3 py-1 text-sm font-black uppercase tracking-[0.2em]"
          style={{ color: ink, borderColor: ink, transform: "rotate(-9deg)", opacity: 0.9 }}
        >
          {STAMP[active]}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[var(--muted)]">
            Vera inspection log
          </span>
          <span className="font-mono text-[0.65rem] text-[var(--muted)]">no. 004471</span>
        </div>

        <div className="px-5 pb-1 pt-2">
          <span className="font-mono text-xs text-[var(--muted)]">mint </span>
          <span className="font-mono text-xs text-[var(--foreground)]">Cxk9WNw…QeR4tRp</span>
        </div>

        {/* perforation */}
        <div className="relative my-4 h-0 border-t border-dashed border-[var(--line)]">
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
        </div>

        <ul key={`log-${active}`} className="flex flex-col gap-0 px-5 pb-2 font-mono text-sm">
          {ROWS[active].map((row, i) => (
            <li
              key={row.label}
              className="flex animate-[type-in_0.3s_ease-out_backwards] items-center justify-between gap-3 border-b border-[var(--line)]/60 py-2 last:border-0"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="flex items-center gap-2 text-[var(--foreground)]">
                <span className="text-[var(--muted)]">{`0${i + 1}`}</span>
                <StatusIcon state={row.state} />
                <span className="font-sans text-[0.8rem]">{row.label}</span>
              </span>
              <span className="text-[0.8rem] text-[var(--foreground)]">{row.value}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
          <div className="flex items-center gap-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className="relative pb-1 font-mono text-[0.65rem] font-semibold tracking-[0.1em] transition-colors"
                style={{ color: active === tab.id ? ink : "var(--muted)" }}
              >
                {tab.label}
                {active === tab.id && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-[2px] overflow-hidden bg-[var(--line)]">
                    {!autoPaused && (
                      <span
                        key={`${active}-progress`}
                        className="block h-full animate-[tab-progress_3.4s_linear]"
                        style={{ background: ink }}
                      />
                    )}
                    {autoPaused && <span className="block h-full w-full" style={{ background: ink }} />}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="font-mono text-[0.65rem] text-[var(--muted)]">
            {autoPaused ? "paused" : "auto"}
          </span>
        </div>
      </div>
    </div>
  );
}
