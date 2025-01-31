import { EncryptedStorage } from '@/lib/banano-wallet-adapter/SecureStorage';

interface PersistedData {
  tempStorage: {
    [key: string]: {
      encryptedData: number[];
      iv: number[];
    };
  };
}

export class SeedManager {
    private storage: EncryptedStorage;
    private tempStorage: Map<string, {
      encryptedData: ArrayBuffer;
      iv: Uint8Array;
    }>;
    private readonly STORAGE_KEY = 'banano_wallet_data';
    private readonly PASSWORD_KEY = 'banano_wallet_key';
  
    constructor() {
      this.storage = new EncryptedStorage();
      this.tempStorage = new Map();
    }
  
    async initialize(): Promise<void> {
      // Generate a random password if one doesn't exist
      let password = localStorage.getItem(this.PASSWORD_KEY);
      if (!password) {
        password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        localStorage.setItem(this.PASSWORD_KEY, password);
      }
      
      // Load any persisted data
      const persistedData = localStorage.getItem(this.STORAGE_KEY);
      if (persistedData) {
        try {
          const parsed = JSON.parse(persistedData) as PersistedData;
          Object.entries(parsed.tempStorage).forEach(([key, value]) => {
            this.tempStorage.set(key, {
              encryptedData: new Uint8Array(value.encryptedData).buffer,
              iv: new Uint8Array(value.iv)
            });
          });
        } catch (error) {
          console.error('Failed to load persisted wallet data:', error);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    }
  
    async storeSeed(seed: string): Promise<string> {
      const password = localStorage.getItem(this.PASSWORD_KEY);
      if (!password) {
        throw new Error('Storage not initialized');
      }

      const { encryptedData, iv } = await this.storage.encrypt(seed, password);
      
      const tempId = crypto.randomUUID();
      this.tempStorage.set(tempId, {
        encryptedData,
        iv
      });

      // Persist to localStorage
      this.persistData();
  
      return tempId;
    }
  
    async retrieveSeed(tempId: string): Promise<string | null> {
      const password = localStorage.getItem(this.PASSWORD_KEY);
      if (!password) {
        throw new Error('Storage not initialized');
      }

      const storedData = this.tempStorage.get(tempId);
      if (!storedData) {
        return null;
      }
  
      return await this.storage.decrypt(
        storedData.encryptedData,
        storedData.iv,
        password
      );
    }
  
    clearMemory(): void {
      this.tempStorage.clear();
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.PASSWORD_KEY);
    }

    private persistData(): void {
      const persistableData: PersistedData = {
        tempStorage: Object.fromEntries(
          Array.from(this.tempStorage.entries()).map(([key, value]) => [
            key,
            {
              encryptedData: Array.from(new Uint8Array(value.encryptedData)),
              iv: Array.from(value.iv)
            }
          ])
        )
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistableData));
    }
}