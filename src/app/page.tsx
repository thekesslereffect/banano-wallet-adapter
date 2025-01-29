'use client';

import { useState } from 'react';
import { BananoWalletProvider, BananoConnectButton, useWallet } from '../lib/banano-wallet-adapter';
import { WalletDetails } from '../components/wallet-details';

function SendBananoForm() {
  const { isConnected, sendBanano } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    try {
      setStatus('Sending...');
      const hash = await sendBanano(recipient, amount);
      setStatus(`Success! Hash: ${hash}`);
      setRecipient('');
      setAmount('');
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  if (!isConnected) return null;

  return (
    <form onSubmit={handleSend} className="w-full max-w-sm">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-400">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-none bg-zinc-100"
            placeholder="ban_..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-400">
            Amount (BAN)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-none bg-zinc-100"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <button type="submit" className="w-full bg-black rounded-xl text-white font-medium px-7 py-3">
          Send BANANO
        </button>
        {status && (
          <p className="text-sm text-zinc-400 mt-4 break-all">{status}</p>
        )}
      </div>
    </form>
  );
}

function WalletInfo() {
  const { address, balance, isConnected } = useWallet();

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Balance</h3>
        <p className="text-5xl font-bold tracking-tight">
          {balance} <span className="text-primary">BAN</span>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <BananoWalletProvider>
      <main className="min-h-screen px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
              Banano Connect
            </h1>
            <p className="text-md text-zinc-400">
              A React-based wallet adapter for Banano
            </p>
          </div>
          <div className="flex flex-col items-center space-y-16">
            <BananoConnectButton theme="black" modalTheme="light" />
            <div className="flex gap-16">
              <WalletInfo />
              <WalletDetails />
              <SendBananoForm />
            </div>
          </div>
        </div>
      </main>
    </BananoWalletProvider>
  );
}
