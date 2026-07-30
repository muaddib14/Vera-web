import { NextResponse } from "next/server";
import { scoreMint } from "@/lib/scoring";
import { getCachedScore, setCachedScore } from "@/lib/cache";

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  const cached = await getCachedScore(mint);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await scoreMint(mint);
    await setCachedScore(mint, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to score mint.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
