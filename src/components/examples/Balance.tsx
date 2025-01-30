'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Balance() {
  const { address, balance, pendingBalance, receivePending, isConnected } = useWallet();
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReceivePending = async () => {
    if (!isConnected || isReceiving) return;
    
    setIsReceiving(true);
    setError(null);
    
    try {
      await receivePending();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive pending transactions');
    } finally {
      setIsReceiving(false);
    }
  };

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

      {Number(pendingBalance) > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Pending</h3>
          <p className="text-xl text-gray-600">{pendingBalance} BAN</p>
          <button
            onClick={handleReceivePending}
            disabled={isReceiving}
            className="mt-2 w-full bg-black text-white font-medium px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReceiving ? 'Receiving...' : 'Receive Pending'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
