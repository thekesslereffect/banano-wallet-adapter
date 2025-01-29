'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../lib/banano-wallet-adapter';
import QRCode from 'qrcode';

interface Transaction {
  type: 'send' | 'receive';
  account: string;
  amount: string;
  hash: string;
  timestamp: number;
}

export function WalletDetails() {
  const { address, isConnected, receivePending, getTransactionHistory } = useWallet();
  const [qrCode, setQrCode] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isReceiving, setIsReceiving] = useState(false);
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

  // Load transaction history
  useEffect(() => {
    if (isConnected) {
      getTransactionHistory().then(setTransactions).catch(console.error);
    }
  }, [isConnected, getTransactionHistory]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReceivePending = async () => {
    try {
      setIsReceiving(true);
      const hashes = await receivePending();
      if (hashes.length > 0) {
        // Refresh transaction history after receiving
        const updatedHistory = await getTransactionHistory();
        setTransactions(updatedHistory);
      }
    } catch (error) {
      console.error('Error receiving pending transactions:', error);
    } finally {
      setIsReceiving(false);
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

      {/* Receive Button */}
      <button
        onClick={handleReceivePending}
        disabled={isReceiving}
        className="w-full bg-black text-white font-medium px-4 py-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isReceiving ? 'Receiving...' : 'Receive Pending'}
      </button>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400">Transaction History</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="bg-zinc-100 p-4 rounded-xl space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${tx.type === 'receive' ? 'text-green-600' : 'text-orange-600'}`}>
                  {tx.type === 'receive' ? '↓ Received' : '↑ Sent'}
                </span>
                <span className="text-sm font-medium">
                  {Number(tx.amount).toFixed(2)} BAN
                </span>
              </div>
              <div className="text-xs text-zinc-500 break-all font-mono">
                {tx.type === 'receive' ? 'From: ' : 'To: '}{tx.account}
              </div>
              <div className="text-xs text-zinc-400">
                {new Date(tx.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-sm text-zinc-400 text-center py-4">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
