// Fixed token set — pump, hype, zcash, Circle xStock, solana, usdc, usdt —
// shown as hero orbs and always pinned at the top of Explore, since some of
// these (SOL, USDC, USDT) rarely show up in Jupiter's "trending" feed even
// though they're the tokens most people actually look for. Mints verified
// against Jupiter's token search, not guessed.
export const PINNED_TOKENS = [
  { symbol: "PUMP", mint: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn", icon: "https://coin-images.coingecko.com/coins/images/67164/large/pump.jpg" },
  { symbol: "HYPE", mint: "98sMhvDwXj1RQi5c5Mndm3vPe9cBqPrbLaufMXFNMh5g", icon: "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg" },
  { symbol: "ZEC", mint: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS", icon: "https://coin-images.coingecko.com/coins/images/486/large/Brandmark-Yellow_%281%29.png" },
  { symbol: "CRCLx", mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", icon: "https://coin-images.coingecko.com/coins/images/66918/large/CRCLx.png" },
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", icon: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png" },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png" },
  { symbol: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", icon: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png" },
] as const;
