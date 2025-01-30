'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Balance() {
  const { balance, isConnected } = useWallet();

  if (!isConnected) {
    return (
      <p className="text-sm font-medium text-zinc-400 mb-2">Please connect your wallet to view balance.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">Balance</h2>
        <p className="text-5xl font-bold tracking-tight">{balance} BAN</p>
      </div>
    </div>
  );
}
