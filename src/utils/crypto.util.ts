import * as crypto from 'crypto';

/**
 * Utility
 * Data
 */
export class CryptoUtil {
  private static ALGORITHM = 'aes-256-gcm';
  private static KEY_LENGTH = 32;
  private static IV_LENGTH = 16;
  private static AUTH_TAG_LENGTH = 16;

  /**
   * Environment variables
   * ，
   */
  private static getEncryptionKey(): Buffer {
    // Environment variables
    const envKey = process.env.PNCE_ENCRYPTION_KEY;
    if (envKey) {
      return crypto.scryptSync(envKey, 'salt', CryptoUtil.KEY_LENGTH);
    }

    // No（）
    const os = require('os');
    const machineId = [
      os.hostname(),
      os.platform(),
      os.arch(),
      process.env.USER || process.env.USERNAME || 'unknown',
    ].join('|');

    return crypto.scryptSync(machineId, 'pnce-salt', CryptoUtil.KEY_LENGTH);
  }

  /**
   *
   * @param text -
   * @returns （Base64）
   */
  static encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv) as any;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    //  IV、DataAuthTags
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

    return combined.toString('base64');
  }

  /**
   *
   * @param encryptedText - （Base64）
   * @returns
   * @throws failed
   */
  static decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');

    //  IV、AuthTagsData
    const iv = combined.subarray(0, this.IV_LENGTH);
    const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv) as any;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   *
   * @param length - （Default16）
   * @returns （Base64）
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   *
   * @param text -
   * @param salt - （）
   * @returns （Hex）
   */
  static hash(text: string, salt?: string): string {
    const hash = crypto.createHash('sha256');
    if (salt) {
      hash.update(salt);
    }
    hash.update(text);
    return hash.digest('hex');
  }

  /**
   * Validation
   * @param text -
   * @param hash - Validation
   * @param salt - （）
   * @returns Yes/No
   */
  static verifyHash(text: string, hash: string, salt?: string): boolean {
    const computedHash = this.hash(text, salt);
    return computedHash === hash;
  }

  /**
   *  Token
   * @param length - Token （）
   * @returns  Token（Hex）
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
