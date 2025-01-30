'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';
import QRCode from 'qrcode';

export function BananoQR() {
  const { address, isConnected } = useWallet();
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate QR code when address changes
  useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, {
        width: 384,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrCode).catch(console.error);
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
      {/* QR Code and Address Section */}
      <div className="text-center space-y-4">
        {qrCode && (
          <div className="bg-white p-4 rounded-2xl inline-block">
            <img src={qrCode} alt="Wallet Address QR Code" className="w-48 h-48" />
          </div>
        )}
        <div className="relative">
          <button
            onClick={handleCopyAddress}
            className="w-full text-sm text-zinc-600 bg-zinc-100 px-4 py-3 rounded-xl hover:bg-zinc-200 transition-colors break-all text-left font-mono"
          >
            {address}
          </button>
          {copied && (
            <div className="absolute top-0 right-0 mt-3 mr-3 text-xs bg-black text-white px-2 py-1 rounded-full">
              Copied!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
