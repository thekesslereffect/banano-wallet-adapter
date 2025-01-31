import { EncryptedStorage } from './SecureStorage';

interface PersistedData {
  tempStorage: Record<
    string,
    {
      encryptedData: number[];
      iv: number[];
    }
  >;
}

export class SeedManager {
  private storage = new EncryptedStorage();
  private tempStorage = new Map<
    string,
    { encryptedData: ArrayBuffer; iv: Uint8Array }
  >();
  private readonly STORAGE_KEY = 'banano_wallet_data';
  private readonly PASSWORD_KEY = 'banano_wallet_key';

  async initialize(): Promise<void> {
    let password = localStorage.getItem(this.PASSWORD_KEY);
    if (!password) {
      password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(this.PASSWORD_KEY, password);
    }
    const persisted = localStorage.getItem(this.STORAGE_KEY);
    if (persisted) {
      try {
        const data: PersistedData = JSON.parse(persisted);
        Object.entries(data.tempStorage).forEach(([key, value]) => {
          this.tempStorage.set(key, {
            encryptedData: new Uint8Array(value.encryptedData).buffer,
            iv: new Uint8Array(value.iv),
          });
        });
      } catch (error) {
        console.error('Failed to load persisted seed data:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  async storeSeed(seed: string): Promise<string> {
    const password = localStorage.getItem(this.PASSWORD_KEY);
    if (!password) throw new Error('Storage not initialized');
    const { encryptedData, iv } = await this.storage.encrypt(seed, password);
    const tempId = crypto.randomUUID();
    this.tempStorage.set(tempId, { encryptedData, iv });
    this.persistData();
    return tempId;
  }

  async retrieveSeed(tempId: string): Promise<string | null> {
    const password = localStorage.getItem(this.PASSWORD_KEY);
    if (!password) throw new Error('Storage not initialized');
    const stored = this.tempStorage.get(tempId);
    if (!stored) return null;
    return this.storage.decrypt(stored.encryptedData, stored.iv, password);
  }

  clearMemory(): void {
    this.tempStorage.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PASSWORD_KEY);
  }

  private persistData(): void {
    const persistable: PersistedData = {
      tempStorage: Object.fromEntries(
        Array.from(this.tempStorage.entries()).map(([key, value]) => [
          key,
          { encryptedData: Array.from(new Uint8Array(value.encryptedData)), iv: Array.from(value.iv) },
        ])
      ),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistable));
  }
}
