import Image from "next/image";
import ConnectButton from "@/components/ConnectButton";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import TradeConsole from "@/components/TradeConsole";
import DiamondField from "@/components/DiamondField";
import { StatusIcon } from "@/components/StatusIcon";
import { LockIcon, ShieldIcon, LayersIcon, UsersIcon, BoltIcon, KeyIcon } from "@/components/icons";

const CHECKLIST = [
  { label: "Freeze authority", value: "Cxk9…4tRp", state: "fail" as const, note: "can block your sell" },
  { label: "Mint authority", value: "revoked", state: "pass" as const, note: "supply is fixed" },
  { label: "Permanent delegate", value: "none", state: "pass" as const, note: "no forced transfers" },
  { label: "LP lock/burn", value: "unverified", state: "warn" as const, note: "pool decoded, lock not confirmed" },
  { label: "Top 10 holders", value: "41%", state: "warn" as const, note: "of supply, pools excluded" },
  { label: "Token age", value: "14 days", state: "pass" as const, note: "past the riskiest window" },
];

const DISPLAY = "font-sans font-extrabold";

const CTA_GHOST =
  "inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]";

// Featured stat leads the giant-number section — <1s reads far more
// impressive at 8xl display scale than the honest-but-small "4".
const STATS = [
  { value: "<1s", label: "added to your quote — not instead of it" },
  { value: "4", label: "on-chain checks that can veto a swap" },
  { value: "0", label: "wallets this app ever touches" },
];

const STACK = ["Jupiter", "Helius", "Jito", "Solana", "SPL Token-2022", "Solscan"];

const FEATURES = [
  {
    icon: LockIcon,
    tile: "tile-purple",
    tag: "Verified on-chain",
    title: "Verified locks. Not vibes.",
    body: "We decode the real Raydium AMM v4 pool account and check whether the LP tokens sit at the burn address — not a badge someone self-reported.",
  },
  {
    icon: ShieldIcon,
    tile: "tile-pink",
    tag: "Read before you sign",
    title: "Full control, exposed.",
    body: "Read straight off the SPL mint account. If the deployer can still freeze your wallet or print more supply, you see it before you sign — not after.",
  },
  {
    icon: LayersIcon,
    tile: "tile-blue",
    tag: "Token-2022 aware",
    title: "New program. Same rigor.",
    body: "Permanent delegate and transfer hook extensions checked too — the exact tricks a legacy scanner built for the old token program never sees.",
  },
  {
    icon: UsersIcon,
    tile: "tile-green",
    tag: "Pools excluded",
    title: "Concentration, minus the noise.",
    body: "Top 10 holders as a percentage of supply, with recognized liquidity-pool accounts excluded so the number isn't inflated by the pool itself.",
  },
  {
    icon: BoltIcon,
    tile: "tile-orange",
    tag: "Via Jito",
    title: "Skip the mempool.",
    body: "Optional bundle submission skips the public mempool a sandwich bot reads — routed straight to a validator, invisible until it lands.",
  },
  {
    icon: KeyIcon,
    tile: "tile-teal",
    tag: "No custody, ever",
    title: "Your keys. Every time.",
    body: "Every check is disclosure, never a gate. Every transaction is signed by your wallet, and only your wallet.",
  },
];

