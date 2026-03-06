import * as crypto from 'crypto';

/**
 * 加密工具类
 * 用于敏感数据的加密和解密
 */
export class CryptoUtil {
  private static ALGORITHM = 'aes-256-gcm';
  private static KEY_LENGTH = 32;
  private static IV_LENGTH = 16;
  private static AUTH_TAG_LENGTH = 16;

  /**
   * 从环境变量获取加密密钥
   * 如果未设置，则使用机器标识符生成
   */
  private static getEncryptionKey(): Buffer {
    // 优先使用环境变量中的密钥
    const envKey = process.env.PNCE_ENCRYPTION_KEY;
    if (envKey) {
      return crypto.scryptSync(envKey, 'salt', CryptoUtil.KEY_LENGTH);
    }

    // 否则使用机器标识符生成（确保同一台机器上的密钥一致）
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
   * 加密文本
   * @param text - 要加密的文本
   * @returns 加密后的文本（Base64编码）
   */
  static encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv) as any;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 将 IV、加密数据和认证标签组合
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

    return combined.toString('base64');
  }

  /**
   * 解密文本
   * @param encryptedText - 加密后的文本（Base64编码）
   * @returns 解密后的原始文本
   * @throws 如果解密失败
   */
  static decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');

    // 提取 IV、认证标签和加密数据
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
   * 生成随机盐值
   * @param length - 盐值长度（默认16字节）
   * @returns 随机盐值（Base64编码）
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * 哈希文本
   * @param text - 要哈希的文本
   * @param salt - 盐值（可选）
   * @returns 哈希值（Hex编码）
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
   * 验证哈希
   * @param text - 原始文本
   * @param hash - 要验证的哈希值
   * @param salt - 盐值（如果生成时使用了盐值）
   * @returns 是否匹配
   */
  static verifyHash(text: string, hash: string, salt?: string): boolean {
    const computedHash = this.hash(text, salt);
    return computedHash === hash;
  }

  /**
   * 生成随机 Token
   * @param length - Token 长度（字节）
   * @returns 随机 Token（Hex编码）
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
