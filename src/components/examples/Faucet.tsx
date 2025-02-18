'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function Faucet() {
  const { wallet, address, isConnected } = useWallet();
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!wallet || !address) return;
    
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
        try {
          await wallet.receive_all();
        } catch (error) {
          console.error('Error receiving faucet funds:', error);
        }
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
    <div className="w-full mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Faucet</h2>
      <p className="text-gray-600">
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
      <p className="text-center text-gray-600">
        {`Note: This is a simple in-memory claim store. Use a persistent store in a real application (like MongoDB) to track claims.`}
      </p>
    </div>
  );
}
