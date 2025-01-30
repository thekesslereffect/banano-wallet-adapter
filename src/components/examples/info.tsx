'use client';

import React from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function WalletInfo() {
  const { balance, isConnected } = useWallet();

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Balance</h3>
        <p className="text-5xl font-bold tracking-tight">
          {balance || '0.00'} <span className="text-primary">BAN</span>
        </p>
      </div>
    </div>
  );
}
