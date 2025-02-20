'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export type ThemeName = 'black' | 'white' | 'blue' | 'yellow' | 'green';
export type ModalThemeName = 'light' | 'dark';

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

export const buttonThemes: Record<ThemeName, ButtonTheme> = {
  black: {
    backgroundColor: 'bg-gradient-to-b from-zinc-800 to-black',
    textColor: 'text-white',
    hoverColor: 'hover:from-zinc-800 hover:to-zinc-900',
    shadowColor: 'shadow-zinc-900/20 hover:shadow-zinc-900/30',
  },
  white: {
    backgroundColor: 'bg-gradient-to-b from-white to-zinc-50',
    textColor: 'text-black',
    hoverColor: 'hover:from-zinc-50 hover:to-zinc-100',
    shadowColor: 'shadow-zinc-100/20 hover:shadow-zinc-100/30',
  },
  blue: {
    backgroundColor: 'bg-gradient-to-b from-blue-500 to-blue-600',
    textColor: 'text-white',
    hoverColor: 'hover:from-blue-400 hover:to-blue-500',
    shadowColor: 'shadow-blue-500/20 hover:shadow-blue-500/30',
  },
  yellow: {
    backgroundColor: 'bg-gradient-to-b from-yellow-400 to-yellow-500',
    textColor: 'text-white',
    hoverColor: 'hover:from-yellow-300 hover:to-yellow-400',
    shadowColor: 'shadow-yellow-500/20 hover:shadow-yellow-500/30',
  },
  green: {
    backgroundColor: 'bg-gradient-to-b from-green-500 to-green-600',
    textColor: 'text-white',
    hoverColor: 'hover:from-green-400 hover:to-green-500',
    shadowColor: 'shadow-green-500/20 hover:shadow-green-500/30',
  },
};

