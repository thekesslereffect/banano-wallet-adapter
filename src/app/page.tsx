'use client';

import React from 'react';
import { BananoConnectButton } from '@/components/BananoConnectButton';
import { ExamplesShowcase } from '@/components/ExamplesShowcase';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
            Banano Connect
          </h1>
          <p className="text-md text-zinc-400 mb-5">
            A modern wallet adapter for Banano applications
          </p>
          <BananoConnectButton theme="black" modalTheme="light" />
        </header>

        <ExamplesShowcase />
      </div>
    </main>
  );
}
