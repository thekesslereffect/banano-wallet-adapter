'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

interface Transaction {
  type: 'send' | 'receive';
  account: string;
  amount: string;
  hash: string;
  timestamp: number;
}

export function TransactionHistory() {
  const { address, isConnected, getTransactionHistory } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load transaction history
  useEffect(() => {
    if (!isConnected) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      try {
        if (isInitialLoad) {
          setIsLoading(true);
        }
        const history = await getTransactionHistory(address as `ban_${string}`);
        setTransactions(history);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);

    return () => clearInterval(interval);
  }, [isConnected, getTransactionHistory, address, isInitialLoad]);

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Transaction History */}
      <h3 className="text-sm font-medium text-zinc-400">Transaction History</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent hover:scrollbar-thumb-zinc-300">
        {isLoading && isInitialLoad ? (
          <div className="text-sm text-zinc-400 text-center py-4">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-sm text-zinc-400 text-center py-4">
            No transactions yet
          </div>
        ) : (
          transactions.map((tx) => (
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
          ))
        )}
      </div>
    </div>
  );
}
