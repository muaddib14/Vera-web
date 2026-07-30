"use client";

import { useMemo } from "react";
import { Buffer } from "buffer";

if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

export default function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = HELIUS_RPC ?? clusterApiUrl("mainnet-beta");
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
