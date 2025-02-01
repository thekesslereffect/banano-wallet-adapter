'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Faucet() {
  const { address, isConnected, getUserBalance } = useWallet();
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsClaiming(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAddress: address }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Claim failed.');
      } else {
        setMessage(data.message);
        await getUserBalance();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <p className="text-sm text-gray-500">
        Connect your wallet to claim funds from the faucet.
      </p>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Faucet</h2>
      <p className="text-center text-gray-600">
        Claim free BANANO once per day!
      </p>
      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {isClaiming ? 'Claiming...' : 'Claim Faucet'}
      </button>
      {message && (
        <div className="p-4 rounded-xl bg-green-100 text-green-800 text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-100 text-red-800 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
