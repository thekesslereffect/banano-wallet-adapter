'use client';

import React from 'react';
import { BananoConnectButton } from '@/components/BananoConnectButton';
import { Balance } from '@/components/examples/Balance';
import { BananoQR } from '@/components/examples/BananoQR';
import { SendBananoForm } from '@/components/examples/Send';
import { TransactionHistory } from '@/components/examples/TransactionHistory';
import { CoinFlip } from '@/components/examples/CoinFlip';
import { TipJar } from '@/components/examples/TipJar';
import { CrashGame } from '@/components/examples/CrashGame';
import { Faucet } from '@/components/examples/Faucet';

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
            Banano Connect
          </h1>
          <p className="text-md text-zinc-400">
            A modern wallet adapter for Banano applications
          </p>
        </header>
        <section className="flex flex-col items-center space-y-16">
          <BananoConnectButton theme="black" modalTheme="light" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <Balance />
            <BananoQR />
            <SendBananoForm />
            <TransactionHistory />
            <CoinFlip />
            <TipJar />
            <CrashGame />
            <Faucet />
          </div>
        </section>
      </div>
    </main>
  );
}
