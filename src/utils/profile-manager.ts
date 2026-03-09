import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import type { PnceConfig } from '../config/manager';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 配置档案
 */
export interface ConfigProfile {
  /**
   * 档案名称
   */
  name: string;

  /**
   * 档案配置
   */
  config: PnceConfig;

  /**
   * 创建时间
   */
  createdAt: number;

  /**
   * 更新时间
   */
  updatedAt: number;
}

/**
 * 配置档案管理器
 */
export class ProfileManager {
  private profilesDir: string;
  private currentProfileFile: string;

  constructor(configDir?: string) {
    const configBaseDir = configDir || path.join(require('os').homedir(), '.pnce');
    this.profilesDir = path.join(configBaseDir, 'profiles');
    this.currentProfileFile = path.join(configBaseDir, '.current-profile');

    // 确保档案目录存在
    if (!existsSync(this.profilesDir)) {
      mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * 保存当前配置为档案
   * @param name - 档案名称
   * @param config - 配置
   */
  save(name: string, config: PnceConfig): void {
    try {
      const profile: ConfigProfile = {
        name,
        config,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const profilePath = this.getProfilePath(name);
      writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');

      logger.info(`配置档案已保存: ${name}`);
    } catch (error) {
      logger.error(`保存配置档案失败: ${error}`);
      throw error;
    }
  }

  /**
   * 加载档案
   * @param name - 档案名称
   */
  load(name: string): PnceConfig | null {
    try {
      const profilePath = this.getProfilePath(name);

      if (!existsSync(profilePath)) {
        logger.warn(`配置档案不存在: ${name}`);
        return null;
      }

      const content = readFileSync(profilePath, 'utf-8');
      const profile: ConfigProfile = JSON.parse(content);

      return profile.config;
    } catch (error) {
      logger.error(`加载配置档案失败: ${error}`);
      return null;
    }
  }

  /**
   * 删除档案
   * @param name - 档案名称
   */
  delete(name: string): void {
    try {
      const profilePath = this.getProfilePath(name);

      if (!existsSync(profilePath)) {
        logger.warn(`配置档案不存在: ${name}`);
        return;
      }

      unlinkSync(profilePath);

      // 如果是当前档案，清除当前档案标记
      if (this.getCurrent() === name) {
        this.clearCurrent();
      }

      logger.info(`配置档案已删除: ${name}`);
    } catch (error) {
      logger.error(`删除配置档案失败: ${error}`);
      throw error;
    }
  }

  /**
   * 列出所有档案
   */
  list(): ConfigProfile[] {
    try {
      const fs = require('fs-extra');
      const files = fs.readdirSync(this.profilesDir);

      const profiles: ConfigProfile[] = [];

      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          try {
            const profilePath = path.join(this.profilesDir, file);
            const content = readFileSync(profilePath, 'utf-8');
            const profile: ConfigProfile = JSON.parse(content);
            profiles.push(profile);
          } catch (error) {
            logger.debug(
              `加载档案失败: ${file}`,
              error instanceof Error ? { error } : { error: String(error) }
            );
          }
        }
      });

      // 按更新时间排序
      return profiles.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      logger.error(`列出配置档案失败: ${error}`);
      return [];
    }
  }

  /**
   * 设置当前档案
   * @param name - 档案名称
   */
  setCurrent(name: string): void {
    try {
      writeFileSync(this.currentProfileFile, name, 'utf-8');
      logger.info(`当前档案已设置: ${name}`);
    } catch (error) {
      logger.error(`设置当前档案失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取当前档案名称
   */
  getCurrent(): string | null {
    try {
      if (!existsSync(this.currentProfileFile)) {
        return null;
      }

      const content = readFileSync(this.currentProfileFile, 'utf-8');
      const name = content.trim();

      // 检查档案是否存在
      if (!existsSync(this.getProfilePath(name))) {
        this.clearCurrent();
        return null;
      }

      return name;
    } catch (error) {
      logger.error(`获取当前档案失败: ${error}`);
      return null;
    }
  }

  /**
   * 清除当前档案标记
   */
  clearCurrent(): void {
    try {
      if (existsSync(this.currentProfileFile)) {
        unlinkSync(this.currentProfileFile);
        logger.info('当前档案标记已清除');
      }
    } catch (error) {
      logger.error(`清除当前档案标记失败: ${error}`);
    }
  }

  /**
   * 重命名档案
   * @param oldName - 旧名称
   * @param newName - 新名称
   */
  rename(oldName: string, newName: string): void {
    try {
      const oldPath = this.getProfilePath(oldName);
      const newPath = this.getProfilePath(newName);

      if (!existsSync(oldPath)) {
        throw new Error(`配置档案不存在: ${oldName}`);
      }

      // 更新档案名称
      const content = readFileSync(oldPath, 'utf-8');
      const profile: ConfigProfile = JSON.parse(content);
      profile.name = newName;
      profile.updatedAt = Date.now();

      writeFileSync(newPath, JSON.stringify(profile, null, 2), 'utf-8');
      unlinkSync(oldPath);

      // 如果是当前档案，更新当前档案标记
      if (this.getCurrent() === oldName) {
        this.setCurrent(newName);
      }

      logger.info(`配置档案已重命名: ${oldName} -> ${newName}`);
    } catch (error) {
      logger.error(`重命名配置档案失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取档案路径
   * @param name - 档案名称
   */
  private getProfilePath(name: string): string {
    return path.join(this.profilesDir, `${name}.json`);
  }

  /**
   * 获取档案目录路径
   */
  getProfilesDir(): string {
    return this.profilesDir;
  }
}

/**
 * 全局档案管理器实例
 */
let profileManagerInstance: ProfileManager | null = null;

/**
 * 获取档案管理器实例
 */
export function getProfileManager(): ProfileManager {
  if (!profileManagerInstance) {
    profileManagerInstance = new ProfileManager();
  }
  return profileManagerInstance;
}

/**
 * 创建档案管理器实例
 */
export function createProfileManager(configDir?: string): ProfileManager {
  return new ProfileManager(configDir);
}
