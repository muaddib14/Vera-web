import Image from "next/image";
import LaunchButton from "@/components/LaunchButton";
import Reveal from "@/components/Reveal";

const CHECKLIST = [
  { label: "Freeze authority", value: "Cxk9…4tRp", state: "fail" as const, note: "can block your sell" },
  { label: "Mint authority", value: "revoked", state: "pass" as const, note: "supply is fixed" },
  { label: "Permanent delegate", value: "none", state: "pass" as const, note: "no forced transfers" },
  { label: "LP lock/burn", value: "unverified", state: "warn" as const, note: "pool decoded, lock not confirmed" },
  { label: "Top 10 holders", value: "41%", state: "warn" as const, note: "of supply, pools excluded" },
  { label: "Token age", value: "14 days", state: "pass" as const, note: "past the riskiest window" },
];

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

const CTA =
  "inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors hover:bg-[var(--accent-strong)]";

const CTA_GHOST =
  "inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]";

const DISPLAY = "font-[family-name:var(--font-display)]";

const STATS = [
  { value: "4", label: "on-chain checks that can veto a swap" },
  { value: "<1s", label: "added to your quote — not instead of it" },
  { value: "0", label: "wallets this app ever touches" },
];

const STACK = ["Jupiter", "Helius", "Jito", "Solana", "SPL Token-2022", "Solscan"];

