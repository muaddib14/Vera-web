import Image from "next/image";
import LaunchButton from "@/components/LaunchButton";
import Reveal from "@/components/Reveal";
import HeroPreview from "@/components/HeroPreview";
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

const CTA =
  "inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors hover:bg-[var(--accent-strong)]";

const CTA_GHOST =
  "inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--accent)]";

const DISPLAY = "font-[family-name:var(--font-display)]";

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
    title: "LP lock, actually verified",
    body: "We decode the real Raydium AMM v4 pool account and check whether the LP tokens sit at the burn address — not a badge someone self-reported.",
  },
  {
    icon: ShieldIcon,
    title: "Freeze & mint authority",
    body: "Read straight off the SPL mint account. If the deployer can still freeze your wallet or print more supply, you see it before you sign — not after.",
  },
  {
    icon: LayersIcon,
    title: "Token-2022 aware",
    body: "Permanent delegate and transfer hook extensions checked too — the exact tricks a legacy scanner built for the old token program never sees.",
  },
  {
    icon: UsersIcon,
    title: "Holder concentration, minus the noise",
    body: "Top 10 holders as a percentage of supply, with recognized liquidity-pool accounts excluded so the number isn't inflated by the pool itself.",
  },
  {
    icon: BoltIcon,
    title: "MEV-protected routing",
    body: "Optional Jito bundle submission skips the public mempool a sandwich bot reads — routed straight to a validator, invisible until it lands.",
  },
  {
    icon: KeyIcon,
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
        {/* Hero — headline + a real, interactive preview of the checklist product */}
        <section className="bg-dots relative overflow-hidden border-b border-[var(--line)]">
          <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 min-h-[640px] lg:min-h-[calc(100svh-73px)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-24">
            <Reveal className="flex max-w-xl flex-col gap-7">
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

            <Reveal delayMs={150} className="w-full max-w-md lg:mx-auto lg:max-w-none">
              <HeroPreview />
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
                <Reveal key={feature.title} delayMs={i * 60}>
                  <div className="card-hover flex h-full flex-col border border-[var(--line)] bg-[var(--surface)]">
                    <div className="flex items-center justify-between px-6 pt-4">
                      <span className="icon-blob shrink-0">
                        <feature.icon />
                      </span>
                      <span className="font-mono text-[0.65rem] text-[var(--muted)]">{`check 0${i + 1}/06`}</span>
                    </div>
                    <div className="relative mx-6 mt-4 h-0 border-t border-dashed border-[var(--line)]">
                      <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
                      <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[var(--background)]" />
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 px-6 pb-7 pt-5">
                      <p className="text-lg font-semibold leading-snug text-[var(--foreground)]">{feature.title}</p>
                      <p className="text-sm leading-relaxed text-[var(--muted)]">{feature.body}</p>
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

            <Reveal delayMs={120} className="relative mt-12 overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_70px_-40px_rgba(13,21,18,0.35)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-2 top-6 z-10 animate-[stamp-in_0.4s_ease-out] select-none rounded border-[3px] border-red-600 px-4 py-1.5 text-base font-black uppercase tracking-[0.2em] text-red-600 opacity-90"
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

              <p className="mt-5 flex items-center gap-2 px-6 text-red-600 sm:px-10">
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

            <Reveal delayMs={150} className="relative overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_70px_-40px_rgba(13,21,18,0.35)] lg:order-1">
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


        {/* Final CTA */}
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
