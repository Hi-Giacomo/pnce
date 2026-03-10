import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Cache
 */
export interface CacheEntry<T> {
  /**
   * CacheData
   */
  data: T;

  /**
   * Cache
   */
  cachedAt: number;

  /**
   * 
   */
  expiresAt: number;
}

/**
 * Offline cache
 */
export class OfflineCacheManager {
  private cacheDir: string;
  private defaultExpireTime: number;

  constructor(cacheDir: string, defaultExpireTime: number = 7 * 24 * 60 * 60 * 1000) {
    this.cacheDir = cacheDir;
    this.defaultExpireTime = defaultExpireTime;

    // Cache Directory
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
  }

  /**
   * CacheFile
   */
  private getCacheFilePath(key: string): string {
    //  key File
    const fileName = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.cacheDir, `${fileName}.json`);
  }

  /**
   * Cache
   */
  set<T>(key: string, data: T, expireTime?: number): void {
    const now = Date.now();
    const expiresAt = now + (expireTime || this.defaultExpireTime);

    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt,
    };

    const filePath = this.getCacheFilePath(key);

    try {
      writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
      logger.debug(`Cache已保存: ${key}`);
    } catch (error) {
      logger.error(`保存CacheFailed: ${error}`);
    }
  }

  /**
   * Cache
   */
  get<T>(key: string): T | null {
    const filePath = this.getCacheFilePath(key);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // YesNo
      if (Date.now() > entry.expiresAt) {
        logger.debug(`Cache已过期: ${key}`);
        this.delete(key);
        return null;
      }

      logger.debug(`Cache命中: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`读取CacheFailed: ${error}`);
      return null;
    }
  }

  /**
   * CacheYesNo
   */
  has(key: string): boolean {
    const filePath = this.getCacheFilePath(key);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content);

      // YesNo
      return Date.now() <= entry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache
   */
  delete(key: string): void {
    const filePath = this.getCacheFilePath(key);

    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        logger.debug(`Cache已删除: ${key}`);
      } catch (error) {
        logger.error(`删除CacheFailed: ${error}`);
      }
    }
  }

  /**
   * AllCache
   */
  clear(): void {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          unlinkSync(path.join(this.cacheDir, file));
        }
      });

      logger.debug('AllCache已清空');
    } catch (error) {
      logger.error(`清空CacheFailed: ${error}`);
    }
  }

  /**
   * Cache
   */
  cleanExpired(): void {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      const now = Date.now();
      let cleanedCount = 0;

      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const content = readFileSync(filePath, 'utf-8');
            const entry = JSON.parse(content);

            if (now > entry.expiresAt) {
              unlinkSync(filePath);
              cleanedCount++;
            }
          } catch (error) {
            // Error，OtherFile
          }
        }
      });

      logger.debug(`清理过期Cache: ${cleanedCount} 个`);
    } catch (error) {
      logger.error(`清理过期CacheFailed: ${error}`);
    }
  }

  /**
   * CacheInfo
   */
  getStats(): { count: number; size: number; keys: string[] } {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      const validKeys: string[] = [];
      let totalSize = 0;
      const now = Date.now();

      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const content = readFileSync(filePath, 'utf-8');
            const entry = JSON.parse(content);

            if (now <= entry.expiresAt) {
              //  key（ .json ）
              const key = file.replace('.json', '').replace(/_/g, '.');
              validKeys.push(key);
              totalSize += content.length;
            }
          } catch (error) {
            // Error
          }
        }
      });

      return {
        count: validKeys.length,
        size: totalSize,
        keys: validKeys,
      };
    } catch (error) {
      return {
        count: 0,
        size: 0,
        keys: [],
      };
    }
  }
}

/**
 * 
 */
export function createOfflineCacheManager(
  cacheDir: string,
  defaultExpireTime?: number
): OfflineCacheManager {
  return new OfflineCacheManager(cacheDir, defaultExpireTime);
}
