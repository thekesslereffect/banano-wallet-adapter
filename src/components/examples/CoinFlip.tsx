import { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

type Guess = 'heads' | 'tails';

export function CoinFlip() {
  const { address, isConnected, sendBanano, getBalance, getUserBalance } = useWallet();
  const [selectedGuess, setSelectedGuess] = useState<Guess | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{
    won: boolean;
    result: Guess;
    hash?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameBalance, setGameBalance] = useState('0.00');

  

  const handlePlay = async () => {
    if (!isConnected || !address || !selectedGuess || isPlaying) return;

    setIsPlaying(true);
    setError(null);
    setResult(null);

    await getBalance(process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS as `ban_${string}`).then((balance) => {
      setGameBalance(balance);
    });

    try {
      // First send 0.1 BANANO to the game wallet
      const GAME_WALLET_ADDRESS = process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS;
      if (!GAME_WALLET_ADDRESS) {
        throw new Error('Game wallet address not configured');
      }

      // Send the bet amount
      await sendBanano(GAME_WALLET_ADDRESS, '0.1');

      // Play the game
      const response = await fetch('/api/coinflip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerGuess: selectedGuess,
          playerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to play game');
      }

      setResult({
        won: data.won,
        result: data.result,
        hash: data.hash,
      });
      
      // await getUserBalance(); // This will update the balance in case we want to check it after the game
      await getBalance(process.env.NEXT_PUBLIC_GAME_WALLET_ADDRESS as `ban_${string}`).then((balance) => {
        setGameBalance(balance);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play game');
    } finally {
      setIsPlaying(false);
    }
  };

  if (!isConnected) {
    return (
        <p className="text-sm font-medium text-zinc-400 mb-2">Please connect your wallet to play the coin flip game.</p>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Banano Coin Flip</h2>
      
      
      <div className="mb-6">
      <p className="text-sm text-gray-600 mb-2">Game balance: {gameBalance} BAN</p>
        <p className="text-sm text-gray-600 mb-2">Bet 0.1 BAN and guess the coin flip. Win 2x your bet!</p>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-lg ${
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
            className={`px-4 py-2 rounded-lg ${
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
        className="w-full py-3 bg-black text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
        onClick={handlePlay}
        disabled={!selectedGuess || isPlaying}
      >
        {isPlaying ? 'Flipping...' : 'Flip! (0.1 BAN)'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.won ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <p className="font-medium">
            {result.won
              ? '🎉 You won! 2x your bet has been sent to your wallet.'
              : '😢 You lost! Better luck next time.'}
          </p>
          <p className="text-sm mt-1">The coin landed on: {result.result}</p>
          {result.hash && (
            <p className="text-xs mt-2">
              Transaction hash: {result.hash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
