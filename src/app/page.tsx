'use client';

import React, { useState } from 'react';
import { BananoConnectButton } from '@/components/BananoConnectButton';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ExamplesShowcase } from '@/components/ExamplesShowcase';
import type { ThemeName, ModalThemeName } from '@/components/BananoConnectButton';
import Link from 'next/link';

export default function Home() {
  const [buttonTheme, setButtonTheme] = useState<ThemeName>('black');
  const [modalTheme, setModalTheme] = useState<ModalThemeName>('light');

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-24">
      <div className="mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
            Banano Connect
          </h1>
          <p className="text-md text-zinc-400 mb-8">
            A modern wallet adapter for Banano applications
          </p>
          <div className="flex flex-col items-center gap-8">
            {/* Without theme selector */}
            {/* <BananoConnectButton theme={"blue"} modalTheme={"light"} /> */}

            {/* With theme selector */}
            <BananoConnectButton theme={buttonTheme} modalTheme={modalTheme} />
            <ThemeSelector
              selectedButtonTheme={buttonTheme}
              selectedModalTheme={modalTheme}
              onButtonThemeChange={setButtonTheme}
              onModalThemeChange={setModalTheme}
            />
          </div>
        </header>

        <ExamplesShowcase />

        <footer className="mt-16 text-center">
          <a
            href="https://github.com/thekesslereffect/banano-wallet-adapter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-400 transition-colors border-2 border-zinc-300 rounded-xl p-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