export const modalThemes: Record<ModalThemeName, ModalTheme> = {
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
  const { address, balance, bnsName, seed, isConnected, isConnecting, connect, disconnect, generateNewWallet, needsCustomPassword, connectWithPassword, cancelCustomPasswordPrompt } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [error, setError] = useState('');
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [clearedClipboard, setClearedClipboard] = useState(false);

  const buttonTheme = buttonThemes[theme] || buttonThemes.black;
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
    buttonTheme.backgroundColor,
    buttonTheme.textColor,
    buttonTheme.hoverColor,
    'transition-all',
    'ease-out',
    'duration-300',
    'gap-2',
    'hover:shadow-xl',
    'active:scale-95',
    className,
  ].join(' ');

  const handleConnect = async () => {
    try {
      setError('');
      // Store length before we clear it
      const mnemonicLength = mnemonic.length;
      const passwordLength = customPassword.length;

      await connect(mnemonic, useCustomPassword ? customPassword : undefined);
      setShowModal(false);

      // Overwrite sensitive data in memory before clearing
      setMnemonic('0'.repeat(mnemonicLength));
      if (useCustomPassword) {
        setCustomPassword('0'.repeat(passwordLength));
      }
      
      // Clear the fields
      setMnemonic('');
      setCustomPassword('');
    } catch {
      setError('Invalid mnemonic phrase or password');
    }
  };

  const handleGenerateNew = async () => {
    try {
      setError('');
      const { mnemonic: newMnemonic } = await generateNewWallet();
      
      // Store length before setting new mnemonic
      const oldLength = mnemonic.length;
      if (oldLength > 0) {
        setMnemonic('0'.repeat(oldLength));
      }
      
      setMnemonic(newMnemonic);
    } catch {
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
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } catch {
      console.error('Failed to copy seed');
    }
  };

  const handleClearClipboard = async () => {
    try {
      await navigator.clipboard.writeText('');
      setClearedClipboard(true);
      setTimeout(() => setClearedClipboard(false), 2000);
    } catch {
      console.error('Failed to clear clipboard');
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 9)}...${addr.slice(-4)}`;

  const handlePasswordConnect = async () => {
    try {
      setError('');
      await connectWithPassword(customPassword);
      setShowModal(false);
      setCustomPassword('');
    } catch {
      setError('Invalid password');
    }
  };

  if (isConnected && address) {
    return (
      <div className="relative inline-block">
        <button className={baseClasses} onClick={() => setShowModal(true)}>
          <span>{bnsName || truncateAddress(address)}</span>
          <span>({balance || '0.00'} BAN)</span>
        </button>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className={`relative w-full max-w-md rounded-3xl p-6 shadow-xl transition-all ${selectedModalTheme.backgroundColor}`}
              >
                <button
                  className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-500"
                  onClick={() => setShowModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className={`text-lg font-medium mb-4 ${selectedModalTheme.textColor}`}>
                  Wallet Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${selectedModalTheme.labelColor}`}>
                      Address
                    </label>
                    <div className={`mt-1 text-sm font-mono break-all ${selectedModalTheme.textColor}`}>
                      {address}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${selectedModalTheme.labelColor}`}>
                      Balance
                    </label>
                    <div className={`mt-1 text-2xl font-semibold ${selectedModalTheme.textColor}`}>
                      {balance || '0.00'} BAN
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopySeed}
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.secondaryButton}`}
                      >
                        {copiedSeed ? 'Copied!' : 'Copy Seed'}
                      </button>
                      <button
                        onClick={handleClearClipboard}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.secondaryButton}`}
                      >
                        {clearedClipboard ? 'Cleared!' : 'Clear Clipboard'}
                      </button>
                    </div>
                    <p className={`text-xs ${selectedModalTheme.labelColor}`}>
                      Warning: Store your seed securely and never share it. Clear your clipboard after copying.
                    </p>
                    <button
                      onClick={handleDisconnect}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.primaryButton}`}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (needsCustomPassword) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={cancelCustomPasswordPrompt}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`relative w-full max-w-md rounded-3xl p-6 border shadow-xl transition-all ${selectedModalTheme.backgroundColor} ${selectedModalTheme.borderColor}`}
          >
            <button
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-500"
              onClick={cancelCustomPasswordPrompt}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className={`text-lg font-medium mb-4 ${selectedModalTheme.textColor}`}>
              Enter Wallet Password
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Enter your wallet password"
                className={`w-full rounded-xl px-4 py-3 border ${selectedModalTheme.inputBackground} ${selectedModalTheme.textColor} ${selectedModalTheme.placeholderColor} ${selectedModalTheme.borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <div className="flex gap-3">
                <button
                  onClick={cancelCustomPasswordPrompt}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.secondaryButton}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordConnect}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.primaryButton}`}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className={baseClasses} onClick={() => setShowModal(true)} disabled={isConnecting}>
        {isConnecting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </div>
        ) : (
          'Connect Wallet'
        )}
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className={`relative w-full max-w-md rounded-3xl p-6 border shadow-xl transition-all ${selectedModalTheme.backgroundColor} ${selectedModalTheme.borderColor}`}
            >
              <button
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-500"
                onClick={() => setShowModal(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className={`text-lg font-medium mb-4 ${selectedModalTheme.textColor}`}>
                Connect to Wallet
              </h3>
              <div className="space-y-4">
                <label className={`block text-sm font-medium mb-2 ${selectedModalTheme.labelColor}`}>
                  Enter Seed or Private Key
                </label>
                <input
                  type="password"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  autoCorrect="off"
                  placeholder="Enter seed or private key"
                  className={`w-full rounded-xl px-4 py-3 border ${selectedModalTheme.inputBackground} ${selectedModalTheme.textColor} ${selectedModalTheme.placeholderColor} ${selectedModalTheme.borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomPassword"
                    checked={useCustomPassword}
                    onChange={(e) => setUseCustomPassword(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="useCustomPassword" className={`text-sm ${selectedModalTheme.labelColor}`}>
                    Use custom password (more secure, but you must remember it)
                  </label>
                </div>
                {useCustomPassword && (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                      autoCorrect="off"
                      placeholder="Enter encryption password"
                      className={`w-full rounded-xl px-4 py-3 border ${selectedModalTheme.inputBackground} ${selectedModalTheme.textColor} ${selectedModalTheme.placeholderColor} ${selectedModalTheme.borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <p className={`text-xs ${selectedModalTheme.labelColor}`}>
                      Important: You will need this password every time you reconnect. 
                      There is no way to recover it if forgotten.
                    </p>
                  </div>
                )}
                {!useCustomPassword && (
                  <p className={`text-xs ${selectedModalTheme.labelColor}`}>
                    Using auto-generated encryption (more convenient, but less secure as the key is stored in your browser)
                  </p>
                )}
                {error && (
                  <div className="p-4 text-sm text-red-500 bg-red-50 rounded-xl">
                    {error}
                  </div>
                )}
                <div style={{ userSelect: 'none' }} className="flex gap-3">
                  <button
                    onClick={handleConnect}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.primaryButton}`}
                    disabled={isConnecting || !mnemonic || (useCustomPassword && !customPassword)}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${selectedModalTheme.secondaryButton}`}
                    disabled={isConnecting}
                  >
                    Generate New Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}