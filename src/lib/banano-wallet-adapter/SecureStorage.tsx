export class EncryptedStorage {
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12;
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly KEY_LENGTH = 256;
  private readonly ITERATIONS = 310000; // Increase iterations for PBKDF2

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // Use TextEncoder for consistent UTF-8 encoding
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as raw key material
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive a key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string, password: string): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const key = await this.deriveKey(password, salt);
    
    // Encrypt the data
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine salt and encrypted content
    const result = new Uint8Array(salt.length + encryptedContent.byteLength);
    result.set(salt);
    result.set(new Uint8Array(encryptedContent), salt.length);

    return {
      encryptedData: result.buffer,
      iv
    };
  }

  async decrypt(encryptedData: ArrayBuffer, iv: Uint8Array, password: string): Promise<string> {
    // Extract salt from encrypted data
    const salt = new Uint8Array(encryptedData.slice(0, this.SALT_LENGTH));
    const content = new Uint8Array(encryptedData.slice(this.SALT_LENGTH));
    
    const key = await this.deriveKey(password, salt);
    
    try {
      const decryptedContent = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        content
      );
      
      return new TextDecoder().decode(decryptedContent);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}
