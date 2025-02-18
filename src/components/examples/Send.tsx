'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function SendBananoForm() {
  const { wallet, isConnected, resolveBNS, updateBalance } = useWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    
    setFeedback({});
    setIsLoading(true);

    try {
      let targetAddress = toAddress;
      
      // Check if input is a BNS name
      if (toAddress.includes('.')) {
        const [name, tld] = toAddress.split('.');
        if (!name || !tld) {
          throw new Error('Invalid BNS format. Use name.tld');
        }
        console.log('Resolving BNS:', name, tld); // Debug log
        const resolved = await resolveBNS(name, tld);
        console.log('Resolved address:', resolved); // Debug log
        if (!resolved) {
          throw new Error('Could not resolve BNS name');
        }
        targetAddress = resolved;
      }

      // Now targetAddress should be a string
      if (typeof targetAddress !== 'string' || !targetAddress.startsWith('ban_') || targetAddress.length < 64) {
        throw new Error('Invalid address format');
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount. Please enter a positive number.');
      }

      const hash = await wallet.send(
        targetAddress as `ban_${string}`,
        `${numAmount}` as `${number}`
      );
      setFeedback({ success: `Transaction sent! Hash: ${hash}` });
      setToAddress('');
      setAmount('');
    } catch (error) {
      setFeedback({ error: error instanceof Error ? error.message : 'Error sending BANANO' });
    } finally {
      setIsLoading(false);
      await updateBalance();
    }
  };

  if (!isConnected) return null;
  
  return (
    <div className="w-full space-y-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-2">Send BANANO</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Recipient Address (ban_... or name.ban)"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-100 text-sm"
            disabled={isLoading}
          />
        </div>
        <input
          type="number"
          step="0.01"
          placeholder="Amount (BAN)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-100 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !toAddress || !amount}
          className="w-full px-4 py-3 rounded-xl bg-black text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {feedback.error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 rounded-xl">{feedback.error}</div>
      )}
      {feedback.success && (
        <div className="p-4 text-sm text-green-500 bg-green-50 rounded-xl">{feedback.success}</div>
      )}
    </div>
  );
}
