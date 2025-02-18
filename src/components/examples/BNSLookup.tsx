'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/banano-wallet-adapter';

export function BNSLookup() {
  const { lookupBNS, resolveBNS } = useWallet();
  const [address, setAddress] = useState('');
  const [bnsName, setBnsName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!address.startsWith('ban_')) {
      setResult('Invalid address format');
      return;
    }

    setLoading(true);
    try {
      const bnsName = await lookupBNS(address as `ban_${string}`);
      setResult(bnsName || 'No BNS name found');
    } catch (error) {
      setResult('Error looking up BNS name');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!bnsName.includes('.')) {
      setResult('Invalid BNS format. Must include TLD (e.g., name.ban)');
      return;
    }

    setLoading(true);
    try {
      const [name, tld] = bnsName.split('.');
      const resolvedAddress = await resolveBNS(name, tld);
      setResult(resolvedAddress || 'No address found for this BNS name');
    } catch (error) {
      setResult('Error resolving BNS name');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">BNS Lookup</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Address to BNS</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter ban_ address"
              className="flex-1 p-2 border rounded-xl"
            />
            <button
              onClick={handleLookup}
              disabled={loading || !address}
              className="px-4 py-2 bg-black rounded-xl text-white disabled:opacity-50"
            >
              {loading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">BNS to Address</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={bnsName}
              onChange={(e) => setBnsName(e.target.value)}
              placeholder="Enter BNS name (e.g., name.ban)"
              className="flex-1 p-2 border rounded-xl"
            />
            <button
              onClick={handleResolve}
              disabled={loading || !bnsName}
              className="px-4 py-2 bg-black rounded-xl text-white disabled:opacity-50"
            >
              {loading ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="p-4 bg-gray-100 rounded-xl">
          <p>Result: {result}</p>
        </div>
      )}
    </div>
  );
} 