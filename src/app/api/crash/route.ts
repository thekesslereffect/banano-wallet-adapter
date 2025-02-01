import { NextResponse } from 'next/server';
import * as banani from 'banani';

const GAME_WALLET_SEED = process.env.GAME_WALLET_SEED;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api';
const BET_AMOUNT = '0.1'; // fixed bet amount in BANANO
const MAX_PERCENTAGE = 0.025; // Maximum payout as 2.5% of game wallet balance

// House edge: probability that the final crash multiplier is forced to 1.00.
// Default is 1% (0.01); you can adjust this by setting the environment variable.
const HOUSE_EDGE_PROB = process.env.HOUSE_EDGE_PROB ? parseFloat(process.env.HOUSE_EDGE_PROB) : 0.01;

if (!GAME_WALLET_SEED) {
  throw new Error('GAME_WALLET_SEED environment variable is not set');
}

const rpc = new banani.RPC(RPC_URL);
const gameWallet = new banani.Wallet(rpc, GAME_WALLET_SEED);

export async function POST(req: Request) {
  try {
    const { playerAddress, cashedOutMultiplier } = await req.json();
    if (!playerAddress || !cashedOutMultiplier) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Generate weighted crash multiplier.
    // With probability HOUSE_EDGE_PROB, force the crash multiplier to 1.00.
    let crashMultiplier: number;
    if (Math.random() < HOUSE_EDGE_PROB) {
      crashMultiplier = 1.00;
    } else {
      // Otherwise, generate a multiplier using a weighted formula.
      // Here we use a uniform random value u in [0,1) and transform it.
      // Using an exponent (0.5) biases the distribution toward lower multipliers.
      const u = Math.random();
      crashMultiplier = Number((1 / (1 - 0.9 * Math.pow(u, 0.5))).toFixed(2));
    }

    // If the player's cashed-out multiplier is greater than or equal to the crash multiplier,
    // then the game has already crashed and they lose.
    if (Number(cashedOutMultiplier) >= crashMultiplier) {
      return NextResponse.json({
        success: false,
        crashMultiplier,
        message: `Crashed at ${crashMultiplier}x — you lost your bet.`,
      });
    }

    // Player wins.
    const intendedPayout = parseFloat(BET_AMOUNT) * Number(cashedOutMultiplier);

    // Fetch the game wallet's balance.
    const gameWalletInfo = await rpc.get_account_info(gameWallet.address as `ban_${string}`);
    let gameWalletBalance = 0;
    if (gameWalletInfo && !('error' in gameWalletInfo)) {
      gameWalletBalance = Number(banani.raw_to_whole(BigInt(gameWalletInfo.balance)));
    }

    // Cap the payout to 2.5% of the game wallet's balance.
    const maxPayout = gameWalletBalance * MAX_PERCENTAGE;
    const actualPayout = Math.min(intendedPayout, maxPayout);

    let txHash = '';
    if (actualPayout > 0) {
      // Type assertion to satisfy the Banani amount type.
      txHash = await gameWallet.send(
        playerAddress as `ban_${string}`,
        actualPayout.toString() as `${number}`
      );
    }

    return NextResponse.json({
      success: true,
      won: true,
      cashedOutMultiplier: Number(cashedOutMultiplier),
      crashMultiplier,
      intendedPayout,
      actualPayout,
      hash: txHash,
      message:
        actualPayout < intendedPayout
          ? `You cashed out at ${cashedOutMultiplier}x, but your payout was capped at ${actualPayout.toFixed(
              3
            )} BAN (2.5% of game wallet).`
          : `You cashed out at ${cashedOutMultiplier}x and received ${actualPayout.toFixed(3)} BAN!`,
    });
  } catch (error) {
    console.error('Crash game error:', error);
    return NextResponse.json({ error: 'Crash game error' }, { status: 500 });
  }
}
