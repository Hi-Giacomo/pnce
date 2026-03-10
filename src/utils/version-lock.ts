import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * module versionFile
 */
export interface VersionLockFile {
  /**
   * 
   */
  lockedAt: number;
  /**
   * module version
   */
  versions: Record<string, string>;
}

/**
 * Version lock
 */
export class VersionLockManager {
  private lockFilePath: string;

  constructor(projectDir: string = process.cwd()) {
    this.lockFilePath = path.join(projectDir, '.pnce', 'versions.lock.json');
  }

  /**
   * File
   */
  getLockFilePath(): string {
    return this.lockFilePath;
  }

  /**
   * File
   */
  load(): VersionLockFile | null {
    if (!existsSync(this.lockFilePath)) {
      return null;
    }

    try {
      const content = readFileSync(this.lockFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`加载Version lockFileFailed: ${error}`);
      return null;
    }
  }

  /**
   * File
   */
  save(lockFile: VersionLockFile): void {
    try {
      const dir = path.dirname(this.lockFilePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.lockFilePath, JSON.stringify(lockFile, null, 2), 'utf-8');
      logger.debug(`Version lockFile已保存: ${this.lockFilePath}`);
    } catch (error) {
      logger.error(`保存Version lockFileFailed: ${error}`);
      throw error;
    }
  }

  /**
   * module version
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

    logger.debug(`锁定module version: ${moduleName}@${version}`);
  }

  /**
   * module version
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

    logger.debug(`批量锁定module version: ${Object.keys(versions).join(', ')}`);
  }

  /**
   * module version
   */
  unlock(moduleName: string): void {
    const lockFile = this.load();

    if (!lockFile) {
      return;
    }

    delete lockFile.versions[moduleName];

    if (Object.keys(lockFile.versions).length === 0) {
      // Version，File
      require('fs-extra').removeSync(this.lockFilePath);
      logger.debug(`Version lockFile已删除（无锁定Version）`);
    } else {
      this.save(lockFile);
    }

    logger.debug(`解锁module version: ${moduleName}`);
  }

  /**
   * Allmodule
   */
  unlockAll(): void {
    if (existsSync(this.lockFilePath)) {
      require('fs-extra').removeSync(this.lockFilePath);
      logger.debug(`已解锁Allmodule version`);
    }
  }

  /**
   * Version
   */
  getLockedVersion(moduleName: string): string | undefined {
    const lockFile = this.load();

    if (!lockFile) {
      return undefined;
    }

    return lockFile.versions[moduleName];
  }

  /**
   * AllVersion
   */
  getAllLockedVersions(): Record<string, string> {
    const lockFile = this.load();

    if (!lockFile) {
      return {};
    }

    return { ...lockFile.versions };
  }

  /**
   * moduleYesNo
   */
  isLocked(moduleName: string): boolean {
    const version = this.getLockedVersion(moduleName);
    return version !== undefined;
  }

  /**
   * moduleList
   */
  getLockedmodules(): string[] {
    const versions = this.getAllLockedVersions();
    return Object.keys(versions);
  }
}

/**
 * 
 */
export function createVersionLockManager(projectDir?: string): VersionLockManager {
  return new VersionLockManager(projectDir);
}
