"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ConnectButton from "@/components/ConnectButton";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
  label: string;
  href: string;
  items: { label: string; href?: string }[];
};

// Each nav item's dropdown mirrors Uniswap's pattern (Trade → Swap/Limit/Buy/Sell,
// Explore → Tokens/Pools/Transactions, Portfolio → Overview/NFTs/Activity) but
// only the rows VERA actually built are links — the rest are tagged "Soon"
// instead of pretending to be live.
const NAV: NavItem[] = [
  {
    label: "Trade",
    href: "/",
    items: [
      { label: "Swap", href: "/" },
      { label: "Limit" },
      { label: "Buy" },
      { label: "Sell" },
    ],
  },
  {
    label: "Explore",
    href: "/explore",
    items: [
      { label: "Tokens", href: "/explore" },
      { label: "Pools" },
      { label: "Transactions" },
    ],
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    items: [
      { label: "Overview", href: "/portfolio" },
      { label: "NFTs" },
      { label: "Activity" },
    ],
  },
];

const SOON_TOP_LEVEL = ["Pool", "Launches"];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image src="/logo.jpeg" alt="VERA" width={28} height={28} className="rounded-full object-cover" />
            <span className="text-base font-semibold tracking-tight">VERA</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return <NavDropdown key={item.label} item={item} active={!!active} />;
            })}
            {SOON_TOP_LEVEL.map((label) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-[var(--muted)] opacity-50"
              >
                {label}
                <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide">Soon</span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

function NavDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        href={item.href}
        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
          active ? "bg-[var(--surface-2)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        {item.label}
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-2">
          <div className="flex w-44 flex-col gap-1 rounded-2xl bg-[var(--surface)] p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            {item.items.map((sub) =>
              sub.href ? (
                <Link
                  key={sub.label}
                  href={sub.href}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  {sub.label}
                </Link>
              ) : (
                <span
                  key={sub.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] opacity-50"
                >
                  {sub.label}
                  <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wide">Soon</span>
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
