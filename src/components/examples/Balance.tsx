'use client';

import React from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Balance() {
  const { balance, isConnected } = useWallet();

  if (!isConnected) return null;

  return (
    <div className="w-full space-y-4">
      <h2 className="text-sm font-medium text-zinc-400 mb-2">Balance</h2>
      <p className="text-5xl font-bold tracking-tight">{balance} BAN</p>
    </div>
  );
}
