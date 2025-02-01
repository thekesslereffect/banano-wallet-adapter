import { NextResponse } from 'next/server';
import * as banani from 'banani';

const FAUCET_WALLET_SEED = process.env.FAUCET_WALLET_SEED;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://kaliumapi.appditto.com/api';
const CLAIM_AMOUNT = '1'; // Claim amount in BANANO

if (!FAUCET_WALLET_SEED) {
  throw new Error('FAUCET_WALLET_SEED environment variable is not set');
}

const rpc = new banani.RPC(RPC_URL);
const faucetWallet = new banani.Wallet(rpc, FAUCET_WALLET_SEED);

// In-memory claim store (for demonstration only)!!! Make sure to use a persistent store in a real application.
// Keys are wallet addresses; values are the timestamp (in ms) when they last claimed.
const claims: Record<string, number> = {};

export async function POST(req: Request) {
  try {
    const { playerAddress } = await req.json();
    if (!playerAddress) {
      return NextResponse.json({ error: 'Missing playerAddress' }, { status: 400 });
    }

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // If the wallet has already claimed within the last day, reject the request.
    if (claims[playerAddress] && (now - claims[playerAddress] < ONE_DAY_MS)) {
      return NextResponse.json(
        { error: 'You can only claim funds once per day. Please try again later.' },
        { status: 400 }
      );
    }

    // Update the claim time.
    claims[playerAddress] = now;

    // Send funds from the faucet wallet to the player's wallet.
    const txHash = await faucetWallet.send(
      playerAddress as `ban_${string}`,
      CLAIM_AMOUNT.toString() as `${number}`
    );

    return NextResponse.json({
      success: true,
      message: `Claim successful! ${CLAIM_AMOUNT} BAN has been sent to your wallet.`,
      hash: txHash,
    });
  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { error: 'Faucet error. Please try again later.' },
      { status: 500 }
    );
  }
}
