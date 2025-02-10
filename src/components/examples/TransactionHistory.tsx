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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setTransactions([]);
      return;
    }

    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const history = await getTransactionHistory(address as `ban_${string}`);
        if (isMounted) setTransactions(history);
      } catch (error) {
        console.error('Transaction history error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, balance, getTransactionHistory]);

  if (!isConnected) return null;

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium text-zinc-400">Transaction History</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent hover:scrollbar-thumb-zinc-300">
        {loading && transactions.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">No transactions yet</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.hash} className="p-4 bg-zinc-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${tx.type === 'receive' ? 'text-green-600' : 'text-orange-600'}`}>
                  {tx.type === 'receive' ? '↓ Received' : '↑ Sent'}
                </span>
                <span className="text-sm font-medium">{Number(tx.amount).toFixed(2)} BAN</span>
              </div>
              <p className="text-xs font-mono text-zinc-500 break-all">
                {tx.type === 'receive' ? 'From: ' : 'To: '}{tx.account}
              </p>
              <p className="text-xs text-zinc-400">
                {new Date(tx.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