const FEATURES: { title: string; body: string; wide?: boolean }[] = [
  {
    title: "LP lock, actually verified",
    body: "We decode the real Raydium AMM v4 pool account and check whether the LP tokens sit at the burn address — not a badge someone self-reported.",
  },
  {
    title: "Freeze & mint authority",
    body: "Read straight off the SPL mint account. If the deployer can still freeze your wallet or print more supply, you see it before you sign — not after.",
  },
  {
    title: "Token-2022 aware",
    body: "Permanent delegate and transfer hook extensions checked too — the exact tricks a legacy scanner built for the old token program never sees.",
  },
  {
    title: "MEV-protected routing",
    body: "Optional Jito bundle submission skips the public mempool a sandwich bot reads. You get the realized fill vs. the quote — a measured number, not an advertised multiplier.",
    wide: true,
  },
  {
    title: "Holder concentration, minus the noise",
    body: "Top 10 holders as a percentage of supply, with recognized liquidity-pool accounts excluded so the number isn't inflated by the pool itself.",
  },
  {
    title: "Non-custodial, always",
    body: "Every check is disclosure, never a gate. Every transaction is signed by your wallet, and only your wallet.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-light flex flex-col flex-1 font-sans">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="VERA" width={28} height={28} className="rounded-full object-cover" />
            <span className="text-base font-semibold tracking-tight">VERA</span>
          </div>
          <LaunchButton className={CTA}>Launch app</LaunchButton>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero — wormhole.com: big two-tone headline over a dot field */}
        <section className="bg-dots relative flex min-h-[calc(100svh-73px)] overflow-hidden border-b border-[var(--line)]">
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center gap-14 px-6 py-24 lg:px-12 lg:py-32">
            <Reveal className="flex max-w-3xl flex-col gap-7">
              <h1 className={`${DISPLAY} text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}>
                <span className="text-[var(--foreground)]">See the rug</span>
                <br />
                <span className="text-[var(--muted)]">before it sees you.</span>
              </h1>
              <p className="max-w-xl text-lg text-[var(--muted)]">
                Your swap screen shows you a price. It doesn&apos;t show you whether the deployer
                can still freeze your wallet, print more supply, or pull the pool out from
                under you. VERA runs that check inline — no separate tab, no extra wait.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <LaunchButton className={CTA}>Launch app &amp; connect wallet</LaunchButton>
                <a href="#checklist" className={CTA_GHOST}>
                  See the checklist ↓
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Trust marquee — the real infrastructure this reads and routes through */}
        <section className="overflow-hidden border-b border-[var(--line)] bg-[var(--surface)] py-6">
         
          <div className="marquee-track gap-16">
            {[...STACK, ...STACK, ...STACK, ...STACK].map((name, i) => (
              <span key={`${name}-${i}`} className="shrink-0 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Giant stat — wormhole.com style single big number + divided row */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12">
            <Reveal className="flex flex-col items-start gap-2">
              <span className={`${DISPLAY} text-6xl tracking-tight text-[var(--foreground)] sm:text-7xl lg:text-8xl`}>
                {STATS[0].value}
              </span>
              <span className="text-sm text-[var(--muted)]">{STATS[0].label}</span>
            </Reveal>

            <Reveal
              delayMs={100}
              className="mt-14 grid grid-cols-1 divide-y divide-[var(--line)] border-t border-[var(--line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3"
            >
              {STATS.slice(1).concat(STATS[0]).map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1 px-0 py-6 sm:px-8 sm:first:pl-0">
                  <span className={`${DISPLAY} text-3xl text-[var(--foreground)]`}>{stat.value}</span>
                  <span className="text-xs text-[var(--muted)]">{stat.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Two column — wormhole.com "Connecting every market" pattern */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-20 lg:px-12 lg:py-28">
              <Reveal className="flex flex-col gap-4">
                <p className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                  Every mint gets the same read.
                </p>
                <p className="max-w-md text-base text-[var(--muted)]">
                  Paste an address and both requests fire together: Jupiter prices the trade,
                  while VERA reads the mint account, the pool, and the holder list directly
                  off-chain state. Neither one waits for the other.
                </p>
                <p className="max-w-md text-base text-[var(--muted)]">
                  A hard-kill signal — live freeze authority, live mint authority — stops the
                  swap button until you say, explicitly, that you understand the risk.
                </p>
              </Reveal>
            </div>

            <div className="diamond-field relative hidden min-h-[420px] lg:block">
              <Image
                src="/logo.jpeg"
                alt="VERA"
                fill
                className="relative z-10 object-cover"
                sizes="(max-width: 1024px) 0px, 50vw"
              />
            </div>
          </div>
        </section>

        {/* Feature grid — wormhole.com "foundation" style icon cards */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="max-w-2xl">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Built for one job.
              </h2>
              <p className="mt-3 text-base text-[var(--muted)]">
                Not a trading terminal, not a portfolio tracker — a router with a rug-check
                built into the quote path.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delayMs={i * 60} className={feature.wide ? "sm:col-span-2" : ""}>
                  <div
                    className={`card-flat card-hover flex h-full flex-col gap-5 p-8 ${
                      feature.wide ? "border-[var(--accent)] bg-[var(--accent-soft)] sm:flex-row sm:items-center sm:gap-8" : ""
                    }`}
                  >
                    <span className="icon-blob shrink-0 text-lg">●</span>
                    <div className="flex flex-col gap-2.5">
                      <p className="text-lg font-semibold leading-snug text-[var(--foreground)]">{feature.title}</p>
                      <p className={`text-sm leading-relaxed text-[var(--muted)] ${feature.wide ? "sm:max-w-md" : ""}`}>
                        {feature.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Product showcase — wormhole.com "Move with Portal" dark panel */}
        <section id="checklist" className="border-b border-[var(--line)] bg-[var(--surface-2)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                Not a score. A checklist.
              </h2>
              <p className={`${DISPLAY} mt-3 text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                This is what renders next to your quote.
              </p>
              <p className="mt-3 text-base text-[var(--muted)]">
                A single 0–100 number is unfalsifiable — you can&apos;t tell why it moved. Every
                line here is a real on-chain fact, and every line links out so you can verify it
                on Solscan instead of trusting us blind.
              </p>
            </Reveal>

            <Reveal delayMs={120} className="card-flat mt-12 p-6 sm:p-10">
              <p className="mb-5 flex items-center gap-2 text-red-500">
                <span className="motion-safe:animate-pulse">⛔</span>
                <span className="font-semibold">CRITICAL — freeze authority is live</span>
              </p>
              <ul className="flex flex-col divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--background)] font-mono text-sm">
                {CHECKLIST.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4 px-5 py-4">
                    <span className="flex items-start gap-2.5 text-[var(--foreground)]">
                      <span className={`w-3 shrink-0 text-center ${STATE_STYLE[row.state]}`}>{STATE_MARK[row.state]}</span>
                      <span className="flex flex-col">
                        <span className="font-sans">{row.label}</span>
                        <span className="font-sans text-xs text-[var(--muted)]">{row.note}</span>
                      </span>
                    </span>
                    <span className="value-pill shrink-0">{row.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-[var(--muted)]">
                Illustrative example. Freeze and mint authority come straight off the SPL mint
                account; LP lock is confirmed by decoding the actual Raydium pool, not a
                self-reported badge.
              </p>
            </Reveal>
          </div>
        </section>

        {/* MEV protection */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-28">
            <Reveal className="flex flex-col gap-4 lg:order-2">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Skip the mempool a sandwich bot reads.
              </h2>
              <p className="text-base text-[var(--muted)]">
                A normal swap sits in the public mempool for anyone running a bot to see —
                and front-run. Route it through Jito instead and it goes straight to a
                validator as a bundle, invisible until it lands.
              </p>
              <p className="text-base text-[var(--muted)]">
                After every swap you get the real comparison: what Jupiter quoted versus what
                actually landed in your wallet. A measured number, not a marketing multiplier.
              </p>
            </Reveal>

            <Reveal delayMs={150} className="card-flat p-7 font-mono text-sm lg:order-1">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Realized vs. quoted
              </p>
              <ul className="flex flex-col gap-3">
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Quoted out</span>
                  <span className="text-[var(--foreground)]">1,204,880,000</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Realized out</span>
                  <span className="text-[var(--foreground)]">1,203,410,500</span>
                </li>
                <li className="flex justify-between border-t border-[var(--line)] pt-3">
                  <span className="text-[var(--muted)]">Delta vs quote</span>
                  <span className="text-[var(--accent-strong)]">-0.12%</span>
                </li>
              </ul>
              <p className="mt-4 font-sans text-xs text-[var(--muted)]">
                Illustrative — your actual delta renders after each swap you sign.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Trust */}
        {/* <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-12">
            <Reveal>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                No custody. No exceptions.
              </h2>
              <p className="mt-3 max-w-3xl text-base text-[var(--muted)]">
                We never hold your funds, run a shielded transfer, or keep an internal ledger —
                your wallet signs every transaction directly. And a clean checklist is a
                snapshot, not a guarantee: a token that passes today can still change tomorrow.
                This is disclosure, not financial advice.
              </p>
            </Reveal>
          </div>
        </section> */}

        {/* Final CTA — soft teal band, wormhole footer-CTA pattern */}
        <section>
          <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-12">
            <Reveal className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-[var(--accent-soft)] px-8 py-12 sm:flex-row sm:items-center lg:px-14">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Paste a mint.
                <br />
                See what you&apos;re signing.
              </h2>
              <LaunchButton className={CTA}>Launch app &amp; connect wallet</LaunchButton>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between lg:px-12">
          <span>
            VERA checks freeze authority, mint authority, LP lock, and holder concentration
            live — via Jupiter, Helius, Jito, and Solana. Verify any of it yourself on Solscan.
          </span>
          <a href="#" className={CTA_GHOST}>
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
