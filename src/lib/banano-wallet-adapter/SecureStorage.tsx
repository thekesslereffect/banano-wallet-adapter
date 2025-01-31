export class EncryptedStorage {
    private encoder: TextEncoder;
    private decoder: TextDecoder;
    private readonly SALT = new Uint8Array([
      0x42, 0x41, 0x4e, 0x41, 0x4e, 0x4f, 0x57, 0x41,
      0x4c, 0x4c, 0x45, 0x54, 0x41, 0x44, 0x41, 0x50
    ]); // "BANANOWALLETADAP" in hex
  
    constructor() {
      this.encoder = new TextEncoder();
      this.decoder = new TextDecoder();
    }
  
    private async deriveKey(password: string): Promise<CryptoKey> {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        this.encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
  
      return await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: this.SALT,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
  
    async encrypt(data: string, password: string): Promise<{
      encryptedData: ArrayBuffer;
      iv: Uint8Array;
    }> {
      const key = await this.deriveKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = this.encoder.encode(data);
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encodedData
      );
  
      return {
        encryptedData,
        iv
      };
    }
  
    async decrypt(encryptedData: ArrayBuffer, iv: Uint8Array, password: string): Promise<string> {
      const key = await this.deriveKey(password);
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData
      );
  
      return this.decoder.decode(decryptedData);
    }
}