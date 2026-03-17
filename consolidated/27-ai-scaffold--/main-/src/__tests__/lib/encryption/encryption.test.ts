// src/__tests__/lib/encryption/encryption.test.ts

import { EncryptionSystem } from '@/lib/security/encryption';
import { BinaryProcessor } from '@/lib/security/binary-units';

describe('EncryptionSystem', () => {
  let encryption: EncryptionSystem;

  beforeEach(() => {
    encryption = new EncryptionSystem();
  });

  describe('generateKey', () => {
    it('should generate a key of correct length', () => {
      const { length } = encryption.generateKey();
      expect(length).toBe(32); // 256 bits = 32 bytes
    });

    it('should generate different keys each time', () => {
      expect(encryption.generateKey()).not.toEqual(encryption.generateKey());
    });
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', async () => {
      const data = 'test message';
      const key = Buffer.from('test-key-test-key-test-key-test-key-test-key-test', 'utf8');
      const { encrypted, iv, tag, keyId } = await encryption.encrypt(data, key);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();
      expect(keyId).toBeDefined();
      expect(encrypted.data).toHaveLength(data.length);
    });

    it('should not produce same ciphertext twice', async () => {
      const data = 'test message';
      const key = Buffer.from('test-key-test-key-test-key-test-key-test-key-test-key-test-key', 'utf8');

      const { encrypted, iv } = await encryption.encrypt(data, key);
      const newEncrypted = await encryption.encrypt(data, key);

      expect(newEncrypted.iv).not.toEqual(iv);
      expect(newEncrypted.data).not.toEqual(encrypted.data); // Due to random IV
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', async () => {
      const originalData = 'test message';
      const key = Buffer.from('test-key-test-key-test-key-test-key-test-key-test-key-test-key-test-key', 'utf8');

      const encrypted = await encryption.encrypt(originalData, key);
      const decrypted = await encryption.decrypt(encrypted, key);

      expect(decrypted).toBe(originalData);
    });

    it('should fail to decrypt with wrong key', async () => {
      const originalData = 'test message';
      const correctKey = Buffer.from('test-key-test-key-test-key-test-key-test-key-test-key-test-key-test-key', 'utf8');
      const wrongKey = Buffer.from('wrong-key-wrong-key-wrong-key-wrong-key-wrong-key', 'utf8');

      const encrypted = await encryption.encrypt(originalData, correctKey);

      await expect(encryption.decrypt(encrypted, wrongKey)).rejects.toThrow();
    });
  });

  describe('generateKeyId', () => {
    it('should generate unique key IDs', () => {
      expect(encryption.generateKeyId()).not.toEqual(encryption.generateKeyId());
    });

    it('should generate key IDs of correct length', () => {
      expect(encryption.generateKeyId().length).toBe(32); // 16 bytes = 32 hex characters
    });
  });
});
```

**