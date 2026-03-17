import { randomBytes } from 'crypto';

export interface EncryptedPacket {
  /**
   * Base64 encoded, encrypted binary data
   */
  data: string;

  /**
   * Base64 encoded initialization vector
   */
  iv: string;

  /**
   * Base64 encoded authentication tag
   */
  tag: string;

  /**
   * Unique identifier for the encryption key
   */
  keyId: string;

  /**
   * Timestamp of encryption (in milliseconds)
   */
  timestamp: number;
}

export interface EncryptionKey {
  /**
   * Unique identifier for the key
   */
  id: string;

  /**
   * Base64 encoded, public key (RSA or symmetric)
   */
  publicKey: string;

  /**
   * Encrypted storage (symmetric key or RSA private key)
   */
  privateKey: string;

  /**
   * Algorithm used for encryption (e.g. AES-256-GCM or RSA-4096)
   */
  algorithm: 'AES-256-GCM' | 'RSA-4096';

  /**
   * Timestamp of key creation (in milliseconds)
   */
  created: number;

  /**
   * Timestamp of key expiration (in milliseconds)
   */
  expires: number;

  /**
   * Usage rights for the key (ENCRYPT, DECRYPT, or both)
   */
  usage: 'ENCRYPT' | 'DECRYPT' | 'BOTH';
}

export class EncryptionSystem {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12;
  private readonly tagLength = 16;

  /**
   * Encrypts the provided data using the specified key
   *
   * @param data The data to encrypt (string)
   * @param key The encryption key (Buffer)
   * @returns Encrypted packet with key ID and timestamp
   */
  async encrypt(data: string, key: Buffer): Promise<EncryptedPacket> {
    const iv = randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyId: this.generateKeyId(),
      timestamp: Date.now()
    };
  }

  /**
   * Decrypts the provided packet using the specified key
   *
   * @param packet The encrypted packet to decrypt (EncryptedPacket)
   * @param key The decryption key (Buffer)
   * @returns Decrypted data
   */
  async decrypt(packet: EncryptedPacket, key: Buffer): Promise<string> {
    const iv = Buffer.from(packet.iv, 'base64');
    const tag = Buffer.from(packet.tag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(packet.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generates a unique key ID
   */
  private generateKeyId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generates a random symmetric key
   */
  generateKey(): Buffer {
    return randomBytes(this.keyLength);
  }

  /**
   * Generates an RSA key pair
   *
   * @returns RSA key pair (public key and private key)
   */
  async generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }
}