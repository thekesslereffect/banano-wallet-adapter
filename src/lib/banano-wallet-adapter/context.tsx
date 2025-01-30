import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as banani from 'banani';
import * as bip39 from 'bip39';

// Initialize RPC
const rpc = new banani.RPC('https://kaliumapi.appditto.com/api');

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
  connect: (seedOrPrivateKey?: string) => Promise<void>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  mnemonic: string;
  sendBanano: (toAddress: string, amount: string) => Promise<string>;
  receivePending: () => Promise<string[]>;
  getTransactionHistory: () => Promise<Array<{
    type: 'send' | 'receive';
    account: string;
    amount: string;
    hash: string;
    timestamp: number;
  }>>;
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
  const [wallet, setWallet] = useState<banani.Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [pendingBalance, setPendingBalance] = useState('0.00');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [seed, setSeed] = useState<string | null>(null);

  // Update RPC URL if changed
  useEffect(() => {
    // Since we can't modify the RPC instance directly, create a new wallet with the new RPC
    if (wallet && seed) {
      const newRpc = new banani.RPC(rpcUrl);
      const newWallet = new banani.Wallet(newRpc, seed);
      setWallet(newWallet);
    }
  }, [rpcUrl, seed]);

  const getBalance = async (address: string) => {
    try {
      const accountInfo = await rpc.get_account_info(address as `ban_${string}`);
      
      // If account is not found, it's a new account with 0 balance
      if (!accountInfo || 'error' in accountInfo) {
        if (accountInfo?.error === 'Account not found') {
          return '0.00';
        }
        // For other errors, log them but still return 0
        console.error('Error fetching account info:', accountInfo?.error || 'Unknown error');
        return '0.00';
      }

      const balanceRaw = BigInt(accountInfo.balance);
      const balanceWhole = banani.raw_to_whole(balanceRaw);
      return Number(balanceWhole).toFixed(2);
    } catch (error) {
      // Log the error but don't throw - new accounts are expected to not exist
      console.debug('Balance check failed, assuming new account:', error);
      return '0.00';
    }
  };

  const updateBalances = async () => {
    if (!wallet || !isConnected || !address) return;

    try {
      // First receive any pending transactions
      try {
        await wallet.receive_all();
      } catch (err: unknown) {
        // Ignore unreceivable errors as they're not critical
        if (err instanceof Error && !err.message.includes('Unreceivable')) {
          throw err;
        }
      }

      const balance = await getBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const connect = async (seedOrPrivateKey?: string) => {
    try {
      setIsConnecting(true);

      // Clear existing wallet state first
      disconnect();

      let walletSeed: string;
      if (seedOrPrivateKey) {
        // Check if it's a mnemonic
        if (seedOrPrivateKey.includes(' ')) {
          try {
            // Convert mnemonic to entropy (hex string)
            walletSeed = bip39.mnemonicToEntropy(seedOrPrivateKey).toUpperCase();
          } catch (error) {
            throw new Error('Invalid mnemonic phrase');
          }
        } else {
          // Treat as hex seed/private key
          if (!/^[0-9a-fA-F]*$/.test(seedOrPrivateKey)) {
            throw new Error('Invalid seed format: must be hexadecimal');
          }
          walletSeed = seedOrPrivateKey.toUpperCase();
        }
        // Ensure 64 characters
        walletSeed = walletSeed.padStart(64, '0');
      } else if (seed) {
        // Use existing seed if available
        walletSeed = seed;
      } else {
        // Generate new wallet if no seed provided or stored
        const randomWallet = banani.Wallet.gen_random_wallet(rpc);
        walletSeed = randomWallet.seed.toUpperCase();
      }

      // Validate final seed
      if (!/^[0-9A-F]{64}$/.test(walletSeed)) {
        throw new Error('Invalid seed: must be 64 hexadecimal characters');
      }

      // Create wallet instance
      const newWallet = new banani.Wallet(rpc, walletSeed);
      
      // Get initial balance - this won't throw for new accounts
      const initialBalance = await getBalance(newWallet.address);

      
      // Set all state at once
      setWallet(newWallet);
      setAddress(newWallet.address);
      setSeed(walletSeed);
      setBalance(initialBalance);
      setIsConnected(true);
      
      
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error connecting wallet:', formattedError);
      throw formattedError;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setAddress(null);
    setSeed(null);
    setBalance('0.00');
    setPendingBalance('0.00');
    setIsConnected(false);
    setMnemonic('');
  };

  const generateNewWallet = async () => {
    try {
      // Clear existing wallet state first
      disconnect();

      // Generate new mnemonic and convert to entropy (hex string)
      const newMnemonic = bip39.generateMnemonic(256); // 256 bits = 32 bytes = 64 hex chars
      const entropyHex = bip39.mnemonicToEntropy(newMnemonic).toUpperCase();
      
      // Ensure we have a 64-character hex string
      if (entropyHex.length !== 64) {
        throw new Error(`Invalid entropy length: ${entropyHex.length}. Expected 64 characters.`);
      }
      
      // Create wallet with the 64-char hex seed
      const newWallet = new banani.Wallet(rpc, entropyHex);
      
      // Get initial balance - this won't throw for new accounts
      const initialBalance = await getBalance(newWallet.address);
      
      // Store all state at once
      setSeed(entropyHex);
      setMnemonic(newMnemonic);
      setWallet(newWallet);
      setAddress(newWallet.address);
      setBalance(initialBalance);
      setIsConnected(true);
      
      return {
        mnemonic: newMnemonic,
        address: newWallet.address,
      };
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error generating wallet:', formattedError);
      throw formattedError;
    }
  };

  const sendBanano = async (toAddress: string, amount: string) => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Validate Banano address format
      if (!toAddress.startsWith('ban_') || toAddress.length !== 64) {
        throw new Error('Invalid Banano address format');
      }

      // Convert amount to number for sending
      const numericAmount = Number(amount).toString();
      
      // Send the transaction
      const hash = await wallet.send(toAddress as `ban_${string}`, numericAmount as `${number}`);

      // Update balances after sending
      await updateBalances();
      
      return hash;
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error sending BANANO:', formattedError);
      throw formattedError;
    }
  };

  const receivePending = async () => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Receive all pending blocks
      const hashes = await wallet.receive_all();
      
      // Update balances after receiving
      await updateBalances();
      
      return hashes || [];
    } catch (error) {
      const formattedError = formatError(error);
      console.error('Error receiving pending transactions:', formattedError);
      throw formattedError;
    }
  };

  const getTransactionHistory = async () => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const history = await rpc.get_account_history(address as `ban_${string}`, 10);
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

  // Set up periodic balance updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(updateBalances, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const value = {
    address,
    balance,
    pendingBalance,
    seed,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    generateNewWallet,
    mnemonic,
    sendBanano,
    receivePending,
    getTransactionHistory,
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
