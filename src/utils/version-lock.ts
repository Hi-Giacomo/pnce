import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 模块版本锁定文件
 */
export interface VersionLockFile {
  /**
   * 锁定时间
   */
  lockedAt: number;
  /**
   * 模块版本映射
   */
  versions: Record<string, string>;
}

/**
 * 版本锁定管理器
 */
export class VersionLockManager {
  private lockFilePath: string;

  constructor(projectDir: string = process.cwd()) {
    this.lockFilePath = path.join(projectDir, '.pnce', 'versions.lock.json');
  }

  /**
   * 获取锁定文件路径
   */
  getLockFilePath(): string {
    return this.lockFilePath;
  }

  /**
   * 加载锁定文件
   */
  load(): VersionLockFile | null {
    if (!existsSync(this.lockFilePath)) {
      return null;
    }

    try {
      const content = readFileSync(this.lockFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`加载版本锁定文件失败: ${error}`);
      return null;
    }
  }

  /**
   * 保存锁定文件
   */
  save(lockFile: VersionLockFile): void {
    try {
      const dir = path.dirname(this.lockFilePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.lockFilePath, JSON.stringify(lockFile, null, 2), 'utf-8');
      logger.debug(`版本锁定文件已保存: ${this.lockFilePath}`);
    } catch (error) {
      logger.error(`保存版本锁定文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 锁定模块版本
   */
  lock(moduleName: string, version: string): void {
    let lockFile = this.load();

    if (!lockFile) {
      lockFile = {
        lockedAt: Date.now(),
        versions: {},
      };
    }

    lockFile.versions[moduleName] = version;
    this.save(lockFile);

    logger.debug(`锁定模块版本: ${moduleName}@${version}`);
  }

  /**
   * 批量锁定模块版本
   */
  lockBatch(versions: Record<string, string>): void {
    let lockFile = this.load();

    if (!lockFile) {
      lockFile = {
        lockedAt: Date.now(),
        versions: {},
      };
    }

    Object.assign(lockFile.versions, versions);
    this.save(lockFile);

    logger.debug(`批量锁定模块版本: ${Object.keys(versions).join(', ')}`);
  }

  /**
   * 解锁模块版本
   */
  unlock(moduleName: string): void {
    const lockFile = this.load();

    if (!lockFile) {
      return;
    }

    delete lockFile.versions[moduleName];

    if (Object.keys(lockFile.versions).length === 0) {
      // 如果没有锁定的版本，删除锁定文件
      require('fs-extra').removeSync(this.lockFilePath);
      logger.debug(`版本锁定文件已删除（无锁定版本）`);
    } else {
      this.save(lockFile);
    }

    logger.debug(`解锁模块版本: ${moduleName}`);
  }

  /**
   * 解锁所有模块
   */
  unlockAll(): void {
    if (existsSync(this.lockFilePath)) {
      require('fs-extra').removeSync(this.lockFilePath);
      logger.debug(`已解锁所有模块版本`);
    }
  }

  /**
   * 获取锁定的版本
   */
  getLockedVersion(moduleName: string): string | undefined {
    const lockFile = this.load();

    if (!lockFile) {
      return undefined;
    }

    return lockFile.versions[moduleName];
  }

  /**
   * 获取所有锁定的版本
   */
  getAllLockedVersions(): Record<string, string> {
    const lockFile = this.load();

    if (!lockFile) {
      return {};
    }

    return { ...lockFile.versions };
  }

  /**
   * 检查模块是否被锁定
   */
  isLocked(moduleName: string): boolean {
    const version = this.getLockedVersion(moduleName);
    return version !== undefined;
  }

  /**
   * 获取锁定的模块列表
   */
  getLockedModules(): string[] {
    const versions = this.getAllLockedVersions();
    return Object.keys(versions);
  }
}

/**
 * 导出便利函数
 */
export function createVersionLockManager(projectDir?: string): VersionLockManager {
  return new VersionLockManager(projectDir);
}
