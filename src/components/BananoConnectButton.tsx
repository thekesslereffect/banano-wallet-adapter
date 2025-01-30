'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

interface ButtonTheme {
  backgroundColor: string;
  textColor: string;
  hoverColor: string;
  shadowColor: string;
}

interface ModalTheme {
  backgroundColor: string;
  inputBackground: string;
  textColor: string;
  labelColor: string;
  placeholderColor: string;
  borderColor: string;
  primaryButton: string;
  secondaryButton: string;
}

type ThemeName = 'black' | 'white' | 'blue' | 'yellow' | 'green';
type ModalThemeName = 'light' | 'dark';

const themes: Record<ThemeName, ButtonTheme> = {
  black: {
    backgroundColor: 'bg-gradient-to-b from-zinc-800 to-black',
    textColor: 'text-white',
    hoverColor: 'hover:from-black hover:to-zinc-900',
    shadowColor: 'shadow-zinc-900/20 hover:shadow-zinc-900/30',
  },
  white: {
    backgroundColor: 'bg-gradient-to-b from-white to-zinc-100',
    textColor: 'text-black',
    hoverColor: 'hover:from-zinc-100 hover:to-zinc-200',
    shadowColor: 'shadow-zinc-100/20 hover:shadow-zinc-100/30',
  },
  blue: {
    backgroundColor: 'bg-gradient-to-b from-blue-500 to-blue-600',
    textColor: 'text-white',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    shadowColor: 'shadow-blue-500/20 hover:shadow-blue-300/30',
  },
  yellow: {
    backgroundColor: 'bg-gradient-to-b from-yellow-400 to-yellow-500',
    textColor: 'text-black',
    hoverColor: 'hover:from-yellow-500 hover:to-yellow-600',
    shadowColor: 'shadow-yellow-500/20 hover:shadow-yellow-300/30',
  },
  green: {
    backgroundColor: 'bg-gradient-to-b from-green-500 to-green-600',
    textColor: 'text-white',
    hoverColor: 'hover:from-green-600 hover:to-green-700',
    shadowColor: 'shadow-green-500/20 hover:shadow-green-300/30',
  },
};

const modalThemes: Record<ModalThemeName, ModalTheme> = {
  light: {
    backgroundColor: 'bg-white',
    inputBackground: 'bg-zinc-50',
    textColor: 'text-zinc-900',
    labelColor: 'text-zinc-700',
    placeholderColor: 'placeholder-zinc-500',
    borderColor: 'border-zinc-200',
    primaryButton: 'bg-black hover:bg-zinc-800 text-white',
    secondaryButton: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
  },
  dark: {
    backgroundColor: 'bg-black',
    inputBackground: 'bg-black',
    textColor: 'text-white',
    labelColor: 'text-zinc-300',
    placeholderColor: 'placeholder-zinc-400',
    borderColor: 'border-zinc-800',
    primaryButton: 'bg-white hover:bg-zinc-200 text-black',
    secondaryButton: 'bg-black text-white border border-zinc-700 hover:bg-zinc-900',
  },
};

interface BananoConnectButtonProps {
  theme?: ThemeName;
  modalTheme?: ModalThemeName;
  className?: string;
}

