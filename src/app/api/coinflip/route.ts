import { NextResponse } from 'next/server';
import * as banani from 'banani';

const GAME_WALLET_SEED = process.env.GAME_WALLET_SEED;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api';
const BET_AMOUNT = '0.1'; // Standard bet amount in BANANO
const WIN_MULTIPLIER = '0.2'; // 2x the bet amount

// Game settings
const HOUSE_EDGE = true;
const HOUSE_EDGE_PERCENTAGE = 0.04;

if (!GAME_WALLET_SEED) {
  throw new Error('GAME_WALLET_SEED environment variable is not set');
}

const rpc = new banani.RPC(RPC_URL);
const gameWallet = new banani.Wallet(rpc, GAME_WALLET_SEED);

// Cache to prevent double-processing of bets
const processedBets = new Map<string, number>(); // hash -> timestamp
const BET_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up old processed bets periodically
setInterval(() => {
  const now = Date.now();
  for (const [hash, timestamp] of processedBets.entries()) {
    if (now - timestamp > BET_EXPIRY_TIME) {
      processedBets.delete(hash);
    }
  }
}, 60000); // Clean up every minute

interface ReceivableBlock {
  amount: string;
  amount_decimal: string;
  source: string;
}

interface AccountReceivableResponse {
  blocks: {
    [hash: string]: ReceivableBlock;
  };
}

async function findValidBet(playerAddress: string): Promise<string | null> {
  try {
    console.log('Checking for bets from player:', playerAddress);
    console.log('Game wallet address:', gameWallet.address);
    
    // Get receivable blocks with source info
    const receivable = await rpc.get_account_receivable(gameWallet.address, -1, undefined, true) as AccountReceivableResponse;
    console.log('Receivable response:', JSON.stringify(receivable, null, 2));
    
    if (!receivable || !receivable.blocks) {
      console.log('No receivable blocks found');
      return null;
    }

    // Look through receivable blocks
    for (const [hash, block] of Object.entries(receivable.blocks)) {
      console.log('Checking block:', hash);
      console.log('Block details:', JSON.stringify(block, null, 2));
      
      // Skip if we've already processed this bet
      if (processedBets.has(hash)) {
        console.log('Block already processed, skipping');
        continue;
      }

      // Verify amount and sender
      console.log('Comparing amount:', block.amount_decimal, 'with expected:', BET_AMOUNT);
      console.log('Comparing source:', block.source, 'with expected:', playerAddress);
      
      if (block.amount_decimal === BET_AMOUNT && block.source === playerAddress) {
        console.log('Valid bet found!');
        return hash;
      }
    }

    console.log('No valid bet found after checking all blocks');
    return null;
  } catch (error) {
    console.error('Error checking receivable blocks:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { playerGuess, playerAddress } = await req.json();
    console.log('Received request:', { playerGuess, playerAddress });
    
    // Validate input
    if (!playerGuess || !playerAddress || !['heads', 'tails'].includes(playerGuess)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Find a valid bet from this player
    const betHash = await findValidBet(playerAddress);
    if (!betHash) {
      return NextResponse.json({ 
        error: 'No valid bet found. Please send 0.1 BAN to play.',
        details: 'Ensure you have sent exactly 0.1 BAN to the game wallet.'
      }, { status: 400 });
    }

    // First generate a fair coin flip
    const fairResult = Math.random() < 0.5;
    const fairResultString = fairResult ? 'heads' : 'tails';
    
    let finalResultString = '';
    if (HOUSE_EDGE) {
      // Then apply house edge by giving 4% chance to flip the result in house's favor
      const applyHouseEdge = Math.random() < HOUSE_EDGE_PERCENTAGE;
      finalResultString = applyHouseEdge ? (fairResultString === 'heads' ? 'tails' : 'heads') : fairResultString;
    } else {
      finalResultString = fairResultString;
    }
    
    const playerWon = playerGuess === finalResultString;

    // Try to receive the bet
    try {
      await gameWallet.receive(betHash);
      // Mark this bet as processed
      processedBets.set(betHash, Date.now());
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('Unreceivable')) {
        throw err;
      }
    }

    // If player won, send back winnings
    if (playerWon) {
      try {
        const hash = await gameWallet.send(playerAddress as `ban_${string}`, WIN_MULTIPLIER as `${number}`);
        return NextResponse.json({
          success: true,
          won: true,
          result: finalResultString,
          hash,
          betHash
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
      result: finalResultString,
      betHash
    });

  } catch (error) {
    console.error('Game error:', error);
    return NextResponse.json({ 
      error: 'Game error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
