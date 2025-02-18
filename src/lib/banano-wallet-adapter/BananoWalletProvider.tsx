import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import * as banani from 'banani';
import * as bip39 from 'bip39';
import { SeedManager } from './SeedManager';
import { Resolver } from 'banani-bns';

const DEFAULT_RPC_URL = 'https://kaliumapi.appditto.com/api';

// Add BNS TLD mapping with proper type assertion
const TLD_MAPPING: Record<string, `ban_${string}`> = {
  "mictest": "ban_1dzpfrgi8t4byzmdeidh57p14h5jwbursf1t3ztbmeqnqqdcbpgp9x8j3cw6" as `ban_${string}`,
  "jtv": "ban_3gipeswotbnyemcc1dejyhy5a1zfgj35kw356dommbx4rdochiteajcsay56" as `ban_${string}`,
  "ban": "ban_1fdo6b4bqm6pp1w55duuqw5ebz455975o4qcp8of85fjcdw9qhuzxsd3tjb9" as `ban_${string}`,
};

interface WalletContextType {
  wallet: banani.Wallet | null;
  address: string | null;
  bnsName: string | null; // Add BNS name
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  seed: string | null;
  resolveBNS: (name: string, tld: string) => Promise<string | null>; // Add BNS resolver
  connect: (seedOrPrivateKey?: string) => Promise<string>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  lookupBNS: (address: `ban_${string}` | `nano_${string}`) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  rpcUrl?: string;
}

export function BananoWalletProvider({
  children,
  rpcUrl = DEFAULT_RPC_URL,
}: WalletProviderProps) {
  const seedManager = useMemo(() => new SeedManager(), []);
  const [wallet, setWallet] = useState<banani.Wallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [bnsName, setBnsName] = useState<string | null>(null);
  const resolvedBnsCache = useMemo(() => new Map<string, string>(), []);

  const rpc = useMemo(() => new banani.RPC(rpcUrl), [rpcUrl]);
  const resolver = useMemo(() => new Resolver(rpc, TLD_MAPPING), [rpc]);

  const connect = useCallback(async (seedOrPrivateKey?: string): Promise<string> => {
    setIsConnecting(true);
    try {
      await seedManager.initialize();
      let finalSeed: string;
      if (seedOrPrivateKey) {
        if (seedOrPrivateKey.trim().includes(" ")) {
          finalSeed = bip39.mnemonicToEntropy(seedOrPrivateKey).toUpperCase();
        } else if (seedOrPrivateKey.length === 64) {
          finalSeed = seedOrPrivateKey;
        } else {
          throw new Error("Invalid seed or mnemonic");
        }
      } else {
        const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
        finalSeed = generatedSeed;
      }
      
      const seedRef = await seedManager.storeSeed(finalSeed);
      localStorage.setItem("bananoWalletSeedRef", seedRef);
      const newWallet = new banani.Wallet(rpc, finalSeed);
      setWallet(newWallet);
      setIsConnected(true);
      return newWallet.address;
    } catch (error) {
      console.error("Error in connect:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [rpc, seedManager]);

  const disconnect = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    localStorage.removeItem('bananoWalletSeedRef');
    seedManager.clearMemory();
  }, [seedManager]);

  const resolveBNS = useCallback(async (name: string, tld: string): Promise<string | null> => {
    try {
      const domain = await resolver.resolve(name, tld);
      if (!domain || domain.burned) return null;
      console.log('domain', domain);
      return domain.resolved_address ?? null;
    } catch {
      return null;
    }
  }, [resolver]);

  const lookupBNS = useCallback(async (address: `ban_${string}` | `nano_${string}`): Promise<string | null> => {
    try {
      // Get account history
      const history = await rpc.call({
        action: 'account_history',
        account: address,
        count: '1000',
        raw: true
      });

      if (!history.history || !Array.isArray(history.history)) {
        return null;
      }

      // Look for Domain Resolve blocks (amount = 4224)
      for (const block of history.history) {
        if (block.type !== 'receive' && block.subtype !== 'receive') continue;
        if (block.amount !== '4224') continue;

        // Try each TLD using the source address
        for (const tld of Object.keys(TLD_MAPPING)) {
          try {
            // @ts-ignore - bypass type checking for resolver.resolve_backwards_ish
            const domain = await resolver.resolve_backwards_ish(block.source as `ban_${string}`, tld);
            if (domain && !domain.burned) {
              return `${domain.name}.${domain.tld}`;
            }
          } catch {
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in lookupBNS:', error);
      return null;
    }
  }, [resolver, rpc]);

  const generateNewWallet = useCallback(async (): Promise<{ mnemonic: string; address: string }> => {
    const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
    const mnemonic = bip39.entropyToMnemonic(generatedSeed.toLowerCase());
    const newAddress = await connect(generatedSeed);
    return { mnemonic, address: newAddress };
  }, [rpc, connect]);

  useEffect(() => {
    const tryReconnect = async () => {
      const seedRef = localStorage.getItem('bananoWalletSeedRef');
      if (seedRef && !isConnected && !isConnecting) {
        try {
          const retrievedSeed = await seedManager.retrieveSeed(seedRef);
          if (retrievedSeed) await connect(retrievedSeed);
        } catch {
          localStorage.removeItem('bananoWalletSeedRef');
        }
      }
    };

    seedManager.initialize().then(tryReconnect).catch(console.error);
  }, [seedManager, connect, isConnected, isConnecting]);

  useEffect(() => {
    if (!wallet) return;

    let mounted = true;
    const updateBalance = async () => {
      try {
        const info = await wallet.get_account_info();
        if (mounted) {
          await wallet.receive_all();
          setBalance(Number(banani.raw_to_whole(BigInt(info.balance))).toFixed(2));
        }
      } catch {
        try {
          const receivable = await wallet.rpc.call({
            action: 'receivable',
            account: wallet.address as `ban_${string}`,
            count: '1',
            threshold: '1'
          });

          if (receivable.blocks && Object.keys(receivable.blocks).length > 0) {
            await wallet.receive_all();
            const info = await wallet.get_account_info();
            if (mounted) {
              setBalance(Number(banani.raw_to_whole(BigInt(info.balance))).toFixed(2));
            }
          } else {
            if (mounted) setBalance('0.00');
          }
        } catch (receiveError) {
          console.error('Error checking receivable:', receiveError);
          if (mounted) setBalance('0.00');
        }
      }
    };

    updateBalance();
    const interval = setInterval(updateBalance, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [wallet]);

  useEffect(() => {
    if (!wallet?.address) return;

    if (resolvedBnsCache.has(wallet.address)) {
      setBnsName(resolvedBnsCache.get(wallet.address) || null);
      return;
    }

    lookupBNS(wallet.address as `ban_${string}`).then(name => {
      if (name) resolvedBnsCache.set(wallet.address, name);
      setBnsName(name);
    });
  }, [wallet?.address, resolver, resolvedBnsCache, lookupBNS]);

  const value = useMemo(() => ({
    wallet,
    address: wallet?.address ?? null,
    bnsName,
    isConnected,
    isConnecting,
    balance,
    seed: wallet?.seed ?? null,
    resolveBNS,
    lookupBNS,
    connect,
    disconnect,
    generateNewWallet,
  }), [
    wallet,
    bnsName,
    isConnected,
    isConnecting,
    balance,
    resolveBNS,
    lookupBNS,
    connect,
    disconnect,
    generateNewWallet
  ]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a BananoWalletProvider');
  return context;
}
