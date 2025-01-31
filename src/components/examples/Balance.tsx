'use client';

import React from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Balance() {
  const { isConnected, balance } = useWallet();

  if (!isConnected) {
    return (
      <p className="text-sm font-medium text-zinc-400 mb-2">
        Please connect your wallet to view your balance.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-400 mb-2">Balance</h2>
      <p className="text-5xl font-bold tracking-tight">{balance} BAN</p>
    </div>
  );
}
