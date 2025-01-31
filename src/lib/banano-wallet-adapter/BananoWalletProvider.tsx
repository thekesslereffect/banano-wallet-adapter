import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as banani from 'banani';
import * as bip39 from 'bip39';
import * as React from 'react';
import { SeedManager } from '@/lib/banano-wallet-adapter/SeedManager';  
import { EncryptedStorage } from '@/lib/banano-wallet-adapter/SecureStorage';

// Initialize RPC
const rpc = new banani.RPC('https://kaliumapi.appditto.com/api');
const REFRESH_INTERVAL = 5; // 5 seconds. Update as needed

interface BananoError {
  message: string;
  code?: string;
  details?: unknown;
}

interface WalletContextType {
  address: string | null;
  balance: string;
  seed: string | null;
  pendingBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isLoadingBalance: boolean;
  connect: (seedOrPrivateKey?: string) => Promise<void>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  mnemonic: string;
  sendBanano: (toAddress: string, amount: string) => Promise<string>;
  receivePending: (_blockHash: string) => Promise<string>;
  receiveAllPending: () => Promise<string[]>;
  getTransactionHistory: (_address: string) => Promise<Array<{
    type: 'send' | 'receive';
    account: string;
    amount: string;
    hash: string;
    timestamp: number;
  }>>;
  getUserBalance: () => Promise<void>;
  getBalance: (_address: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  rpcUrl?: string;
}

interface AccountInfoResponse {
  error?: string;
  balance: string;
  pending: string;
}

// Format errors consistently
const formatError = (error: unknown): BananoError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    };
  }
  return {
    message: 'An unknown error occurred',
    details: error,
  };
};

