'use client';

import React from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

interface TokenGateProps {
  minimumBalance: string; // Amount of BANANO required
  children: React.ReactNode; // Content to show when balance requirement is met
  fallback?: React.ReactNode; // Optional content to show when requirement is not met
}

export function TokenGate({ minimumBalance, children, fallback }: TokenGateProps) {
  const { isConnected, balance } = useWallet();

  if (!isConnected) {
    return (
      <div className="rounded-lg bg-zinc-100 p-4">
        <p className="text-sm font-medium text-zinc-600">
          Please connect your wallet to view this content.
        </p>
      </div>
    );
  }

  const currentBalance = parseFloat(balance);
  const requiredBalance = parseFloat(minimumBalance);

  if (currentBalance < requiredBalance) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="rounded-lg bg-zinc-100 p-4">
        <p className="text-sm font-medium text-zinc-600">
          You need at least {minimumBalance} BAN to view this content.
          Current balance: {balance} BAN
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
