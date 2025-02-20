import { EncryptedStorage } from './SecureStorage';

interface PersistedData {
  tempStorage: Record<
    string,
    {
      encryptedData: number[];
      iv: number[];
      hasCustomPassword: boolean;
    }
  >;
}

export class SeedManager {
  private storage = new EncryptedStorage();
  private tempStorage = new Map<string, {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    hasCustomPassword: boolean;
    lastAccessed: number;  // Add timestamp for cleanup
  }>();
  private autoPassword: string | null = null;  // Store in memory
  private readonly STORAGE_KEY = 'banano_wallet_data';
  private readonly SESSION_KEY = 'banano_temp_key';  // For session storage
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
  private cleanupTimer: NodeJS.Timeout | null = null;
  private lastAttempt = 0;
  private attemptCount = 0;

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEntries();
    }, this.CLEANUP_INTERVAL);
  }

  async ensureInitialized() {
    if (this.initialized) return;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize();
    }
    
    await this.initializationPromise;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const persisted = localStorage.getItem(this.STORAGE_KEY);
    if (persisted) {
      try {
        const data: PersistedData = JSON.parse(persisted);
        Object.entries(data.tempStorage).forEach(([key, value]) => {
          this.tempStorage.set(key, {
            encryptedData: new Uint8Array(value.encryptedData).buffer,
            iv: new Uint8Array(value.iv),
            hasCustomPassword: value.hasCustomPassword,
            lastAccessed: Date.now()
          });
        });
      } catch (error) {
        console.error('Failed to load persisted seed data:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
    
    this.initialized = true;
    this.initializationPromise = null;
  }

  private getAutoPassword(): string {
    if (this.autoPassword) return this.autoPassword;
    
    // Try to get from session storage first
    const sessionPassword = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionPassword) {
      this.autoPassword = sessionPassword;
      return sessionPassword;
    }
    
    // Generate new if none exists
    const newPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
      
    this.autoPassword = newPassword;
    sessionStorage.setItem(this.SESSION_KEY, newPassword);
    return newPassword;
  }

  // Add cleanup method
  private cleanupOldEntries(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [key, value] of this.tempStorage.entries()) {
      if (now - value.lastAccessed > maxAgeMs) {
        this.tempStorage.delete(key);
      }
    }
    this.persistData();
  }

  async storeSeed(seed: string, customPassword?: string): Promise<string> {
    await this.ensureInitialized();
    
    const password = customPassword || this.getAutoPassword();
    const { encryptedData, iv } = await this.storage.encrypt(seed, password);
    const tempId = crypto.randomUUID();
    
    this.tempStorage.set(tempId, { 
      encryptedData, 
      iv,
      hasCustomPassword: !!customPassword,
      lastAccessed: Date.now()
    });
    
    this.persistData();
    this.cleanupOldEntries();  // Cleanup on store
    return tempId;
  }

  async retrieveSeed(tempId: string, customPassword?: string): Promise<string | null> {
    await this.ensureInitialized();
    
    const stored = this.tempStorage.get(tempId);
    if (!stored) return null;
    
    // Update last accessed time
    stored.lastAccessed = Date.now();
    this.tempStorage.set(tempId, stored);
    
    const password = stored.hasCustomPassword 
      ? customPassword 
      : this.getAutoPassword();
      
    if (!password) throw new Error('Storage not initialized');
    return this.storage.decrypt(stored.encryptedData, stored.iv, password);
  }

  async getSeedInfo(tempId: string) {
    await this.ensureInitialized();
    return this.tempStorage.get(tempId);
  }

  clearMemory(): void {
    // Clear all sensitive data
    this.tempStorage.forEach((value) => {
      if (value.encryptedData instanceof ArrayBuffer) {
        crypto.getRandomValues(new Uint8Array(value.encryptedData));
      }
      if (value.iv instanceof Uint8Array) {
        crypto.getRandomValues(value.iv);
      }
    });
    this.tempStorage.clear();
    this.autoPassword = null;
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    this.initialized = false;
    this.initializationPromise = null;
  }

  private persistData(): void {
    const persistable: PersistedData = {
      tempStorage: Object.fromEntries(
        Array.from(this.tempStorage.entries()).map(([key, value]) => [
          key,
          { encryptedData: Array.from(new Uint8Array(value.encryptedData)), iv: Array.from(value.iv), hasCustomPassword: value.hasCustomPassword },
        ])
      ),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistable));
  }

  private hasNonCustomPasswordSeeds(): boolean {
    const persisted = localStorage.getItem(this.STORAGE_KEY);
    if (!persisted) return false;
    try {
      const data: PersistedData = JSON.parse(persisted);
      return Object.values(data.tempStorage).some(stored => !stored.hasCustomPassword);
    } catch {
      return false;
    }
  }

  // Add cleanup on unmount
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clearMemory();
  }

  private checkRateLimit() {
    const now = Date.now();
    if (now - this.lastAttempt > 60000) {
      this.attemptCount = 0;
    }
    this.lastAttempt = now;
    this.attemptCount++;
    if (this.attemptCount > 5) {
      throw new Error('Too many attempts. Please wait a minute.');
    }
  }
}