export function BananoConnectButton({
  theme = 'black',
  modalTheme = 'light',
  className = '',
}: BananoConnectButtonProps) {
  const { address, balance, isConnected, isConnecting, connect, disconnect, generateNewWallet, seed } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [error, setError] = useState('');

  const selectedTheme = theme in themes ? theme : 'black';
  const buttonTheme = themes[selectedTheme];
  const selectedModalTheme = modalThemes[modalTheme];

  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'px-6',
    'py-3',
    'rounded-2xl',
    'font-medium',
    'shadow-lg',
    buttonTheme.shadowColor,
    'transition-all',
    'duration-200',
    'gap-2',
    buttonTheme.backgroundColor,
    buttonTheme.textColor,
    buttonTheme.hoverColor,
    'hover:shadow-xl',
    'active:scale-95',
    className,
  ].filter(Boolean).join(' ');

  const handleConnect = async () => {
    try {
      setError('');
      await connect(mnemonic);
      setShowModal(false);
      setMnemonic('');
    } catch (error) {
      setError('Invalid mnemonic phrase');
    }
  };

  const handleGenerateNew = async () => {
    try {
      setError('');
      const { mnemonic: newMnemonic } = await generateNewWallet();
      setMnemonic(newMnemonic);
    } catch (error) {
      setError('Error generating new wallet');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowModal(false);
    setMnemonic('');
    setError('');
  };

  const handleCopySeed = async () => {
    if (!seed) return;
    try {
      await navigator.clipboard.writeText(seed);
    } catch (error) {
      console.error('Failed to copy seed:', error);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 9)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="relative inline-block">
        <button
          className={baseClasses}
          onClick={() => setShowModal(true)}
        >
          <span>{truncateAddress(address)}</span>
          <span>({balance || '0.00'} BAN)</span>
        </button>

        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            
            <div className="flex min-h-full items-center justify-center p-4">
              <div className={`relative w-full max-w-md transform overflow-hidden rounded-3xl ${selectedModalTheme.backgroundColor} p-6 text-left shadow-xl transition-all`}>
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-zinc-400 hover:text-zinc-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-2">
                  <h3 className={`text-lg font-medium leading-6 ${selectedModalTheme.textColor} mb-4`}>
                    Wallet Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${selectedModalTheme.labelColor} mb-2`}>
                        Address
                      </label>
                      <div className={`mt-1 text-sm ${selectedModalTheme.textColor} break-all font-mono`}>
                        {address}
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${selectedModalTheme.labelColor} mb-2`}>
                        Balance
                      </label>
                      <div className={`mt-1 text-2xl font-semibold ${selectedModalTheme.textColor}`}>
                        {balance || '0.00'} BAN
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleCopySeed}
                        className={`flex-1 rounded-2xl ${selectedModalTheme.secondaryButton} px-4 py-3 text-sm font-medium
                          transition-colors`}
                      >
                        Copy Seed
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className={`flex-1 rounded-2xl ${selectedModalTheme.primaryButton} px-4 py-3 text-sm font-medium text-white transition-colors`}>
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        className={baseClasses}
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </div>
        ) : (
          <div>Connect Wallet</div>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative w-full max-w-md transform overflow-hidden rounded-3xl ${selectedModalTheme.backgroundColor} ${selectedModalTheme.borderColor} border p-6 text-left shadow-xl transition-all`}>
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-zinc-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-2">
                <h3 className={`text-lg font-medium leading-6 ${selectedModalTheme.textColor} mb-4`}>
                  Connect to Wallet
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${selectedModalTheme.labelColor} mb-2`}>
                      Enter Seed or Private Key
                    </label>
                    <div className="relative">
                      <input
                        type={'password'}
                        value={mnemonic}
                        onChange={(e) => setMnemonic(e.target.value)}
                        placeholder="Enter seed or private key"
                        className={`block w-full rounded-xl ${selectedModalTheme.inputBackground} ${selectedModalTheme.textColor} 
                          ${selectedModalTheme.placeholderColor} ${selectedModalTheme.borderColor} border px-4 py-3 pr-12
                          focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                  </div>
                  <p className={`mt-2 text-sm ${selectedModalTheme.labelColor} opacity-75`}>
                    You can enter either a seed of any length or a private key (64 hex characters)
                  </p>
                  {error && (
                    <div className="p-4 text-sm text-red-500 bg-red-50 rounded-xl">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                  <button
                      onClick={handleGenerateNew}
                      className={`flex-1 rounded-2xl ${selectedModalTheme.secondaryButton} px-4 py-3 text-sm font-medium
                        transition-colors`}
                      disabled={isConnecting}
                    >
                      Generate New
                    </button>
                    <button
                      onClick={handleConnect}
                      className={`flex-1 rounded-2xl ${selectedModalTheme.primaryButton} px-4 py-3 text-sm font-medium
                        transition-colors hover:cursor-pointer`}
                      disabled={isConnecting || !mnemonic}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
       </div>
      )}    
    </div>
  );
}
