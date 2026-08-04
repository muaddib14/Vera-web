// Price history + recent trades for a token. Jupiter's API has no OHLCV or
// trade-feed endpoint, so this leans on two free, keyless third-party APIs
// that are the de-facto standard for Solana token charts: DexScreener (pool
// discovery) + GeckoTerminal (OHLCV, trades).

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export async function findMostLiquidPool(mint: string): Promise<string | null> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { pairs?: { chainId: string; pairAddress: string; liquidity?: { usd?: number } }[] };
  const solanaPairs = (data.pairs ?? []).filter((p) => p.chainId === "solana");
  if (solanaPairs.length === 0) return null;
  solanaPairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  return solanaPairs[0].pairAddress;
}

export type Timeframe = "hour" | "day" | "minute";

export async function getPriceHistory(pool: string, timeframe: Timeframe = "hour", limit = 48): Promise<Candle[]> {
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${timeframe}?limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: { attributes?: { ohlcv_list?: [number, number, number, number, number, number][] } } };
  const list = data.data?.attributes?.ohlcv_list ?? [];
  return list
    .map(([time, open, high, low, close, volume]) => ({ time, open, high, low, close, volume }))
    .sort((a, b) => a.time - b.time);
}

export type Trade = {
  txHash: string;
  wallet: string;
  kind: "buy" | "sell";
  volumeUsd: number;
  time: number;
  tokenAmount: number;
  tokenSymbolSide: "from" | "to";
};

export async function getRecentTrades(pool: string, mint: string, limit = 20): Promise<Trade[]> {
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/trades`);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: {
      attributes: {
        tx_hash: string;
        tx_from_address: string;
        kind: "buy" | "sell";
        volume_in_usd: string;
        block_timestamp: string;
        from_token_address: string;
        from_token_amount: string;
        to_token_amount: string;
      };
    }[];
  };
  return (data.data ?? []).slice(0, limit).map((t) => {
    const a = t.attributes;
    const isFrom = a.from_token_address === mint;
    return {
      txHash: a.tx_hash,
      wallet: a.tx_from_address,
      kind: a.kind,
      volumeUsd: Number(a.volume_in_usd),
      time: new Date(a.block_timestamp).getTime() / 1000,
      tokenAmount: Number(isFrom ? a.from_token_amount : a.to_token_amount),
      tokenSymbolSide: isFrom ? "from" : "to",
    };
  });
}
