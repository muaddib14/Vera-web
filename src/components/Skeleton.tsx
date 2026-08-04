export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-full bg-[var(--surface-2)] ${className}`} />;
}
