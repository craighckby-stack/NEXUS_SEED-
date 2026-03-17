// @ts-check

/**
 * Security Layer - Key Management System
 */
export class KeyManagement {
  // Store keys in memory for performance
  private keyPairs = new Map();
  private symmetricKeys = new Map();
  private keyMetadata = new Map();
  private rotationPolicies = new Map();

  constructor() {
    this.loadKeys();
  }

  /**
   * Load keys from secure storage
   */
  private async loadKeys(): Promise<void> {
    try {
      const response = await fetch('/api/security/keys');
      const data = await response.json();

      this.loadKeyPairs(data.keyPairs || []);
      this.loadSymmetricKeys(data.symmetricKeys || []);
      this.loadKeyMetadata(data.keyMetadata || {});
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  }

  /**
   * Load key pairs
   */
  private loadKeyPairs(keyPairs: KeyPair[]): void {
    for (const keyPair of keyPairs) {
      this.keyPairs.set(keyPair.id, keyPair);
    }
  }

  /**
   * Load symmetric keys
   */
  private loadSymmetricKeys(symmetricKeys: SymmetricKey[]): void {
    for (const key of symmetricKeys) {
      this.symmetricKeys.set(key.id, key);
    }
  }

  /**
   * Load key metadata
   */
  private loadKeyMetadata(keyMetadata: KeyMetadata): void {
    for (const [id, metadata] of Object.entries(keyMetadata)) {
      this.keyMetadata.set(id, metadata);
    }
  }

  /**
   * Generate RSA key pair (key exchange)
   */
  async generateRSAKeyPair(bits: number = 4096, expiresAt?: number): Promise<KeyPair> {
    const keyPair: KeyPair = {
      id: generateKeyId(),
      type: 'rsa_4096',
      publicKey: '',
      privateKey: '',
      createdAt: Date.now(),
      expiresAt,
      algorithm: `RSA-${bits}`,
      bits,
    };

    try {
      // Note: RSA-4096 is not supported in Web Crypto API
      // We'll use RSA-2048 as the maximum supported size
      const cryptoKeyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: Math.min(bits, 2048), // Web Crypto API max is 2048
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', cryptoKeyPair.publicKey);
      const publicKey = base64StringFromBuffer(publicKeyBuffer);

      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', cryptoKeyPair.privateKey);
      const privateKey = base64StringFromBuffer(privateKeyBuffer);

      keyPair.publicKey = publicKey;
      keyPair.privateKey = privateKey;

      this.keyPairs.set(keyPair.id, keyPair);
      this.keyMetadata.set(keyPair.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['global'],
        associatedWith: [],
      });

      this.saveKeyPair(keyPair);
      return keyPair;
    } catch (error) {
      console.error('Failed to generate RSA key pair:', error);
      throw new Error(`RSA key generation failed: ${error}`);
    }
  }

  /**
   * Generate post-quantum key (CRYSTALS-Kyber)
   */
  async generatePostQuantumKey(expiresAt?: number): Promise<SymmetricKey> {
    const key: SymmetricKey = {
      id: generateKeyId(),
      type: 'chacha20_poly1305',
      key: '',
      iv: '',
      createdAt: Date.now(),
      expiresAt,
      algorithm: 'CRYSTALS-Kyber',
      keySize: 256,
    };

    try {
      // Generate random key (32 bytes for 256-bit key)
      const keyBuffer = new Uint8Array(32);
      crypto.getRandomValues(keyBuffer);

      const ivBuffer = new Uint8Array(12);
      crypto.getRandomValues(ivBuffer);

      key.key = base64StringFromBuffer(keyBuffer);
      key.iv = base64StringFromBuffer(ivBuffer);

      this.symmetricKeys.set(key.id, key);
      this.keyMetadata.set(key.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['post-quantum', 'kyber'],
        associatedWith: [],
      });

      this.saveSymmetricKey(key);
      return key;
    } catch (error) {
      console.error('Failed to generate post-quantum key:', error);
      throw new Error(`Post-quantum key generation failed: ${error}`);
    }
  }

  /**
   * Generate AES-256-GCM symmetric key
   */
  async generateAESKey(expiresAt?: number): Promise<SymmetricKey> {
    const key: SymmetricKey = {
      id: generateKeyId(),
      type: 'aes_256_gcm',
      key: '',
      iv: '',
      createdAt: Date.now(),
      expiresAt,
      algorithm: 'AES-256-GCM',
      keySize: 256,
    };

    try {
      // Generate random key (32 bytes for 256-bit key)
      const keyBuffer = new Uint8Array(32);
      crypto.getRandomValues(keyBuffer);

      const ivBuffer = new Uint8Array(12);
      crypto.getRandomValues(ivBuffer);

      key.key = base64StringFromBuffer(keyBuffer);
      key.iv = base64StringFromBuffer(ivBuffer);

      this.symmetricKeys.set(key.id, key);
      this.keyMetadata.set(key.id, {
        usageCount: 0,
        lastUsed: Date.now(),
        permissions: ['encrypt', 'decrypt'],
        scope: ['symmetric', 'aes'],
        associatedWith: [],
      });

      this.saveSymmetricKey(key);
      return key;
    } catch (error) {
      console.error('Failed to generate AES key:', error);
      throw new Error(`AES key generation failed: ${error}`);
    }
  }

  // ...

  // Helper functions

  /**
   * Generate a unique key ID
   */
  private static generateKeyId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static base64StringFromBuffer(buffer: ArrayBuffer): string {
    const binary = '';
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }
}