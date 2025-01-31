// src/components/examples/TransactionHistory.tsx

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
  const { address, isConnected, getTransactionHistory, balance } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load transaction history on mount and when balance changes
  useEffect(() => {
    if (!isConnected || !address) {
      setTransactions([]);
      return;
    }

    let isMounted = true;
    const fetchTransactions = async () => {
      try {
        if (isInitialLoad && isMounted) {
          setIsLoading(true);
        }
        const history = await getTransactionHistory(address as `ban_${string}`);
        if (isMounted) {
          setTransactions(history);
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, balance]);

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
