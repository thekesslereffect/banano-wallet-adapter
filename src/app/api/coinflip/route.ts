import { NextResponse } from 'next/server';
import * as banani from 'banani';

const GAME_WALLET_SEED = process.env.GAME_WALLET_SEED;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api';
const BET_AMOUNT = '0.1'; // The amount (in BAN) the player bets
const WIN_MULTIPLIER = '0.2'; // The amount sent back on win (2× bet)

const HOUSE_EDGE = true;
const HOUSE_EDGE_PERCENTAGE = 0.04;

if (!GAME_WALLET_SEED) {
  throw new Error('GAME_WALLET_SEED environment variable is not set');
}

const rpc = new banani.RPC(RPC_URL);
const gameWallet = new banani.Wallet(rpc, GAME_WALLET_SEED);

// Cache to prevent double-processing of bets (block hash → timestamp)
const processedBets = new Map<string, number>();
const BET_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// Clean up old processed bets periodically.
setInterval(() => {
  const now = Date.now();
  for (const [hash, timestamp] of processedBets.entries()) {
    if (now - timestamp > BET_EXPIRY_TIME) {
      processedBets.delete(hash);
    }
  }
}, 60_000);

interface ReceivableBlock {
  amount: string;
  amount_decimal: string;
  source: string;
}

interface AccountReceivableResponse {
  blocks: Record<string, ReceivableBlock>;
}

/**
 * Finds a valid bet block that matches the player’s address and expected amount.
 */
async function findValidBet(playerAddress: string): Promise<string | null> {
  try {
    const receivable = (await rpc.get_account_receivable(
      gameWallet.address,
      -1,
      undefined,
      true
    )) as AccountReceivableResponse;

    if (!receivable?.blocks) return null;

    for (const [hash, block] of Object.entries(receivable.blocks)) {
      // Skip if already processed.
      if (processedBets.has(hash)) continue;

      // Check that the bet is exactly the expected amount and from the player.
      if (block.amount_decimal === BET_AMOUNT && block.source === playerAddress) {
        return hash;
      }
    }
    return null;
  } catch (error) {
    console.error('Error checking receivable blocks:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { playerGuess, playerAddress } = await req.json();

    if (!playerGuess || !playerAddress || !['heads', 'tails'].includes(playerGuess)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Look for a valid bet that matches the player's sent 0.1 BAN.
    const betHash = await findValidBet(playerAddress);
    if (!betHash) {
      return NextResponse.json(
        {
          error: 'No valid bet found. Please send 0.1 BAN to play.',
          details: 'Ensure you have sent exactly 0.1 BAN to the game wallet.'
        },
        { status: 400 }
      );
    }

    // Generate a fair coin flip.
    const fairResult = Math.random() < 0.5 ? 'heads' : 'tails';
    let finalResult = fairResult;
    if (HOUSE_EDGE) {
      const applyHouseEdge = Math.random() < HOUSE_EDGE_PERCENTAGE;
      finalResult = applyHouseEdge ? (fairResult === 'heads' ? 'tails' : 'heads') : fairResult;
    }
    const playerWon = playerGuess === finalResult;

    // Attempt to receive the bet. (Work generation is now handled automatically.)
    try {
      await gameWallet.receive(betHash);
      processedBets.set(betHash, Date.now());
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('Unreceivable')) {
        throw err;
      }
    }

    // If the player wins, send the winnings.
    if (playerWon) {
      try {
        const hash = await gameWallet.send(playerAddress as `ban_${string}`, WIN_MULTIPLIER as `${number}`);
        return NextResponse.json({
          success: true,
          won: true,
          result: finalResult,
          hash,
          betHash
        });
      } catch (error) {
        console.error('Failed to send winnings:', error);
        return NextResponse.json(
          {
            error: 'Failed to send winnings',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // If the player loses, simply return the result.
    return NextResponse.json({
      success: true,
      won: false,
      result: finalResult,
      betHash
    });

  } catch (error) {
    console.error('Game error:', error);
    return NextResponse.json(
      {
        error: 'Game error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
