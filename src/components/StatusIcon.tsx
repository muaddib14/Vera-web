import { CheckGlyph, WarnGlyph, FailGlyph } from "@/components/icons";

export type CheckState = "pass" | "warn" | "fail" | "unverified";

const CLS: Record<CheckState, string> = {
  pass: "text-[var(--accent-strong)]",
  warn: "text-amber-400",
  fail: "text-red-400",
  unverified: "text-[var(--muted)]",
};

// Same severity mapping, as a pill background instead of an icon color —
// so a fail/warn line reads as urgent at a glance, not just another pink chip.
const PILL_CLS: Record<CheckState, string> = {
  pass: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  warn: "bg-amber-400/10 text-amber-400",
  fail: "bg-red-500/10 text-red-400",
  unverified: "bg-[var(--surface-2)] text-[var(--muted)]",
};

export function pillClassFor(state: CheckState): string {
  return PILL_CLS[state];
}

// Replaces raw ✓ / ✗ / ! Unicode glyphs (inconsistent baseline/weight across
// OS font stacks) with a tiny shared stroke-icon set — one visual language
// for "pass/warn/fail" everywhere it appears (landing checklist, app score).
export function StatusIcon({ state, className = "h-3.5 w-3.5" }: { state: CheckState; className?: string }) {
  const cls = `${className} ${CLS[state]}`;
  if (state === "pass") return <CheckGlyph className={cls} />;
  if (state === "fail") return <FailGlyph className={cls} />;
  return <WarnGlyph className={cls} />;
}
