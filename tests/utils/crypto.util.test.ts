import { describe, it, expect } from 'vitest';
import { CryptoUtil } from '../../src/utils/crypto.util';

describe('CryptoUtil', () => {
  describe('encrypt and decrypt', () => {
    it('EncryptDecrypt', () => {
      const plaintext = 'Hello, World!';
      const encrypted = CryptoUtil.encrypt(plaintext);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('EncryptDecryptToken', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const encrypted = CryptoUtil.encrypt(token);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(token);
    });

    it('EncryptDecryptPackage', () => {
      const plaintext = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const encrypted = CryptoUtil.encrypt(plaintext);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('Encrypt', () => {
      const plaintext = 'Hello';
      const encrypted1 = CryptoUtil.encrypt(plaintext);
      const encrypted2 = CryptoUtil.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('generateSalt', () => {
    it('Value', () => {
      const salt = CryptoUtil.generateSalt(16);
      expect(salt).toBeTruthy();
      expect(salt.length).toBeGreaterThan(0);
    });

    it('Value', () => {
      const salt1 = CryptoUtil.generateSalt();
      const salt2 = CryptoUtil.generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hash and verifyHash', () => {
    it('', () => {
      const text = 'Hello';
      const hash = CryptoUtil.hash(text);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA256 hex 
    });

    it('Result', () => {
      const text = 'Hello';
      const hash1 = CryptoUtil.hash(text);
      const hash2 = CryptoUtil.hash(text);

      expect(hash1).toBe(hash2);
    });

    it('Value', () => {
      const hash1 = CryptoUtil.hash('Hello');
      const hash2 = CryptoUtil.hash('World');

      expect(hash1).not.toBe(hash2);
    });

    it('Validate', () => {
      const text = 'Hello';
      const hash = CryptoUtil.hash(text);

      expect(CryptoUtil.verifyHash(text, hash)).toBe(true);
      expect(CryptoUtil.verifyHash('Different', hash)).toBe(false);
    });

    it('UseValue', () => {
      const text = 'Hello';
      const salt = 'random-salt';
      const hash1 = CryptoUtil.hash(text);
      const hash2 = CryptoUtil.hash(text, salt);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateToken', () => {
    it('Token', () => {
      const token = CryptoUtil.generateToken(16);
      expect(token).toHaveLength(32); // hexEncoding，16Section=32
    });

    it('Default32SectionToken', () => {
      const token = CryptoUtil.generateToken();
      expect(token).toHaveLength(64); // hexEncoding
    });

    it('Token', () => {
      const token1 = CryptoUtil.generateToken();
      const token2 = CryptoUtil.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
