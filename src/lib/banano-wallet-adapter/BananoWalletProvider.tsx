import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import * as banani from 'banani';
import * as bip39 from 'bip39';
import { SeedManager } from './SeedManager';
import { AccountHistoryBlock, AccountHistoryRawBlock } from 'banani';

const DEFAULT_RPC_URL = 'https://kaliumapi.appditto.com/api';
const REFRESH_INTERVAL = 5000; // 5 seconds

interface WalletContextType {
  address: string | null;
  balance: string;
  seed: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (seedOrPrivateKey?: string) => Promise<string>;
  disconnect: () => void;
  generateNewWallet: () => Promise<{ mnemonic: string; address: string }>;
  sendBanano: (toAddress: string, amount: string) => Promise<string>;
  getTransactionHistory: (
    address: string
  ) => Promise<
    Array<{
      type: 'send' | 'receive';
      account: `ban_${string}` | `nano_${string}`;
      amount: `${number}`;
      hash: string;
      timestamp: number;
    }>
  >;
  getBalance: (address: string) => Promise<string>;
  getUserBalance: () => Promise<void>;
  receivePending: (blockHash: string) => Promise<string>;
  receiveAllPending: () => Promise<string[]>;
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
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  const rpc = useMemo(() => new banani.RPC(rpcUrl), [rpcUrl]);

