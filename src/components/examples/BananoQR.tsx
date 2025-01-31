'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function BananoQR() {
  const { isConnected, address } = useWallet();
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, {
        width: 384,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrCode)
        .catch(console.error);
    }
  }, [address]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-4">
        {qrCode && (
          <div className="bg-white p-4 rounded-2xl inline-block">
            <img src={qrCode} alt="Wallet QR Code" className="w-48 h-48" />
          </div>
        )}
        <div className="relative">
          <button
            onClick={handleCopyAddress}
            className="w-full text-sm font-mono break-all text-left px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-600"
          >
            {address}
          </button>
          {copied && (
            <span className="absolute top-0 right-0 mt-3 mr-3 text-xs bg-black text-white px-2 py-1 rounded-full">
              Copied!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
