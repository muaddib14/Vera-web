import Image from "next/image";
import LaunchButton from "@/components/LaunchButton";
import Reveal from "@/components/Reveal";
import AppDemo from "@/components/AppDemo";

const CHECKLIST = [
  { label: "Freeze authority", value: "Cxk9…4tRp", state: "fail" as const, note: "can block your sell" },
  { label: "Mint authority", value: "revoked", state: "pass" as const, note: "supply is fixed" },
  { label: "Permanent delegate", value: "none", state: "pass" as const, note: "no forced transfers" },
  { label: "Top 10 holders", value: "41%", state: "warn" as const, note: "of supply, pools excluded" },
  { label: "Your trade impact", value: "-6.2%", state: "warn" as const, note: "price impact at this size" },
  { label: "Token age", value: "14 days", state: "pass" as const, note: "past the riskiest window" },
];

const STATE_STYLE: Record<string, string> = {
  fail: "text-red-500",
  warn: "text-[var(--accent-strong)] opacity-80",
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
  { value: "4", label: "checks that can veto a swap" },
  { value: "<1s", label: "added to your quote — not instead of it" },
  { value: "0", label: "wallets we ever touch" },
];

const STACK = ["Jupiter", "Helius", "Jito", "Solana", "SPL Token-2022", "Solscan"];

