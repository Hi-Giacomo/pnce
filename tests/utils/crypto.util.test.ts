import { describe, it, expect } from 'vitest';
import { CryptoUtil } from '../../src/utils/crypto.util';

describe('CryptoUtil', () => {
  describe('encrypt and decrypt', () => {
    it('应该能够加密和解密文本', () => {
      const plaintext = 'Hello, World!';
      const encrypted = CryptoUtil.encrypt(plaintext);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够加密和解密Token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const encrypted = CryptoUtil.encrypt(token);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(token);
    });

    it('应该能够加密和解密包含特殊字符的文本', () => {
      const plaintext = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const encrypted = CryptoUtil.encrypt(plaintext);
      const decrypted = CryptoUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('同一文本多次加密应该产生不同的密文', () => {
      const plaintext = 'Hello';
      const encrypted1 = CryptoUtil.encrypt(plaintext);
      const encrypted2 = CryptoUtil.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('generateSalt', () => {
    it('应该生成指定长度的盐值', () => {
      const salt = CryptoUtil.generateSalt(16);
      expect(salt).toBeTruthy();
      expect(salt.length).toBeGreaterThan(0);
    });

    it('多次生成的盐值应该不同', () => {
      const salt1 = CryptoUtil.generateSalt();
      const salt2 = CryptoUtil.generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hash and verifyHash', () => {
    it('应该能够哈希文本', () => {
      const text = 'Hello';
      const hash = CryptoUtil.hash(text);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA256 hex 长度
    });

    it('同一文本多次哈希应该产生相同结果', () => {
      const text = 'Hello';
      const hash1 = CryptoUtil.hash(text);
      const hash2 = CryptoUtil.hash(text);

      expect(hash1).toBe(hash2);
    });

    it('不同文本应该产生不同的哈希值', () => {
      const hash1 = CryptoUtil.hash('Hello');
      const hash2 = CryptoUtil.hash('World');

      expect(hash1).not.toBe(hash2);
    });

    it('应该能够验证哈希', () => {
      const text = 'Hello';
      const hash = CryptoUtil.hash(text);

      expect(CryptoUtil.verifyHash(text, hash)).toBe(true);
      expect(CryptoUtil.verifyHash('Different', hash)).toBe(false);
    });

    it('使用盐值应该产生不同的哈希', () => {
      const text = 'Hello';
      const salt = 'random-salt';
      const hash1 = CryptoUtil.hash(text);
      const hash2 = CryptoUtil.hash(text, salt);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateToken', () => {
    it('应该生成指定长度的Token', () => {
      const token = CryptoUtil.generateToken(16);
      expect(token).toHaveLength(32); // hex编码，16字节=32字符
    });

    it('默认应该生成32字节的Token', () => {
      const token = CryptoUtil.generateToken();
      expect(token).toHaveLength(64); // hex编码
    });

    it('多次生成的Token应该不同', () => {
      const token1 = CryptoUtil.generateToken();
      const token2 = CryptoUtil.generateToken();
      expect(token1).not.toBe(token2);
    });
  });
});