const FAQ = [
  {
    q: "Does VERA ever hold my funds?",
    a: "No. Every quote is built by Jupiter, and every transaction is signed and sent by your own wallet. VERA never takes custody, and never could — there's no vault, no deposit step, nothing to withdraw.",
  },
  {
    q: "What happens if a check fails?",
    a: "A hard-kill signal — a live freeze authority or live mint authority — disables the swap button until you explicitly acknowledge the risk. Softer warnings, like holder concentration, are disclosed but don't block you.",
  },
  {
    q: "Is a clean checklist a guarantee the token is safe?",
    a: "No. It's a snapshot of on-chain state at the moment you checked — a clean token today can still change tomorrow. Cross-reference before you size up a trade; this is disclosure, not financial advice.",
  },
  {
    q: "What does routing through Jito actually change?",
    a: "A normal swap sits in the public mempool, visible to any bot looking to front-run it. A Jito bundle skips that — it goes straight to a validator and stays invisible until it lands.",
  },
  {
    q: "Which tokens can I check?",
    a: "Any SPL or Token-2022 mint on Solana. Token-2022 extensions like permanent delegate and transfer hooks are checked too, not just the legacy program a lot of scanners stop at.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-dark flex flex-col flex-1 font-sans">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="VERA" width={28} height={28} className="rounded-full object-cover" />
            <span className="text-base font-semibold tracking-tight">VERA</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero — centered giant headline, Uniswap-style, card stacked below */}
        <section id="trade" className="bg-dots relative overflow-hidden border-b border-[var(--line)]">
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-20 text-center lg:px-12 lg:py-24">
            <Reveal className="flex flex-col items-center gap-7">
              <h1 className={`${DISPLAY} text-6xl leading-[1.02] tracking-tighter sm:text-7xl lg:text-8xl`}>
                <span className="text-[var(--foreground)]">See the rug</span>
                <br />
                <span className="text-[var(--muted)]">before it sees you.</span>
              </h1>
              <p className="max-w-xl text-lg text-[var(--muted)]">
                Your swap screen shows a price. It doesn&apos;t show whether the deployer can
                still freeze your wallet, print more supply, or pull the pool from under you.
                Paste a mint below — VERA runs that check inline, no separate tab, no extra wait.
              </p>
            </Reveal>

            <Reveal delayMs={150} className="w-full pt-2">
              <TradeConsole />
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

        {/* Protocol-stats panel — Uniswap's two-column layout: headline +
            copy on the left, live stat grid on the right. */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-12">
            <Reveal className="flex flex-col gap-6">
              <h2 className={`${DISPLAY} text-3xl tracking-tighter text-[var(--foreground)] lg:text-4xl`}>
                A checklist that runs with the trade.
              </h2>
              <p className="max-w-md text-base text-[var(--muted)]">
                VERA doesn&apos;t sit in a tab you forget to open. It reads the mint account, the
                pool, and the holder list in the same breath Jupiter prices your swap.
              </p>
              <p className="max-w-md text-base text-[var(--muted)]">
                No badges, no self-reported locks — every line here is something you can verify
                yourself on Solscan.
              </p>
              <a href="#trade" className={CTA_GHOST}>
                Paste a mint →
              </a>
            </Reveal>

            <Reveal delayMs={100} className="flex flex-col gap-4">
              <span className="eyebrow self-start">
                <span className="eyebrow-dot" />
                VERA protocol stats
              </span>

              <div className="grid grid-cols-2 gap-3">
                {STATS.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`stat-cell flex flex-col gap-2 rounded-3xl border border-[var(--line)] bg-[var(--surface)] px-6 py-8 ${
                      i === 0 ? "col-span-2" : ""
                    }`}
                  >
                    <span className="text-sm text-[var(--muted)]">{stat.label}</span>
                    <CountUp
                      value={stat.value}
                      className={`${DISPLAY} text-4xl tracking-tighter sm:text-5xl ${
                        i === 0 ? "text-[var(--accent-strong)]" : "text-[var(--foreground)]"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Built for what VERA actually does — Uniswap-style two-panel layout,
            but the two panels are VERA's two real halves (route + checklist),
            not stand-ins for products that don't exist yet. */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12">
            <Reveal>
              <h2 className={`${DISPLAY} text-3xl tracking-tighter text-[var(--foreground)] lg:text-4xl`}>
                Built for one swap, checked once.
              </h2>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Reveal className="tile tile-blue flex flex-col gap-6 p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <BoltIcon className="h-4 w-4" />
                  The router
                </div>
                <div className="flex flex-col gap-3">
                  <p className={`${DISPLAY} text-2xl tracking-tight text-white lg:text-3xl`}>
                    Quote, priced live.
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">
                    Routed through Jupiter, with an optional Jito bundle so your swap skips the
                    public mempool entirely.
                  </p>
                </div>
                <a href="#trade" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white hover:text-white/80">
                  Get a quote →
                </a>
                <ul className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-4 font-mono text-xs text-white/60">
                  {STACK.map((name) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-white/40" />
                      {name}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delayMs={100} className="tile tile-pink flex flex-col gap-6 p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <ShieldIcon className="h-4 w-4" />
                  The checklist
                </div>
                <div className="flex flex-col gap-3">
                  <p className={`${DISPLAY} text-2xl tracking-tight text-white lg:text-3xl`}>
                    Freeze, mint, locks, holders.
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">
                    Four on-chain facts read straight off the mint and pool accounts — not a
                    reputation score, not a self-reported badge.
                  </p>
                </div>
                <a href="#checklist" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white hover:text-white/80">
                  See a sample check →
                </a>
                <ul className="mt-2 flex flex-col divide-y divide-white/10 border-t border-white/10 pt-2 font-mono text-xs">
                  {CHECKLIST.slice(0, 3).map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2 text-white/80">
                        <StatusIcon state={row.state} />
                        {row.label}
                      </span>
                      <span className="text-white/50">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Two column — copy + a bespoke diamond-scatter motif (real SVG, not a repeating pattern) */}
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

            <div className="diamond-field relative hidden aspect-square w-full self-center lg:block">
              <DiamondField className="absolute inset-0 h-full w-full text-[var(--accent)]" />
              <Image src="/logo.jpeg" alt="VERA" fill sizes="50vw" className="relative z-10 object-contain" />
            </div>
          </div>
        </section>

        {/* Feature grid — uniform 3x2, distinct icon per card */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="max-w-2xl">
              <h2 className={`${DISPLAY} text-3xl tracking-tighter text-[var(--foreground)] lg:text-4xl`}>
                One tool. One job.
              </h2>
              <p className="mt-3 text-base text-[var(--muted)]">
                Not a trading terminal. Not a portfolio tracker. A router with a rug-check
                built into the quote path.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delayMs={i * 60}>
                  <div className={`tile ${feature.tile} flex h-full flex-col justify-between gap-8 p-6 lg:p-7`}>
                    <div className="flex items-center justify-between">
                      <span className="tile-icon shrink-0">
                        <feature.icon />
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-white/70">
                        {feature.tag}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className={`${DISPLAY} text-xl tracking-tight text-white lg:text-2xl`}>{feature.title}</p>
                      <p className="text-sm leading-relaxed text-white/70">{feature.body}</p>
                      <a href="#checklist" className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white hover:text-white/80">
                        See it in the checklist →
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Product showcase — the checklist itself */}
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

            <Reveal delayMs={120} className="relative mt-12 overflow-hidden rounded-[28px] bg-[var(--surface)] shadow-[0_30px_70px_-40px_rgba(13,21,18,0.35)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-2 top-6 z-10 animate-[stamp-in_0.4s_ease-out] select-none rounded border-[3px] border-red-400 px-4 py-1.5 text-base font-black uppercase tracking-[0.2em] text-red-400 opacity-90"
                style={{ transform: "rotate(-9deg)" }}
              >
                Rejected
              </div>

              <div className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-10">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[var(--muted)]">
                  Vera inspection log
                </span>
                <span className="font-mono text-[0.65rem] text-[var(--muted)]">no. 004471</span>
              </div>
              <div className="px-6 pb-2 pt-2 sm:px-10">
                <span className="font-mono text-xs text-[var(--muted)]">mint </span>
                <span className="font-mono text-xs text-[var(--foreground)]">Cxk9WNw…QeR4tRp</span>
              </div>

              <div className="relative mx-6 h-0 border-t border-dashed border-[var(--line)] sm:mx-10">
                <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--surface-2)]" />
                <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--surface-2)]" />
              </div>

              <p className="mt-5 flex items-center gap-2 px-6 text-red-400 sm:px-10">
                <span className="motion-safe:animate-pulse">⛔</span>
                <span className="font-semibold">CRITICAL — freeze authority is live</span>
              </p>

              <ul className="mt-4 flex flex-col px-6 font-mono text-sm sm:px-10">
                {CHECKLIST.map((row, i) => (
                  <li
                    key={row.label}
                    className="flex animate-[type-in_0.3s_ease-out_backwards] items-center justify-between gap-4 border-b border-[var(--line)]/60 py-4 last:border-0"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="flex items-start gap-2.5 text-[var(--foreground)]">
                      <span className="mt-0.5 text-[var(--muted)]">{`0${i + 1}`}</span>
                      <span className="mt-0.5 shrink-0">
                        <StatusIcon state={row.state} />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-sans">{row.label}</span>
                        <span className="font-sans text-xs text-[var(--muted)]">{row.note}</span>
                      </span>
                    </span>
                    <span className="value-pill shrink-0">{row.value}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-1 border-t border-[var(--line)] bg-[var(--surface-2)] px-6 py-4 font-mono text-[0.65rem] text-[var(--muted)] sm:px-10">
                <span>
                  Illustrative example. Freeze and mint authority come straight off the SPL mint
                  account.
                </span>
                <span>LP lock is confirmed by decoding the actual Raydium pool, not a self-reported badge.</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* MEV protection — bar comparison instead of another mono list, breaks the repetition */}
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

            <Reveal delayMs={150} className="relative overflow-hidden rounded-[28px] bg-[var(--surface)] shadow-[0_30px_70px_-40px_rgba(13,21,18,0.35)] lg:order-1">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-2 top-5 z-10 animate-[stamp-in_0.4s_ease-out] select-none rounded border-[3px] px-3 py-1 text-sm font-black uppercase tracking-[0.2em] text-[var(--accent-strong)] opacity-90"
                style={{ borderColor: "var(--accent-strong)", transform: "rotate(-9deg)" }}
              >
                Bundled
              </div>

              <div className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-8">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[var(--muted)]">
                  Realized vs. quoted
                </span>
                <span className="font-mono text-[0.65rem] text-[var(--muted)]">via jito</span>
              </div>

              <div className="relative mx-6 mt-4 h-0 border-t border-dashed border-[var(--line)] sm:mx-8">
                <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
                <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
              </div>

              <div className="flex flex-col gap-4 px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between font-mono text-sm">
                    <span className="font-sans text-[var(--muted)]">Quoted out</span>
                    <span className="text-[var(--foreground)]">1,204,880,000</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)]">
                    <div className="h-1.5 w-full rounded-full bg-[var(--line)]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between font-mono text-sm">
                    <span className="font-sans text-[var(--muted)]">Realized out</span>
                    <span className="text-[var(--foreground)]">1,203,410,500</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)]">
                    <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: "99.88%" }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-2)] px-6 py-4 sm:px-8">
                <span className="text-sm text-[var(--muted)]">Delta vs quote</span>
                <span className="value-pill">-0.12%</span>
              </div>
              <p className="px-6 py-3 font-mono text-[0.65rem] text-[var(--muted)] sm:px-8">
                Illustrative — your actual delta renders after each swap you sign.
              </p>
            </Reveal>
          </div>
        </section>


        {/* FAQ — Uniswap's "Explore the UNIverse" row pattern, repointed at
            answers VERA can actually give instead of Docs/Blog links that
            don't exist yet. */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-4xl px-6 py-20 lg:px-12">
            <Reveal>
              <h2 className={`${DISPLAY} text-3xl tracking-tighter text-[var(--foreground)] lg:text-4xl`}>
                Before you paste a mint.
              </h2>
            </Reveal>

            <Reveal delayMs={80} className="mt-10 flex flex-col divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                    <span className="text-lg font-semibold text-[var(--foreground)]">{item.q}</span>
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      aria-hidden
                    >
                      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-12">
            <Reveal className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-[var(--accent-soft)] px-8 py-12 sm:flex-row sm:items-center lg:px-14">
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Paste a mint.
                <br />
                See what you&apos;re signing.
              </h2>
              <ConnectButton />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-8 text-xs text-[var(--muted)] lg:px-12">
          <span>VERA checks freeze authority, mint authority, LP lock, and holder concentration live.</span>
          <span>
            Reads and routes via Jupiter, Helius, Jito, and Solana — verify any of it yourself on Solscan.
          </span>
          <span>
            No custody, ever — your wallet signs every transaction directly. A clean checklist is
            a snapshot, not a guarantee, and this is disclosure, not financial advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
