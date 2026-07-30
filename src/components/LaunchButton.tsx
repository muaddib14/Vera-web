"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function LaunchButton({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [awaitingConnect, setAwaitingConnect] = useState(false);

  useEffect(() => {
    if (connected && awaitingConnect) {
      router.push("/app");
    }
  }, [connected, awaitingConnect, router]);

  function handleClick() {
    if (connected) {
      router.push("/app");
      return;
    }
    setAwaitingConnect(true);
    setVisible(true);
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
