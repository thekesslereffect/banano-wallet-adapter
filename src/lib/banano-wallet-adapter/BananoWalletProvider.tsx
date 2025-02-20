import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import * as banani from 'banani';
import * as bip39 from 'bip39';
import { SeedManager } from './SeedManager';
import { Resolver } from 'banani-bns';

const DEFAULT_RPC_URL = 'https://kaliumapi.appditto.com/api';

// Add BNS TLD mapping with proper type assertion
const TLD_MAPPING: Record<string, `ban_${string}`> = {
  "ban": "ban_1fdo6b4bqm6pp1w55duuqw5ebz455975o4qcp8of85fjcdw9qhuzxsd3tjb9" as `ban_${string}`,
  "jtv": "ban_3gipeswotbnyemcc1dejyhy5a1zfgj35kw356dommbx4rdochiteajcsay56" as `ban_${string}`,
  "mictest": "ban_1dzpfrgi8t4byzmdeidh57p14h5jwbursf1t3ztbmeqnqqdcbpgp9x8j3cw6" as `ban_${string}`,
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
  connect: (seedOrPrivateKey?: string, customPassword?: string) => Promise<string>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  lookupBNS: (address: `ban_${string}` | `nano_${string}`) => Promise<string | null>;
  updateBalance: () => Promise<void>;
  needsCustomPassword: boolean;
  connectWithPassword: (password: string) => Promise<void>;
  cancelCustomPasswordPrompt: () => void;
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
  const [pendingSeedRef, setPendingSeedRef] = useState<string | null>(null);
  const [needsCustomPassword, setNeedsCustomPassword] = useState(false);

  const rpc = useMemo(() => new banani.RPC(rpcUrl), [rpcUrl]);
  const resolver = useMemo(() => new Resolver(rpc, TLD_MAPPING), [rpc]);

  const connect = useCallback(async (seedOrPrivateKey?: string, customPassword?: string): Promise<string> => {
    setIsConnecting(true);
    try {
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
      
      await seedManager.ensureInitialized();
      const seedRef = await seedManager.storeSeed(finalSeed, customPassword);
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
    // Clear sensitive data first
    if (wallet?.seed) {
      try {
        // Create a new Uint8Array and fill it with random data
        const array = new Uint8Array(wallet.seed.length);
        crypto.getRandomValues(array);
      } catch (error) {
        console.debug('Failed to overwrite seed:', error);
      }
    }

    // Clear all state
    setWallet(null);
    setIsConnected(false);
    setBnsName(null);
    setBalance('0.00');
    localStorage.removeItem('bananoWalletSeedRef');
    seedManager.clearMemory();
  }, [wallet, seedManager]);

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
      // Fetch confirmed account history
      const history = await rpc.call({
        action: 'account_history',
        account: address,
        count: '1000',
        raw: true,
      });
      
      let candidateDomainAddresses: string[] = [];

      if (history.history && history.history.length > 0) {
        history.history.forEach((block: any) => {
          if (block.subtype === 'receive' && BigInt(block.amount ?? "0") === 4224n) {
            if (block.account) candidateDomainAddresses.push(block.account);
          }
        });
      }

      // Fetch pending blocks and include pending receives where amount == 4224n.
      const pending = await rpc.call({
        action: 'pending',
        account: address,
        count: '100',
        threshold: '1'
      });
      if (pending.blocks) {
        Object.entries(pending.blocks).forEach(([hash, block]: [string, any]) => {
          if (BigInt(block.amount ?? "0") === 4224n) {
            if (block.source) candidateDomainAddresses.push(block.source);
          }
        });
      }
      
      if (candidateDomainAddresses.length === 0) return null;
      
      // For each candidate Domain Address, try each TLD mapping.
      for (const candidate of candidateDomainAddresses) {
        for (const tld of Object.keys(TLD_MAPPING)) {
          try {
            const domain = await resolver.resolve_backwards_ish(candidate as `ban_${string}`, tld);
            if (domain && !domain.burned) {
              return `${domain.name}.${tld}`;
            }
          } catch {
            continue;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error in lookupBNS:", error);
      return null;
    }
  }, [resolver, rpc]);

  const generateNewWallet = useCallback(async (): Promise<{ mnemonic: string; address: string }> => {
    try {
      await seedManager.ensureInitialized();
      const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
      const mnemonic = bip39.entropyToMnemonic(generatedSeed.toLowerCase());
      const newAddress = await connect(generatedSeed);
      return { mnemonic, address: newAddress };
    } catch (error) {
      console.error("Error generating new wallet:", error);
      throw error;
    }
  }, [rpc, connect, seedManager]);

  const updateBalance = useCallback(async () => {
    if (!wallet) return;
    
    try {
      const info = await wallet.get_account_info();
      await wallet.receive_all();
      setBalance(Number(banani.raw_to_whole(BigInt(info.balance))).toFixed(2));
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
          setBalance(Number(banani.raw_to_whole(BigInt(info.balance))).toFixed(2));
        } else {
          setBalance('0.00');
        }
      } catch (receiveError) {
        console.error('Error checking receivable:', receiveError);
        setBalance('0.00');
      }
    }
  }, [wallet]);

  const connectWithPassword = useCallback(async (password: string) => {
    if (!pendingSeedRef) return;
    try {
      const retrievedSeed = await seedManager.retrieveSeed(pendingSeedRef, password);
      if (retrievedSeed) {
        await connect(retrievedSeed, password);
      }
      setPendingSeedRef(null);
      setNeedsCustomPassword(false);
    } catch (error) {
      throw new Error('Invalid password');
    }
  }, [pendingSeedRef, connect, seedManager]);

  const cancelCustomPasswordPrompt = useCallback(() => {
    setPendingSeedRef(null);
    setNeedsCustomPassword(false);
    localStorage.removeItem('bananoWalletSeedRef');
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const tryReconnect = async () => {
      const seedRef = localStorage.getItem('bananoWalletSeedRef');
      if (seedRef && !isConnected && !isConnecting && mounted) {
        try {
          const stored = await seedManager.getSeedInfo(seedRef);
          if (stored?.hasCustomPassword) {
            setPendingSeedRef(seedRef);
            setNeedsCustomPassword(true);
            return;
          }
          const retrievedSeed = await seedManager.retrieveSeed(seedRef);
          if (retrievedSeed) await connect(retrievedSeed);
        } catch {
          localStorage.removeItem('bananoWalletSeedRef');
        }
      }
    };

    tryReconnect().catch(console.error);
    
    return () => {
      mounted = false;
    };
  }, [seedManager, connect, isConnected, isConnecting]);

  useEffect(() => {
    if (!wallet) return;

    let mounted = true;
    const checkBalance = async () => {
      if (mounted) {
        await updateBalance();
      }
    };

    checkBalance();
    const interval = setInterval(checkBalance, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [wallet, updateBalance]);

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

  useEffect(() => {
    return () => {
      seedManager.destroy();
    };
  }, [seedManager]);

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
    updateBalance,
    needsCustomPassword,
    connectWithPassword,
    cancelCustomPasswordPrompt,
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
    generateNewWallet,
    updateBalance,
    needsCustomPassword,
    connectWithPassword,
    cancelCustomPasswordPrompt
  ]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a BananoWalletProvider');
  return context;
}

const validateSeed = (seed: string): boolean => {
  if (!seed) return false;
  if (seed.trim().includes(" ")) {
    try {
      bip39.mnemonicToEntropy(seed);
      return true;
    } catch {
      return false;
    }
  }
  return /^[0-9A-F]{64}$/i.test(seed);
};
