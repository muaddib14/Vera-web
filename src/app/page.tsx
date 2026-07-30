import Image from "next/image";
import LaunchButton from "@/components/LaunchButton";
import Reveal from "@/components/Reveal";

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
  "rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-on)] transition-colors hover:bg-[var(--accent-strong)]";

const DISPLAY = "font-[family-name:var(--font-display)]";

const STATS = [
  { value: "4", label: "hard-kill checks" },
  { value: "<1s", label: "score renders with quote" },
  { value: "0", label: "custody of your funds" },
];

const FEATURES = [
  {
    n: "01",
    title: "MEV-protected routing",
    body: "Optional Jito bundle submission sends your swap straight to a validator, skipping the public mempool a sandwich bot reads. You see the realized fill vs. the quote, not an advertised multiplier.",
    featured: true,
  },
  {
    n: "02",
    title: "Freeze & mint authority",
    body: "Reads the SPL mint account directly. If the deployer can still freeze your wallet or print more supply, you see it before you sign.",
  },
  {
    n: "03",
    title: "Token-2022 aware",
    body: "Permanent delegate and transfer hook extensions checked too — tricks a legacy scanner would miss entirely.",
  },
  {
    n: "04",
    title: "Holder concentration",
    body: "Top 10 holders as a percentage of supply, with recognized liquidity-pool accounts excluded.",
  },
  {
    n: "05",
    title: "Metadata & age signals",
    body: "Whether the token's name/image can still change, and how long it's actually been trading — pulled live.",
  },
  {
    n: "06",
    title: "Non-custodial, always",
    body: "Every check is disclosure. Every transaction is signed by your wallet, and only your wallet.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 bg-[var(--background)] font-sans">
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
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
        {/* Hero */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-28">
            <Reveal className="flex flex-col gap-7">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                Every swap, checked before you sign
              </p>
              <h1
                className={`${DISPLAY} text-5xl leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl`}
              >
                See the rug
                <br />
                <span className="italic text-[var(--accent-strong)]">before it sees you.</span>
              </h1>
              <p className="max-w-lg text-lg text-[var(--muted)]">
                Every Solana swap screen shows you a price. None of them show you whether the
                token can freeze your wallet or drain the pool before you sign. This one does —
                inline, in the time it takes to fetch your quote.
              </p>
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <LaunchButton className={CTA}>Launch app &amp; connect wallet</LaunchButton>
                <span className="text-sm text-[var(--muted)]">
                  Non-custodial. Your keys never leave your wallet.
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--line)] pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className={`${DISPLAY} text-3xl tabular-nums text-[var(--foreground)]`}>
                      {stat.value}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal
              delayMs={150}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] lg:aspect-square"
            >
              <Image
                src="/logo.jpeg"
                alt="Vera — safety-scoring swap router"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </Reveal>
          </div>
        </section>

        {/* Flow */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12">
            <Reveal>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                What changes
              </h2>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                { n: "01", title: "Paste a mint", body: "Same as any swap screen. No new habit to learn.", accent: false },
                {
                  n: "02",
                  title: "Quote and score render together",
                  body: "Both fire the instant you paste. The score never waits behind the quote.",
                  accent: true,
                },
                {
                  n: "03",
                  title: "You decide, then sign",
                  body: "A red flag needs a second confirm. It never silently blocks you.",
                  accent: false,
                },
              ].map((step, i) => (
                <Reveal key={step.n} delayMs={i * 100}>
                  <div
                    className={`h-full rounded-2xl border p-7 transition-colors ${
                      step.accent
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--background)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <p
                      className={`font-mono text-xs ${step.accent ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}`}
                    >
                      {step.n}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{step.title}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <Reveal>
              <h2 className={`${DISPLAY} text-3xl tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Everything checked, every swap.
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[var(--muted)]">
                One integrated router — not a bolt-on scanner you have to remember to visit
                separately.
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.n} delayMs={i * 80} className={feature.featured ? "sm:col-span-2" : ""}>
                  <div
                    className={`group relative h-full overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                      feature.featured
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`${DISPLAY} pointer-events-none absolute -right-2 -top-4 text-8xl text-[var(--foreground)] opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08]`}
                    >
                      {feature.n}
                    </span>
                    <p
                      className={`relative text-lg font-semibold ${
                        feature.featured ? "text-[var(--accent-strong)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {feature.title}
                    </p>
                    <p className="relative mt-2 max-w-md text-sm text-[var(--muted)]">{feature.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Checklist preview */}
        <section className="border-b border-[var(--line)]">
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
                Freeze and mint authority are checked directly against the SPL mint account.
                Holder concentration excludes recognized pool accounts. Price impact comes
                straight from your actual trade size, not a generic liquidity figure.
              </p>
            </Reveal>

            <Reveal
              delayMs={150}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 font-mono text-sm"
            >
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
                    <span className="text-right text-[var(--muted)]">
                      <span className="text-[var(--foreground)]">{row.value}</span>
                      <span className="hidden lg:inline"> · {row.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* MEV protection */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
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

            <Reveal
              delayMs={150}
              className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-7 font-mono text-sm lg:order-1"
            >
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
                What this is not
              </h2>
              <p className="mt-3 max-w-3xl text-base text-[var(--muted)]">
                No custody, no shielded transfers, no internal ledger. Your wallet signs every
                transaction directly — funds never touch this app. A score is a snapshot, not a
                guarantee: a clean token today can still change tomorrow. Disclosure, not
                financial advice.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-6 py-20 lg:px-12 lg:py-28">
            <Reveal className="flex flex-col items-start gap-6">
              <h2 className={`${DISPLAY} text-3xl italic tracking-tight text-[var(--foreground)] lg:text-4xl`}>
                Paste a mint. See what you&apos;re signing.
              </h2>
              <LaunchButton className={CTA}>Launch app &amp; connect wallet</LaunchButton>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 text-xs text-[var(--muted)] lg:px-12">
          VERA — swap routing via Jupiter, on-chain reads via Helius, MEV-protected
          submission via Jito.
        </div>
      </footer>
    </div>
  );
}
