'use client';

import React, { useState } from 'react';
import { BananoConnectButton } from '@/components/BananoConnectButton';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ExamplesShowcase } from '@/components/ExamplesShowcase';
import type { ThemeName, ModalThemeName } from '@/components/BananoConnectButton';

export default function Home() {
  const [buttonTheme, setButtonTheme] = useState<ThemeName>('black');
  const [modalTheme, setModalTheme] = useState<ModalThemeName>('light');

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
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
      </div>
    </main>
  );
}