const FLOW_STEPS = [
  { n: "01", title: "Paste a mint", body: "The same first move as any swap screen — nothing new to remember." },
  {
    n: "02",
    title: "Quote and checklist render together",
    body: "One request, two answers. The safety read never trails behind the price.",
  },
  {
    n: "03",
    title: "A red flag needs your confirm",
    body: "Clean tokens sign in one click. A hard-kill signal stops you and makes you say yes twice.",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "LP lock, actually verified",
    body: "We decode the real Raydium AMM v4 pool account and check whether the LP tokens sit at the burn address — not a badge someone self-reported.",
  },
  {
    n: "02",
    title: "Freeze & mint authority",
    body: "Read straight off the SPL mint account. If the deployer can still freeze your wallet or print more supply, you see it before you sign — not after.",
  },
  {
    n: "03",
    title: "Token-2022 aware",
    body: "Permanent delegate and transfer hook extensions checked too — the exact tricks a legacy scanner built for the old token program never sees.",
  },
  {
    n: "04",
    title: "Holder concentration, minus the noise",
    body: "Top 10 holders as a percentage of supply, with recognized liquidity-pool accounts excluded so the number isn't inflated by the pool itself.",
  },
  {
    n: "05",
    title: "MEV-protected routing",
    body: "Optional Jito bundle submission skips the public mempool a sandwich bot reads. You get the realized fill vs. the quote — a measured number, not an advertised multiplier.",
  },
  {
    n: "06",
    title: "Non-custodial, always",
    body: "Every check is disclosure, never a gate. Every transaction is signed by your wallet, and only your wallet.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 bg-[var(--background)] font-sans">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.jpeg"
              alt="VERA"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
            <span className="text-base font-semibold tracking-tight">VERA</span>
          </div>
          <LaunchButton className={CTA}>Launch app</LaunchButton>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero — wormhole.com: big display headline + dot texture + diamond field */}
        <section className="bg-dots relative flex min-h-[calc(100svh-73px)] overflow-hidden border-b border-[var(--line)]">
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center gap-14 px-6 py-24 lg:px-12 lg:py-32">
            <Reveal className="flex max-w-3xl flex-col gap-7">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                Every swap, checked before you sign
              </p>
              <h1 className={`${DISPLAY} text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}>
                <span className="text-[var(--foreground)]">See the rug</span>
                <br />
                <span className="text-[var(--muted)]">before it sees you.</span>
              </h1>
              <p className="max-w-xl text-lg text-[var(--muted)]">
                Your swap screen shows you a price. It doesn&apos;t show you whether the deployer
                can still freeze your wallet, print more supply, or pull the pool out from
                under you. This one runs that check inline — no separate tab, no extra wait.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <LaunchButton className={CTA}>Launch app &amp; connect wallet</LaunchButton>
                <span className="text-sm text-[var(--muted)]">
                  Non-custodial. Your keys never leave your wallet.
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Trust marquee */}
        <section className="overflow-hidden border-b border-[var(--line)] bg-[var(--surface)] py-6">
         
          <div className="marquee-track gap-16">
            {[...STACK, ...STACK, ...STACK, ...STACK].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--muted)]"
              >
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

        {/* Flow — two column: copy left, diamond field right */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-20 lg:px-12 lg:py-28">
              <Reveal className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                  What changes
                </h2>
                <p className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                  Three steps. No new habit.
                </p>
              </Reveal>

              <div className="mt-10 flex flex-col divide-y divide-[var(--line)] border-t border-[var(--line)]">
                {FLOW_STEPS.map((step, i) => (
                  <Reveal key={step.n} delayMs={i * 100}>
                    <div className="grid grid-cols-[3rem_1fr] gap-6 py-6">
                      <span className={`${DISPLAY} text-2xl text-[var(--muted)]`}>{step.n}</span>
                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">{step.title}</p>
                        <p className="mt-1.5 text-sm text-[var(--muted)]">{step.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
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

        {/* Feature grid — bordered flat cards */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="max-w-2xl">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Everything checked, every swap.
              </h2>
              <p className="mt-3 text-base text-[var(--muted)]">
                One integrated router — not a bolt-on scanner you have to remember to visit
                separately.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.n} delayMs={i * 60}>
                  <div className="card-flat card-hover flex h-full flex-col gap-5 p-8">
                    <span className="icon-blob text-sm font-semibold">{feature.n}</span>
                    <div className="flex flex-col gap-2.5">
                      <p className="text-lg font-semibold leading-snug text-[var(--foreground)]">
                        {feature.title}
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--muted)]">{feature.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Product demo — immersive interactive preview */}
        <section className="border-b border-[var(--line)] bg-[var(--surface-2)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                See it before you launch it
              </h2>
              <p className={`${DISPLAY} mt-3 text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                This is what renders next to your quote.
              </p>
              <p className="mt-3 text-base text-[var(--muted)]">
                Same panel, three real verdicts. Tap a state to see how the checklist reacts.
              </p>
            </Reveal>

            <Reveal delayMs={120} className="mt-12">
              <AppDemo />
            </Reveal>
          </div>
        </section>

        {/* Checklist preview */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-28">
            <Reveal className="flex flex-col gap-4">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Not a score. A checklist.
              </h2>
              <p className="text-base text-[var(--muted)]">
                A single 0–100 number is unfalsifiable — you can&apos;t tell why it moved. Every
                line here is a real on-chain fact, and every line links out so you can verify it
                yourself on Solscan instead of trusting us blind.
              </p>
              <p className="text-base text-[var(--muted)]">
                Freeze and mint authority come straight off the SPL mint account. LP lock is
                confirmed by decoding the actual Raydium pool, not a self-reported badge. Holder
                concentration excludes recognized pool accounts. Price impact comes from your
                actual trade size, not a generic liquidity figure.
              </p>
            </Reveal>

            <Reveal delayMs={150} className="card-flat p-7 font-mono text-sm">
              <p className="mb-4 flex items-center gap-2 text-red-500">
                <span className="motion-safe:animate-pulse">⛔</span>
                <span className="font-semibold">CRITICAL — freeze authority is live</span>
              </p>
              <ul className="flex flex-col gap-3">
                {CHECKLIST.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-[var(--foreground)]">
                      <span className={STATE_STYLE[row.state]}>{STATE_MARK[row.state]}</span>
                      {row.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="value-pill">{row.value}</span>
                      <span className="hidden text-[var(--muted)] lg:inline">{row.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
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
        <section className="border-b border-[var(--line)] bg-[var(--surface-2)]">
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
        </section>

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
