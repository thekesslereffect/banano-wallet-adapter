'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function SendBananoForm() {
  const { sendBanano } = useWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate address format
      if (!toAddress.startsWith('ban_') || toAddress.length < 64) {
        throw new Error('Invalid address format. Address must start with "ban_" and be at least 64 characters');
      }

      // Validate amount
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount. Please enter a positive number');
      }

      // Send transaction with proper types
      const hash = await sendBanano(toAddress as `ban_${string}`, `${numAmount}`);
      setSuccess(`Transaction sent! Hash: ${hash}`);
      setToAddress('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send BANANO');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Send BANANO</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Recipient Address (ban_...)"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 text-sm border-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount (BAN)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 text-sm border-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !toAddress || !amount}
            className="w-full bg-black text-white font-medium px-4 py-3 rounded-xl 
              hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-500 bg-green-50 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}
    </div>
  );
}
