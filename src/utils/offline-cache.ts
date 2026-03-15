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
   * Cachefile
   */
  private getCachefilePath(key: string): string {
    //  key file
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

    const filePath = this.getCachefilePath(key);

    try {
      writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
      logger.debug(`CacheSave: ${key}`);
    } catch (error) {
      logger.error(`SaveCachefailed: ${error}`);
    }
  }

  /**
   * Cache
   */
  get<T>(key: string): T | null {
    const filePath = this.getCachefilePath(key);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // Yes/No
      if (Date.now() > entry.expiresAt) {
        logger.debug(`Cache: ${key}`);
        this.delete(key);
        return null;
      }

      logger.debug(`CacheMedium: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`ReadCachefailed: ${error}`);
      return null;
    }
  }

  /**
   * CacheYes/No
   */
  has(key: string): boolean {
    const filePath = this.getCachefilePath(key);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content);

      // Yes/No
      return Date.now() <= entry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache
   */
  delete(key: string): void {
    const filePath = this.getCachefilePath(key);

    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        logger.debug(`CacheDelete: ${key}`);
      } catch (error) {
        logger.error(`DeleteCachefailed: ${error}`);
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

      logger.debug('AllCacheEmpty');
    } catch (error) {
      logger.error(`EmptyCachefailed: ${error}`);
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
            // Error，Otherfile
          }
        }
      });

      logger.debug(`CleanCache: ${cleanedCount} `);
    } catch (error) {
      logger.error(`CleanCachefailed: ${error}`);
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
