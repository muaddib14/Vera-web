// Bespoke scattered-diamond motif — replaces the old checkerboard CSS
// pattern (which read as a generic repeating texture, not a brand asset).
// Fixed coordinates (not Math.random) so server and client render identically.
const DIAMONDS = [
  { x: 12, y: 10, s: 34, r: 12, o: 0.55 },
  { x: 68, y: 6, s: 20, r: -18, o: 0.35 },
  { x: 40, y: 18, s: 46, r: 6, o: 0.7 },
  { x: 85, y: 22, s: 28, r: 24, o: 0.4 },
  { x: 20, y: 38, s: 22, r: -8, o: 0.3 },
  { x: 58, y: 34, s: 60, r: 15, o: 0.9 },
  { x: 8, y: 58, s: 30, r: -22, o: 0.45 },
  { x: 78, y: 52, s: 40, r: 10, o: 0.55 },
  { x: 45, y: 62, s: 24, r: -12, o: 0.35 },
  { x: 30, y: 78, s: 50, r: 18, o: 0.6 },
  { x: 90, y: 74, s: 22, r: -6, o: 0.3 },
  { x: 62, y: 84, s: 32, r: 8, o: 0.4 },
  { x: 5, y: 88, s: 18, r: -16, o: 0.25 },
];

export default function DiamondField({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      {DIAMONDS.map((d, i) => (
        <rect
          key={i}
          x={d.x - d.s / 2}
          y={d.y - d.s / 2}
          width={d.s}
          height={d.s}
          rx="2"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.6"
          opacity={d.o}
          transform={`rotate(${45 + d.r} ${d.x} ${d.y})`}
        />
      ))}
    </svg>
  );
}
