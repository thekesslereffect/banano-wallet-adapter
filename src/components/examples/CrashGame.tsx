'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';
import * as banani from 'banani';

export function CrashGame() {
  const { wallet, isConnected, updateBalance } = useWallet();
  const betAmount = '0.1';
  const gameWalletAddress = process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS;

  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  // finalCrashMultiplier is returned by the server after cash out.
  const [finalCrashMultiplier, setFinalCrashMultiplier] = useState<number | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isBetting, setIsBetting] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [gameBalance, setGameBalance] = useState<string | null>(null);

  // Explanation text for the user.
  const instructions = `
    Welcome to Crash!
    • You bet 0.1 BAN.
    • The multiplier starts at 1.00x and rises continuously.
    • Your goal is to cash out at a multiplier BELOW the secret crash multiplier.
    • If you cash out and your locked multiplier is less than the secret multiplier, you win!
    • However, if your cash-out multiplier is equal to or exceeds the secret multiplier, you lose your bet.
    • House Edge: There is a 1% chance (adjustable via the HOUSE_EDGE_PROB environment variable) that the game will immediately crash at 1.00x.
    • Note: Your payout is capped at 2.5% of the game wallet's balance.
  `;

  // Fetch game balance when component mounts
  useEffect(() => {
    const fetchGameBalance = async () => {
      if (!gameWalletAddress || !wallet) return;

      try {
        const info = await wallet.rpc.get_account_info(gameWalletAddress as `ban_${string}`);
        setGameBalance(banani.raw_to_whole(BigInt(info.balance)));
      } catch (e) {
        console.error('Error fetching initial game balance:', e);
      }
    };

    fetchGameBalance();
  }, [wallet, gameWalletAddress]);

  // Start a new game.
  const startGame = async () => {
    if (!isConnected || !wallet || !gameWalletAddress) return;
    // Reset state for a new round.
    setGameActive(true);
    setMultiplier(1.0);
    setFinalCrashMultiplier(null);
    setHasCashedOut(false);
    setResult(null);
    setIsBetting(true);

    try {
      await wallet.send(
        gameWalletAddress as `ban_${string}`, 
        betAmount as `${number}`
      );

      const id = setInterval(() => {
        setMultiplier((prev) => Number((prev + prev * 0.01).toFixed(2)));
      }, 100);
      setIntervalId(id);
    } catch {
      setResult("Error placing bet. Please try again.");
      setGameActive(false);
    } finally {
      setIsBetting(false);
      await updateBalance();
    }
  };

  // Cash out: record the locked multiplier and call the API.
  const cashOut = async () => {
    if (!gameActive || hasCashedOut || !wallet) return;
    setHasCashedOut(true);

    try {
      // Call the Crash API endpoint with the locked multiplier.
      const response = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAddress: wallet.address,
          cashedOutMultiplier: multiplier,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data.error || "Error cashing out.");
      } else {
        // The API returns the final crash multiplier.
        setFinalCrashMultiplier(data.crashMultiplier);
        setResult(data.message);
      }

      const newGameBalance = await wallet.rpc.get_account_info(gameWalletAddress as `ban_${string}`);
      setGameBalance(banani.raw_to_whole(BigInt(newGameBalance.balance)));

    } catch (error) {
      setResult(error instanceof Error ? error.message : "Error cashing out.");
    }
    // Note: We do not clear the interval here—the simulation continues until the crash multiplier is reached.
  };

  // Automatically stop simulation when the local multiplier reaches/exceeds the final crash multiplier.
  useEffect(() => {
    if (!gameActive) return;
    if (finalCrashMultiplier && multiplier >= finalCrashMultiplier) {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setGameActive(false);
      // If the user never cashed out, they lose.
      if (!hasCashedOut) {
        setResult(`Crashed at ${finalCrashMultiplier.toFixed(2)}x — you lost your bet.`);
      }
      // Add this crash value to history.
      setHistory((prev) => [finalCrashMultiplier, ...prev]);
    }
  }, [multiplier, finalCrashMultiplier, gameActive, intervalId, hasCashedOut]);

  // Single button: if game inactive, "Start Game (0.1 BAN)"; if active and not cashed out, "Cash Out"; if cashed out, "Waiting for crash..."
  const buttonLabel = !gameActive
    ? "Start Game (0.1 BAN)"
    : !hasCashedOut
      ? "Cash Out"
      : "Waiting for crash...";

  const handleButtonClick = async () => {
    if (!gameActive) {
      await startGame();
    } else if (!hasCashedOut) {
      await cashOut();
    }
  };

  if (!isConnected) {
    return (
      <p className="text-sm text-gray-500">
        Connect your wallet to play Crash.
      </p>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Crash Game</h2>
      <p>Game balance: {gameBalance} BAN</p>
      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 whitespace-pre-line">
        {instructions}
      </div>
      <div className="text-center">
        <div className="text-6xl font-bold transition duration-500">
          {multiplier.toFixed(2)}x
        </div>
      </div>
      <button
        onClick={handleButtonClick}
        disabled={isBetting}
        className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      {result && (
        <div
          className={`p-4 rounded-lg ${result.toLowerCase().includes('lost') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
        >
          {result}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Past Crash Multipliers:</h3>
          <ul className="mt-2 space-y-1">
            {history.map((crash, index) => (
              <li key={index} className="text-gray-600">
                {crash.toFixed(2)}x
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
