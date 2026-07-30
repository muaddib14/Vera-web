import { neon } from "@neondatabase/serverless";
import type { ScoreResult } from "@/lib/scoring";

const TIER1_TTL_MS = 5 * 60 * 1000;
const TIER2_TTL_MS = 60 * 1000;

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// ponytail: no DATABASE_URL configured yet -> falls back to an in-memory
// per-process cache. Fine for local dev; add DATABASE_URL when this deploys
// somewhere with multiple instances.
const memoryCache = new Map<string, { result: ScoreResult; storedAt: number }>();

function isFresh(storedAt: number, mint: string, result: ScoreResult) {
  const hasTier2 = result.lines.some((l) => l.key === "top10_holders");
  const ttl = hasTier2 ? TIER2_TTL_MS : TIER1_TTL_MS;
  return Date.now() - storedAt < ttl;
}

export async function getCachedScore(mint: string): Promise<ScoreResult | null> {
  if (!sql) {
    const entry = memoryCache.get(mint);
    if (entry && isFresh(entry.storedAt, mint, entry.result)) return entry.result;
    return null;
  }

  try {
    const rows = await sql`
      select result, extract(epoch from checked_at) * 1000 as stored_at_ms
      from scored_mints_cache
      where mint_address = ${mint}
    `;
    const row = rows[0] as { result: ScoreResult; stored_at_ms: number } | undefined;
    if (!row) return null;
    if (!isFresh(row.stored_at_ms, mint, row.result)) return null;
    return row.result;
  } catch (err) {
    console.error("getCachedScore failed, treating as a cache miss:", err);
    return null; // don't let a cache-layer problem crash the request
  }
}

export async function setCachedScore(mint: string, result: ScoreResult): Promise<void> {
  if (!sql) {
    memoryCache.set(mint, { result, storedAt: Date.now() });
    return;
  }

  try {
    await sql`
      insert into scored_mints_cache (mint_address, result, checked_at)
      values (${mint}, ${JSON.stringify(result)}::jsonb, now())
      on conflict (mint_address) do update set result = excluded.result, checked_at = excluded.checked_at
    `;
  } catch (err) {
    console.error("setCachedScore failed, continuing uncached:", err);
  }
}
