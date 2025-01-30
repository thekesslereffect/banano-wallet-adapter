import { NextResponse } from 'next/server';
import * as banani from 'banani';

const GAME_WALLET_SEED = process.env.GAME_WALLET_SEED;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api';

if (!GAME_WALLET_SEED) {
  throw new Error('GAME_WALLET_SEED environment variable is not set');
}

// Pad seed to 64 characters as required
// const paddedSeed = GAME_WALLET_SEED.padEnd(64, '0');
const rpc = new banani.RPC(RPC_URL);
const gameWallet = new banani.Wallet(rpc, GAME_WALLET_SEED);

export async function POST(req: Request) {
  try {
    const { playerGuess, playerAddress } = await req.json();
    
    // Validate input
    if (!playerGuess || !playerAddress || !['heads', 'tails'].includes(playerGuess)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Generate random result (true = heads, false = tails)
    const result = Math.random() < 0.5;
    const resultString = result ? 'heads' : 'tails';
    const playerWon = playerGuess === resultString;

    await gameWallet.receive_all();

    // If player won, send back 0.2 BANANO (2x their bet)
    if (playerWon) {
      try {
        const hash = await gameWallet.send(playerAddress, '0.2');
        return NextResponse.json({
          success: true,
          won: true,
          result: resultString,
          hash
        });
      } catch (error) {
        console.error('Failed to send winnings:', error);
        return NextResponse.json({ 
          error: 'Failed to send winnings',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // If player lost, just return the result
    return NextResponse.json({
      success: true,
      won: false,
      result: resultString
    });

  } catch (error) {
    console.error('Game error:', error);
    return NextResponse.json({ 
      error: 'Game error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
