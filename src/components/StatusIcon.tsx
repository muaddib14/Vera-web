import { CheckGlyph, WarnGlyph, FailGlyph } from "@/components/icons";

export type CheckState = "pass" | "warn" | "fail" | "unverified";

const CLS: Record<CheckState, string> = {
  pass: "text-[var(--accent-strong)]",
  warn: "text-amber-400",
  fail: "text-red-400",
  unverified: "text-[var(--muted)]",
};

// Replaces raw ✓ / ✗ / ! Unicode glyphs (inconsistent baseline/weight across
// OS font stacks) with a tiny shared stroke-icon set — one visual language
// for "pass/warn/fail" everywhere it appears (landing checklist, app score).
export function StatusIcon({ state, className = "h-3.5 w-3.5" }: { state: CheckState; className?: string }) {
  const cls = `${className} ${CLS[state]}`;
  if (state === "pass") return <CheckGlyph className={cls} />;
  if (state === "fail") return <FailGlyph className={cls} />;
  return <WarnGlyph className={cls} />;
}
