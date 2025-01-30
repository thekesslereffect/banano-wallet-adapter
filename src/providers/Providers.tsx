'use client';

import { BananoWalletProvider } from "@/lib/banano-wallet-adapter";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BananoWalletProvider>{children}</BananoWalletProvider>;
}
