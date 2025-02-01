'use client';

import React, { useState, ReactNode } from 'react';
import { Balance } from '@/components/examples/Balance';
import { BananoQR } from '@/components/examples/BananoQR';
import { SendBananoForm } from '@/components/examples/Send';
import { TransactionHistory } from '@/components/examples/TransactionHistory';
import { CoinFlip } from '@/components/examples/CoinFlip';
import { TipJar } from '@/components/examples/TipJar';
import { CrashGame } from '@/components/examples/CrashGame';
import { Faucet } from '@/components/examples/Faucet';
import { TokenGateExample } from '@/components/examples/TokenGateExample';
import { CustomWalletGenerator } from '@/components/examples/CustomWalletGenerator';

const componentsMap: Record<string, ReactNode> = {
  Balance: <Balance />,
  'Banano QR': <BananoQR />,
  Send: <SendBananoForm />,
  'Transaction History': <TransactionHistory />,
  CoinFlip: <CoinFlip />,
  TipJar: <TipJar />,
  'Crash Game': <CrashGame />,
  Faucet: <Faucet />,
  'Token Gate': <TokenGateExample />,
  'Custom Wallet Generator': <CustomWalletGenerator />,
};

export function ExamplesShowcase() {
  const [selectedComponent, setSelectedComponent] = useState<string>('Balance');

  return (
    <section className="flex flex-col items-center space-y-16">
      {/* Component Selector */}
      <div className="w-full max-w-md">
        <label className="block text-center text-lg font-medium text-gray-700 mb-4">
          Select a Component to View:
        </label>
        <select
          value={selectedComponent}
          onChange={(e) => setSelectedComponent(e.target.value)}
          className="w-full p-3 rounded-xl outline-none"
        >
          {Object.keys(componentsMap).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Display the selected component */}
      <div className="w-full max-w-md">
        {componentsMap[selectedComponent]}
      </div>
    </section>
  );
}