  const getBalance = useCallback(async (addr: string): Promise<string> => {
    try {
      const info = await rpc.get_account_info(addr as `ban_${string}`);
      // If the account isn't found, return 0.00.
      if (info && 'error' in info) {
        if (info.error === "Account not found") {
          return "0.00";
        }
        console.error("Error fetching account info:", info.error);
        return "0.00";
      }
      const rawBalance = BigInt(info.balance);
      const whole = banani.raw_to_whole(rawBalance);
      return Number(whole).toFixed(2);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return "0.00";
      }
      console.error("Error fetching balance:", error);
      return "0.00";
    }
  }, [rpc]);

  const connect = async (seedOrPrivateKey?: string): Promise<string> => {
    setIsConnecting(true);
    try {
      // Ensure the SeedManager is initialized before using it.
      await seedManager.initialize();
  
      let finalSeed: string;
      if (seedOrPrivateKey) {
        // If input contains spaces, assume it's a mnemonic; otherwise assume it's a private key.
        if (seedOrPrivateKey.trim().includes(" ")) {
          finalSeed = bip39.mnemonicToEntropy(seedOrPrivateKey).toUpperCase();
        } else if (seedOrPrivateKey.length === 64) {
          finalSeed = seedOrPrivateKey;
        } else {
          throw new Error("Invalid seed or mnemonic");
        }
      } else {
        // Generate a random wallet if no seed provided.
        const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
        finalSeed = generatedSeed;
      }
      // Persist the seed via SeedManager.
      const seedRef = await seedManager.storeSeed(finalSeed);
      localStorage.setItem("bananoWalletSeedRef", seedRef);
  
      const newWallet = new banani.Wallet(rpc, finalSeed);
      setWallet(newWallet);
      setAddress(newWallet.address);
      setSeed(finalSeed);
      setIsConnected(true);
  
      const initialBalance = await getBalance(newWallet.address);
      setBalance(initialBalance);
      return newWallet.address;
    } catch (error) {
      console.error("Error in connect:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Updated generateNewWallet function.
  const generateNewWallet = async (): Promise<{ mnemonic: string; address: string }> => {
    try {
      // Use the banani random wallet generator and convert its seed to a mnemonic.
      const { seed: generatedSeed } = banani.Wallet.gen_random_wallet(rpc);
      // Convert the generated seed (expected to be a 64-char hex string) to a mnemonic.
      const mnemonic = bip39.entropyToMnemonic(generatedSeed.toLowerCase());
      const newAddress = await connect(generatedSeed);
      return { mnemonic, address: newAddress };
    } catch (error) {
      console.error("Error generating new wallet:", error);
      throw error;
    }
  };


  useEffect(() => {
    const tryReconnect = async () => {
      const seedRef = localStorage.getItem('bananoWalletSeedRef');
      if (seedRef && !isConnected && !isConnecting) {
        try {
          const retrievedSeed = await seedManager.retrieveSeed(seedRef);
          if (retrievedSeed) await connect(retrievedSeed);
        } catch (error) {
          console.error('Reconnection failed:', error);
          localStorage.removeItem('bananoWalletSeedRef');
        }
      }
    };

    seedManager.initialize().then(tryReconnect).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedManager]);

  const getUserBalance = useCallback(async () => {
    if (!address) return;
    const newBalance = await getBalance(address);
    setBalance(newBalance);
  }, [address, getBalance]);

  const receivePending = useCallback(async (blockHash: string) => {
    if (!wallet || !address) throw new Error('Wallet not connected');
    try {
      const hash = await wallet.receive(blockHash);
      await getUserBalance();
      return hash;
    } catch (error) {
      console.error('Error receiving pending transaction:', error);
      throw error;
    }
  }, [wallet, address, getUserBalance]);

  const receiveAllPending = useCallback(async () => {
    if (!wallet || !address) throw new Error('Wallet not connected');
    try {
      const hash = await wallet.receive_all();
      await getUserBalance();
      return hash;
    } catch (error) {
      console.error('Error receiving all pending transactions:', error);
      throw error;
    }
  }, [wallet, address, getUserBalance]);

  // Updated effect: Check for pending transactions and handle "Account not found" gracefully.
  // Updated effect: Check for pending transactions and update balance.
  useEffect(() => {
    if (!isConnected || !address) return;
    let mounted = true;
    const updateBalance = async () => {
      if (!mounted) return;
      try {
        // Make one API call to get account info with pending data.
        const info = await rpc.get_account_info(
          address as `ban_${string}`,
          false, // not representative
          false, // not pending by default
          false, // not confirmed
          true   // include pending info
        );
        let newBalance = "0.00";
        if (info && "error" in info) {
          // If the account isn't found, treat balance as 0.00.
          if (info.error === "Account not found") {
            newBalance = "0.00";
          } else {
            console.error("Error fetching account info:", info.error);
          }
        } else if (info) {
          // If there are pending transactions...
          if (info.pending && BigInt(info.pending) > BigInt(0)) {
            console.log("Pending transactions detected; receiving all pending.");
            await receiveAllPending();
            // After receiving, get updated account info.
            const updatedInfo = await rpc.get_account_info(address as `ban_${string}`);
            if (updatedInfo && !("error" in updatedInfo)) {
              newBalance = Number(
                banani.raw_to_whole(BigInt(updatedInfo.balance))
              ).toFixed(2);
            }
          } else {
            newBalance = Number(
              banani.raw_to_whole(BigInt(info.balance))
            ).toFixed(2);
          }
        }
        setBalance(newBalance);
      } catch (error) {
        // If the error is due to "Account not found", simply set balance to "0.00".
        if (error instanceof Error && error.message.includes("Account not found")) {
          setBalance("0.00");
        } else {
          console.error("Balance update error:", error);
        }
      }
      setTimeout(updateBalance, REFRESH_INTERVAL);
    };
    updateBalance();
    return () => {
      mounted = false;
    };
  }, [isConnected, address, receiveAllPending, rpc]);


  const disconnect = () => {
    setWallet(null);
    setAddress(null);
    setBalance('0.00');
    setIsConnected(false);
    setSeed(null);
    localStorage.removeItem('bananoWalletSeedRef');
    seedManager.clearMemory();
  };

  const sendBanano = async (toAddress: string, amount: string): Promise<string> => {
    if (!wallet || !address) throw new Error('Wallet not connected');
    try {
      const hash = await wallet.send(toAddress as `ban_${string}`, amount as `${number}`);
      await getUserBalance();
      return hash;
    } catch (error) {
      console.error('Error sending BANANO:', error);
      throw error;
    }
  };

  const getTransactionHistory = async (addr: string) => {
    try {
      const history = await rpc.get_account_history(addr as `ban_${string}`, 10);
      if (!history || !history.history) return [];
      return history.history.map((tx: AccountHistoryBlock | AccountHistoryRawBlock) => {
        // Filter out non-send/receive transactions
        if (tx.type !== 'send' && tx.type !== 'receive') {
          return null;
        }
        return {
          type: tx.type,
          account: tx.account,
          amount: banani.raw_to_whole(BigInt(tx.amount)) as `${number}`,
          hash: tx.hash,
          timestamp: Number(tx.local_timestamp),
        };
      }).filter((tx): tx is { 
        type: 'send' | 'receive';
        account: `ban_${string}` | `nano_${string}`;
        amount: `${number}`;
        hash: string;
        timestamp: number;
      } => tx !== null);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  };

  

  

  const value: WalletContextType = {
    address,
    balance,
    seed,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    generateNewWallet,
    sendBanano,
    getTransactionHistory,
    getBalance,
    getUserBalance,
    receivePending,
    receiveAllPending,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a BananoWalletProvider');
  return context;
}
