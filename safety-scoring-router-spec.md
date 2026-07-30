# Safety-Scoring Swap Router — Technical Spec

**One-line positioning:** every Solana swap UI shows you price. None of them show you whether the token can rug you *before* you sign. This one does.

---

## 1. Product thesis

The swap-routing layer is a commodity — Jupiter does the hard part and everyone wraps the same API. The differentiation isn't in routing quality, it's in **what you know at the moment of signing**.

Right now the user flow on every Solana swap UI is:

```
paste mint → see quote → sign → find out later it was a honeypot
```

Yours:

```
paste mint → safety score renders alongside quote → informed decision → sign
```

The moat is your audit library. You've already systematized the rug-detection checks; nobody has wired them into the swap flow itself. Rugcheck.xyz exists but it's a separate site you have to remember to visit — friction that people skip exactly when they're most rushed (new launch, moving fast). Inline is the product.

**Non-goals for v1:** no custody, no shielded transfers, no internal ledger. User's wallet signs, funds never touch you. This keeps you entirely out of money-transmission territory.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js / TypeScript / Tailwind (Vercel)       │
├─────────────────────────────────────────────────┤
│  wallet-adapter  │  Quote panel  │  Score panel  │
└────────┬─────────────────┬──────────────┬────────┘
         │                 │              │
         ▼                 ▼              ▼
   Phantom/Backpack   Jupiter API    Scoring Engine
   (signs tx)         (quote+swap)   (your logic)
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                        Helius RPC              Neon (Postgres)
                        (chain state)           (scored mints cache)
```

**Critical design note:** the score fetch runs **in parallel** with the quote fetch, not after it. Both fire the moment a mint address is entered. If scoring is serialized behind quoting, the UI feels slow and people click through the warning without reading it.

---

## 3. The scoring engine — core differentiator

Direct port of your 6-question fast filter into real-time checks.

### Tier 1 — Hard kills (red, block-by-default)

| Check | Data source | Fail condition |
|---|---|---|
| Mint authority | `getAccountInfo` on mint, parse SPL mint layout | `mintAuthority != null` → infinite mint |
| Freeze authority | same call, same parse | `freezeAuthority != null` → honeypot confirmed |
| Permanent delegate (Token-2022) | parse mint extensions | present → built-in confiscation |
| Transfer hook (Token-2022) | parse mint extensions | hook authority non-null → mid-trade revocation |

Any Tier 1 hit → red banner, swap button requires an explicit "I understand" second click. Don't silently allow it; don't fully block it either (people have legitimate reasons to buy risky tokens — your job is disclosure, not paternalism).

### Tier 2 — Soft signals (amber)

| Check | Data source | Threshold |
|---|---|---|
| Top-10 holder concentration | `getTokenLargestAccounts` + filter pool/burn addresses | >30% excluding pools |
| Liquidity depth | **free from the Jupiter quote** — `priceImpactPct` | see note below |
| LP lock/burn status | Raydium/Orca pool account → LP token holder | LP held by deployer wallet |
| Metadata mutability | Metaplex metadata account, `isMutable` | `true` |
| Token age | first signature timestamp for the mint | <1 hour |

**The free-check insight:** Jupiter's quote response already returns `priceImpactPct` for your specific trade size. That's a *better* liquidity signal than raw TVL because it's sized to the actual trade — it directly answers "will I get sandwiched." Zero extra API calls. Surface it as "your trade moves the price X%" rather than an abstract liquidity number.

### Scoring output

Don't output a single opaque 0–100 number — it invites false confidence and it's unfalsifiable. Output a **checklist with pass/fail per line**, plus a headline verdict:

```
⛔ CRITICAL — freeze authority is live
   ✗ Freeze authority     Cxk9...4tRp   (can block your sell)
   ✓ Mint authority       revoked
   ✓ Permanent delegate   none
   ⚠ Top 10 holders       41% of supply
   ⚠ Your trade impact    -6.2% price impact
   ✓ Token age            14 days
```

This is the "honest about what's live" pattern done properly — each line is independently verifiable by the user on Solscan, which is exactly the credibility Vaelun claims and doesn't demonstrate.

### Caching & latency

- Cache scored mints in Neon (serverless Postgres, via `@neondatabase/serverless` or Drizzle) keyed by mint address, TTL ~5 min for authority checks (rarely change), ~60s for holder/liquidity data.
- Target: full score rendered in **<800ms**. Parallelize every RPC call with `Promise.all`.
- Show the checklist skeleton immediately, fill lines as they resolve. Never block the quote on the score.

---

## 4. Build phases

**Phase 1 — Router only (weekend)**
wallet-adapter connect → Jupiter quote → display → sign → broadcast via Helius → confirm. Ship this bare. It works, it's boring, it's the foundation.

**Phase 2 — Tier 1 scoring (few days)**
Four hard-kill checks. These are all one `getAccountInfo` call plus parsing — the highest signal-per-line-of-code in the whole product.

**Phase 3 — Tier 2 signals (week)**
Holder concentration, LP status, metadata mutability, age. More API surface, more edge cases (pool address filtering is fiddly — you need a maintained list of Raydium/Orca/Meteora pool addresses to exclude).

**Phase 4 — Pick one wedge**
- *MEV measurement*: route via Jito bundles, show realized vs. public-mempool baseline. Real numbers where Vaelun shows a static multiplier.
- *Agent interface*: MCP server exposing `get_quote` + `score_token`. Claude does analysis, user's wallet still signs. Fits your Clipped/CBUG portfolio throughline, and it's the thing Vaelun advertises with a package that doesn't appear to exist.

Don't do both. Phase 4 is the marketing story; pick the one you'd rather demo.

---

## 5. Cost

| Item | Cost |
|---|---|
| Jupiter API | Free tier (25M credits/mo) — nowhere near the ceiling |
| Helius RPC | Free tier (1M credits/mo, 10 req/s) — watch the RPS cap under load |
| Vercel / Neon | Free tiers |
| Domain | ~$10–15/yr |
| Gas | Paid by user's wallet, never yours |

Helius free tier's 10 req/s is the first real ceiling you'll hit — each scored token is several RPC calls, so ~2 concurrent scorers saturates it. Aggressive caching buys you a lot of headroom before the $49/mo Developer plan is needed.

**Revenue option:** Jupiter supports referral fees on routed swaps. A few bps makes it self-funding without any custody. Disclose it in the UI — given that transparency *is* your product positioning, a hidden fee would undercut the whole thing.

---

## 6. Honest limitations (put these in the UI)

The credibility of a safety scorer collapses the moment it's wrong and didn't warn you it could be. State these plainly:

- **Deferred malice**: a token can be clean today and activate a transfer hook next week. A score is a snapshot, not a guarantee.
- **LP lock badges lie**: verify the lock contract, and note that some lockers let the owner *shorten* the lock. If you can't verify the locker bytecode, say "unverified" — not "locked."
- **Rug-checkers are foolable**: cross-reference where you can, and never present the score as definitive.
- **You are not giving financial advice.** The score is a disclosure tool. Say so.

Label everything the way you'd want a tool to label itself for you.

---

## 7. What makes this defensible

Anyone can wrap Jupiter in a weekend. What they can't trivially copy is a maintained, correct set of rug-detection heuristics — the pool-address exclusion lists, the Token-2022 extension parsing, the honeypot triage matrix, the knowledge that mint authority should be re-checked *after* bonding curve completion for pump.fun launches. That's accumulated audit knowledge, and it's the part of your skill library that transfers directly into a product surface.

The routing is the commodity. The scoring is the moat.
