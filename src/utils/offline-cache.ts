import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  /**
   * 缓存数据
   */
  data: T;

  /**
   * 缓存时间
   */
  cachedAt: number;

  /**
   * 过期时间
   */
  expiresAt: number;
}

/**
 * 离线缓存管理器
 */
export class OfflineCacheManager {
  private cacheDir: string;
  private defaultExpireTime: number;

  constructor(cacheDir: string, defaultExpireTime: number = 7 * 24 * 60 * 60 * 1000) {
    this.cacheDir = cacheDir;
    this.defaultExpireTime = defaultExpireTime;

    // 确保缓存目录存在
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
  }

  /**
   * 获取缓存文件路径
   */
  private getCacheFilePath(key: string): string {
    // 对 key 进行简单处理以作为文件名
    const fileName = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.cacheDir, `${fileName}.json`);
  }

  /**
   * 设置缓存
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
      logger.debug(`缓存已保存: ${key}`);
    } catch (error) {
      logger.error(`保存缓存失败: ${error}`);
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const filePath = this.getCacheFilePath(key);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // 检查是否过期
      if (Date.now() > entry.expiresAt) {
        logger.debug(`缓存已过期: ${key}`);
        this.delete(key);
        return null;
      }

      logger.debug(`缓存命中: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`读取缓存失败: ${error}`);
      return null;
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const filePath = this.getCacheFilePath(key);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content);

      // 检查是否过期
      return Date.now() <= entry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    const filePath = this.getCacheFilePath(key);

    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        logger.debug(`缓存已删除: ${key}`);
      } catch (error) {
        logger.error(`删除缓存失败: ${error}`);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          unlinkSync(path.join(this.cacheDir, file));
        }
      });

      logger.debug('所有缓存已清空');
    } catch (error) {
      logger.error(`清空缓存失败: ${error}`);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpired(): void {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      const now = Date.now();
      let cleanedCount = 0;

      files.forEach(file => {
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
            // 忽略错误，继续处理其他文件
          }
        }
      });

      logger.debug(`清理过期缓存: ${cleanedCount} 个`);
    } catch (error) {
      logger.error(`清理过期缓存失败: ${error}`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { count: number; size: number; keys: string[] } {
    try {
      const files = require('fs-extra').readdirSync(this.cacheDir);
      const validKeys: string[] = [];
      let totalSize = 0;
      const now = Date.now();

      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const content = readFileSync(filePath, 'utf-8');
            const entry = JSON.parse(content);

            if (now <= entry.expiresAt) {
              // 恢复原始 key（去掉 .json 后缀）
              const key = file.replace('.json', '').replace(/_/g, '.');
              validKeys.push(key);
              totalSize += content.length;
            }
          } catch (error) {
            // 忽略错误
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
 * 导出便利函数
 */
export function createOfflineCacheManager(
  cacheDir: string,
  defaultExpireTime?: number
): OfflineCacheManager {
  return new OfflineCacheManager(cacheDir, defaultExpireTime);
}
