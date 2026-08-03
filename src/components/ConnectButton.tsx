"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

// Nav-level wallet connect — the only "launch" affordance now that the
// trade widget itself lives in the hero, mirroring how Uniswap's homepage
// nav just says "Connect" instead of routing to a separate app shell.
export default function ConnectButton() {
  return <WalletMultiButton />;
}