export function BananoWalletProvider({ 
  children,
  rpcUrl = 'https://kaliumapi.appditto.com/api'
}: WalletProviderProps) {
  const seedManager = React.useMemo(() => new SeedManager(), []);
  const [wallet, setWallet] = useState<banani.Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [pendingBalance, setPendingBalance] = useState('0.00');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [seed, setSeed] = useState<string | null>(null);

  const connect = async (seedOrPrivateKey?: string): Promise<void> => {
    try {
      setIsConnecting(true);

      let finalSeed: string;
      if (seedOrPrivateKey) {
        if (seedOrPrivateKey.length === 64) {
          finalSeed = seedOrPrivateKey;
        } else {
          // Convert mnemonic to seed
          finalSeed = bip39.mnemonicToEntropy(seedOrPrivateKey).padEnd(64, '0');
        }
      } else {
        const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
        finalSeed = generatedSeed;
      }

      // Store the seed securely
      const seedRef = await seedManager.storeSeed(finalSeed);
      localStorage.setItem('bananoWalletSeedRef', seedRef);

      const newWallet = new banani.Wallet(rpc, finalSeed);
      setWallet(newWallet);
      setAddress(newWallet.address);
      setSeed(finalSeed);
      setIsConnected(true);
      
      // Get initial balance
      const initialBalance = await getBalance(newWallet.address);
      setBalance(initialBalance);

      // Initial balance update will happen via the useEffect
    } catch (error) {
      throw formatError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Update RPC URL if changed
  useEffect(() => {
    if (wallet) {
      const newRpc = new banani.RPC(rpcUrl);
      const newWallet = new banani.Wallet(newRpc, wallet.seed);
      setWallet(newWallet);
    }
  }, [rpcUrl]);

  useEffect(() => {
    const reconnectWallet = async () => {
      const seedRef = localStorage.getItem('bananoWalletSeedRef');
      if (seedRef && !isConnected && !isConnecting) {
        try {
          const retrievedSeed = await seedManager.retrieveSeed(seedRef);
          if (retrievedSeed) {
            await connect(retrievedSeed);
          }
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          localStorage.removeItem('bananoWalletSeedRef');
        }
      }
    };

    // Initialize seedManager and attempt to reconnect
    seedManager.initialize().then(() => {
      reconnectWallet();
    }).catch(console.error);
  }, [seedManager, connect, isConnected, isConnecting]);

  useEffect(() => {
    if (!isConnected || !address) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const updateBalance = async () => {
      if (!mounted) return;
      try {
        setIsLoadingBalance(true);
        const hasPending = await checkPendingTransactions();
        if (hasPending && wallet) {
          try {
            await wallet.receive_all();
            const newBalance = await getBalance(address);
            setBalance(newBalance);
          } catch (err: unknown) {
            // Ignore unreceivable errors
            if (err instanceof Error && !err.message.includes('Unreceivable')) {
              console.error('Error receiving pending transactions:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error updating balance:', error);
      } finally {
        if (mounted) {
          setIsLoadingBalance(false);
          timeoutId = setTimeout(updateBalance, 1000 * REFRESH_INTERVAL);
        }
      }
    };

    // Start the update cycle
    updateBalance();

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isConnected, address]);

  const checkPendingTransactions = async (): Promise<boolean> => {
    if (!address) return false;
    
    // For new accounts or accounts without any transactions,
    // assume no pending transactions to avoid RPC errors
    try {
      const response = await rpc.get_account_info(address as `ban_${string}`, false, false, false, true);
      if (!response || 'error' in response) {
        return false;
      }
      return response.pending !== undefined && BigInt(response.pending) > BigInt(0);
    } catch (error) {
      // Silently handle RPC errors for new accounts
      return false;
    }
  };

  const getBalance = async (address: string) => {
    try {
      const accountInfo = await rpc.get_account_info(address as `ban_${string}`);
      
      // If account is not found, it's a new account with 0 balance
      if (!accountInfo || 'error' in accountInfo) {
        if (accountInfo?.error === 'Account not found') {
          return '0.00';
        }
        console.error('Error fetching account info:', accountInfo?.error || 'Unknown error');
        return '0.00';
      }

      const balanceRaw = BigInt(accountInfo.balance);
      const balanceWhole = banani.raw_to_whole(balanceRaw);
      return Number(balanceWhole).toFixed(2);
    } catch (error) {
      console.debug('Balance check failed, assuming new account:', error);
      return '0.00';
    }
  };

  const getUserBalance = async () => {
    if (!wallet || !isConnected || !address) return;
    try {
      setIsLoadingBalance(true);
      const balance = await getBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Error updating balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const disconnect = (): void => {
    setWallet(null);
    setAddress(null);
    setBalance('0.00');
    setPendingBalance('0.00');
    setIsConnected(false);
    setSeed(null);
    localStorage.removeItem('bananoWalletSeedRef');
    seedManager.clearMemory();
  };

  const generateNewWallet = async (): Promise<{ mnemonic: string; address: string }> => {
    try {
      // Generate mnemonic with 256 bits of entropy (32 bytes = 64 hex chars)
      const mnemonic = bip39.generateMnemonic(256);
      const entropyHex = bip39.mnemonicToEntropy(mnemonic).toUpperCase();
      
      // Connect using the entropy hex (this will handle persistence)
      await connect(entropyHex);

      return {
        mnemonic,
        address: address as string,
      };
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error generating new wallet:', formattedError);
      throw formattedError;
    }
  };

  const sendBanano = async (_toAddress: string, amount: string) => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }
    try {
      if (!_toAddress.startsWith('ban_') || _toAddress.length !== 64) {
        throw new Error('Invalid Banano address format');
      }
      const numericAmount = Number(amount).toString();
      const hash = await wallet.send(_toAddress as `ban_${string}`, numericAmount as `${number}`);
      await getUserBalance();
      return hash;
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error sending BANANO:', formattedError);
      throw formattedError;
    }
  };

  const receivePending = async (_blockHash: string) => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await wallet.receive(_blockHash);
      await getUserBalance();
      return hash || "";
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error receiving pending transactions:', formattedError);
      throw formattedError;
    }
  };

  const receiveAllPending = async () => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const hashes = await wallet.receive_all();
      await getUserBalance();
      return hashes || [];
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error receiving pending transactions:', formattedError);
      throw formattedError;
    }
  };

  const getTransactionHistory = async (_address: string) => {

    try {
      const history = await rpc.get_account_history(_address as `ban_${string}`, 10);
      if (!history || !history.history) {
        return [];
      }

      return history.history.map((tx: any) => ({
        type: tx.type,
        account: tx.account,
        amount: banani.raw_to_whole(BigInt(tx.amount)),
        hash: tx.hash,
        timestamp: tx.local_timestamp,
      }));
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error fetching transaction history:', formattedError);
      throw formattedError;
    }
  };

  const value = {
    address,
    balance,
    pendingBalance,
    seed,
    isConnected,
    isConnecting,
    isLoadingBalance,
    connect,
    disconnect,
    generateNewWallet,
    mnemonic,
    sendBanano,
    receivePending,
    receiveAllPending,
    getTransactionHistory,
    getUserBalance,
    getBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
