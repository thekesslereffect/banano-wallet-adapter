'use client';

import { BananoWalletProvider } from '@/lib/banano-wallet-adapter';
import { BananoConnectButton } from '@/components/BananoConnectButton';
import { WalletDetails } from '@/components/examples/details';
import { SendBananoForm } from '@/components/examples/send';
import { WalletInfo } from '@/components/examples/info';

export default function Home() {
  return (

      <main className="min-h-screen px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
              Banano Connect
            </h1>
            <p className="text-md text-zinc-400">
              A modern wallet adapter for Banano applications
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

  );
}
