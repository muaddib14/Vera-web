"use client";

// Positions/sizes/timing for the floating field. Sizes bumped up ~1.35x
// from the original live-trending version per request ("agak digedein").
// Pulled in closer to the card so the gap between it and the screen edge
// doesn't read empty, while still clearing the card itself.
const ORB_SLOTS = [
  { top: "10%", left: "14%", size: 124 },
  { top: "52%", left: "10%", size: 92 },
  { top: "16%", left: "80%", size: 100 },
  { top: "58%", left: "84%", size: 110 },
  { top: "86%", left: "22%", size: 76 },
  { top: "8%", left: "62%", size: 81 },
  { top: "82%", left: "72%", size: 68 },
] as const;

const DELAYS = ["0s", "1.2s", "0.6s", "1.8s", "2.4s", "0.9s", "1.6s"];

// Fixed token set per request — pump, hype, zcash, Circle xStock, solana,
// usdc, usdt — instead of the live Jupiter trending list.
const TOKENS = [
  { symbol: "PUMP", icon: "https://coin-images.coingecko.com/coins/images/67164/large/pump.jpg" },
  { symbol: "HYPE", icon: "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg" },
  { symbol: "ZEC", icon: "https://coin-images.coingecko.com/coins/images/486/large/Brandmark-Yellow_%281%29.png" },
  { symbol: "CRCLX", icon: "https://coin-images.coingecko.com/coins/images/66918/large/CRCLx.png" },
  { symbol: "SOL", icon: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png" },
  { symbol: "USDC", icon: "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png" },
  { symbol: "USDT", icon: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png" },
] as const;

export default function HeroOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {ORB_SLOTS.map((slot, i) => {
        const token = TOKENS[i % TOKENS.length];
        const style = {
          top: slot.top,
          left: slot.left,
          width: slot.size,
          height: slot.size,
          ["--delay" as string]: DELAYS[i % DELAYS.length],
        };
        return (
          <div key={token.symbol} className="hero-orb overflow-hidden" style={style} title={token.symbol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={token.icon} alt="" className="h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
