'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

// Preset tip jar address.
const TIP_ADDRESS =
  'ban_1cosmic1qkfnur4xnqdz3hy8zpofjxqzgpibm8ei3hnohfa8owbky91jnmtk';

export function TipJar() {
  const { wallet, isConnected, updateBalance } = useWallet();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preset tip amounts.
  const tipOptions = [0.1, 1, 10];

  const handleDonate = async () => {
    if (!isConnected || !wallet || selectedTip === null) return;
    setIsDonating(true);
    setFeedback(null);
    setError(null);
    try {
      const hash = await wallet.send(
        TIP_ADDRESS as `ban_${string}`,
        `${selectedTip}` as `${number}`
      );
      setFeedback(`Thank you for your donation! Transaction hash: ${hash}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to donate');
    } finally {
      setIsDonating(false);
      await updateBalance();
    }
  };

  if (!isConnected) {
    return (
      <p className="text-sm font-medium text-zinc-400 mb-2">
        Please connect your wallet to donate.
      </p>
    );
  }

  return (
    <div className="w-fullmx-auto space-y-6">
      <h2 className="text-2xl font-bold">Tip Jar</h2>
      <p className=" text-gray-600">
        Support the project by donating BANANO!
      </p>

      {/* Toggle Buttons for Tip Amounts */}
      <div className="flex gap-4">
        {tipOptions.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedTip(amount)}
            disabled={isDonating}
            className={`px-4 py-2 rounded-xl transition-colors ${
              selectedTip === amount
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {amount} BAN
          </button>
        ))}
      </div>

      {/* Big Donate Button */}
      <button
        onClick={handleDonate}
        disabled={selectedTip === null || isDonating}
        className="w-full py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
      >
        {isDonating ? 'Donating...' : 'Donate'}
      </button>

      {feedback && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl">
          {feedback}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
