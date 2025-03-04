'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';
import * as banani from 'banani';

type Guess = 'heads' | 'tails';

export function CoinFlip() {
  const { wallet, isConnected, updateBalance } = useWallet();
  const [selectedGuess, setSelectedGuess] = useState<Guess | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; result: Guess; hash?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameBalance, setGameBalance] = useState('0.00');

  useEffect(() => {
    const fetchGameBalance = async () => {
      const gameWalletAddress = process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS;
      if (!gameWalletAddress || !wallet) return;

      try {
        const info = await wallet.rpc.get_account_info(gameWalletAddress as `ban_${string}`);
        setGameBalance(banani.raw_to_whole(BigInt(info.balance)));
      } catch (e) {
        console.error('Error fetching initial game balance:', e);
      }
    };

    fetchGameBalance();
  }, [wallet]);

  const handlePlay = async () => {
    if (!isConnected || !wallet || !selectedGuess || isPlaying) return;

    setIsPlaying(true);
    setError(null);
    setResult(null);

    // Get the game wallet address from environment variables.
    const gameWalletAddress = process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS;
    if (!gameWalletAddress) {
      setError('Game wallet address not configured');
      setIsPlaying(false);
      return;
    }

    try {
      // Send a bet of 0.1 BAN to the game wallet.
      await wallet.send(
        gameWalletAddress as `ban_${string}`, 
        `0.1` as `${number}`
      );

      // Call the coinflip API endpoint.
      const response = await fetch('/api/coinflip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerGuess: selectedGuess,
          playerAddress: wallet.address
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to play game');
      }

      setResult({
        won: data.won,
        result: data.result,
        hash: data.hash
      });

      // Update the game wallet balance after the game.
      const newGameBalance = await wallet.rpc.get_account_info(gameWalletAddress as `ban_${string}`);
      setGameBalance(banani.raw_to_whole(BigInt(newGameBalance.balance)));
      await updateBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play game');
    } finally {
      setIsPlaying(false);
    }
  };

  if (!isConnected) {
    return (
      <p className="text-sm font-medium text-zinc-400 mb-2">
        Please connect your wallet to play the coin flip game.
      </p>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Banano Coin Flip</h2>
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Game balance: {gameBalance} BAN</p>
        <p className="text-sm text-gray-600 mb-2">
          Bet 0.1 BAN and guess the coin flip. Win 2x your bet!
        </p>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-xl ${
              selectedGuess === 'heads'
                ? 'bg-black text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedGuess('heads')}
            disabled={isPlaying}
          >
            Heads
          </button>
          <button
            className={`px-4 py-2 rounded-xl ${
              selectedGuess === 'tails'
                ? 'bg-black text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedGuess('tails')}
            disabled={isPlaying}
          >
            Tails
          </button>
        </div>
      </div>
      <button
        className="w-full py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
        onClick={handlePlay}
        disabled={!selectedGuess || isPlaying}
      >
        {isPlaying ? 'Flipping...' : 'Flip! (0.1 BAN)'}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl">
          {error}
        </div>
      )}
      {result && (
        <div className={`mt-4 p-4 rounded-xl ${result.won ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium">
            {result.won
              ? '🎉 You won! 2x your bet has been sent to your wallet.'
              : '😢 You lost! Better luck next time.'}
          </p>
          <p className="text-sm mt-1">The coin landed on: {result.result}</p>
          {result.hash && (
            <p className="text-xs mt-2 break-all">
              Transaction hash: {result.hash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
