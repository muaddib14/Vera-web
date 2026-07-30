"use client";

import { useState } from "react";

type Verdict = "clear" | "caution" | "critical";

const TABS: { id: Verdict; label: string }[] = [
  { id: "clear", label: "Clear" },
  { id: "caution", label: "Caution" },
  { id: "critical", label: "Critical" },
];

const VERDICT_BANNER: Record<Verdict, { text: string; cls: string; icon: string }> = {
  clear: {
    text: "No hard-kill signals found",
    cls: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    icon: "✓",
  },
  caution: {
    text: "CAUTION — some signals need a closer look",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    icon: "!",
  },
  critical: {
    text: "CRITICAL — a Tier 1 check failed",
    cls: "border-red-500/40 bg-red-500/10 text-red-500",
    icon: "⛔",
  },
};

const CHECKS: Record<Verdict, { label: string; value: string; state: "pass" | "warn" | "fail" }[]> = {
  clear: [
    { label: "Freeze authority", value: "revoked", state: "pass" },
    { label: "Mint authority", value: "revoked", state: "pass" },
    { label: "Permanent delegate", value: "none", state: "pass" },
    { label: "Top 10 holders", value: "18%", state: "pass" },
  ],
  caution: [
    { label: "Freeze authority", value: "revoked", state: "pass" },
    { label: "Mint authority", value: "revoked", state: "pass" },
    { label: "Top 10 holders", value: "41%", state: "warn" },
    { label: "Trade impact", value: "-6.2%", state: "warn" },
  ],
  critical: [
    { label: "Freeze authority", value: "Cxk9…4tRp", state: "fail" },
    { label: "Mint authority", value: "revoked", state: "pass" },
    { label: "Permanent delegate", value: "none", state: "pass" },
    { label: "Top 10 holders", value: "41%", state: "warn" },
  ],
};

const STATE_STYLE: Record<string, string> = {
  fail: "text-red-500",
  warn: "text-amber-600",
  pass: "text-[var(--accent-strong)]",
};

const STATE_MARK: Record<string, string> = {
  fail: "✗",
  warn: "!",
  pass: "✓",
};

export default function AppDemo() {
  const [active, setActive] = useState<Verdict>("clear");
  const banner = VERDICT_BANNER[active];

  return (
    <div>
      <div className="card-flat overflow-hidden">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]/70" />
          <span className="ml-4 rounded-md bg-[var(--surface)] px-3 py-1 font-mono text-xs text-[var(--muted)]">
            vera.app/app
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
          {/* left — mint input mock */}
          <div className="flex flex-col gap-5 border-b border-[var(--line)] p-7 lg:border-b-0 lg:border-r">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Token mint
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--background)] px-4 py-3 font-mono text-sm text-[var(--foreground)]">
                <span>Cxk9WNw…QeR4tRp</span>
                <span className="text-[var(--accent-strong)]">↵</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Quote
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm">
                <span className="text-[var(--muted)]">1 SOL →</span>
                <span className="font-mono text-[var(--foreground)]">1,204,880,000</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                    active === tab.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Preview the three verdicts the router can render — the real score updates the
              instant you paste a live mint.
            </p>
          </div>

          {/* right — checklist mock, swaps with tab */}
          <div className="flex flex-col gap-4 p-7">
            <p className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${banner.cls}`}>
              <span>{banner.icon}</span>
              {banner.text}
            </p>

            <ul className="flex flex-col gap-3 font-mono text-sm">
              {CHECKS[active].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[var(--foreground)]">
                    <span className={STATE_STYLE[row.state]}>{STATE_MARK[row.state]}</span>
                    {row.label}
                  </span>
                  <span className="value-pill">{row.value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
              <span>Score renders with quote — &lt;1s</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                live preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
