import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * module versionfile
 */
export interface versionLockfile {
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
 * version lock
 */
export class versionLockManager {
  private lockfilePath: string;

  constructor(projectDir: string = process.cwd()) {
    this.lockfilePath = path.join(projectDir, '.pnce', 'versions.lock.json');
  }

  /**
   * file
   */
  getLockfilePath(): string {
    return this.lockfilePath;
  }

  /**
   * file
   */
  load(): versionLockfile | null {
    if (!existsSync(this.lockfilePath)) {
      return null;
    }

    try {
      const content = readFileSync(this.lockfilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Loadversion lockfilefailed: ${error}`);
      return null;
    }
  }

  /**
   * file
   */
  save(lockfile: versionLockfile): void {
    try {
      const dir = path.dirname(this.lockfilePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.lockfilePath, JSON.stringify(lockfile, null, 2), 'utf-8');
      logger.debug(`version lockfileSave: ${this.lockfilePath}`);
    } catch (error) {
      logger.error(`Saveversion lockfilefailed: ${error}`);
      throw error;
    }
  }

  /**
   * module version
   */
  lock(moduleName: string, version: string): void {
    let lockfile = this.load();

    if (!lockfile) {
      lockfile = {
        lockedAt: Date.now(),
        versions: {},
      };
    }

    lockfile.versions[moduleName] = version;
    this.save(lockfile);

    logger.debug(`module version: ${moduleName}@${version}`);
  }

  /**
   * module version
   */
  lockBatch(versions: Record<string, string>): void {
    let lockfile = this.load();

    if (!lockfile) {
      lockfile = {
        lockedAt: Date.now(),
        versions: {},
      };
    }

    Object.assign(lockfile.versions, versions);
    this.save(lockfile);

    logger.debug(`module version: ${Object.keys(versions).join(', ')}`);
  }

  /**
   * module version
   */
  unlock(moduleName: string): void {
    const lockfile = this.load();

    if (!lockfile) {
      return;
    }

    delete lockfile.versions[moduleName];

    if (Object.keys(lockfile.versions).length === 0) {
      // version，file
      require('fs-extra').removeSync(this.lockfilePath);
      logger.debug(`version lockfileDelete（version）`);
    } else {
      this.save(lockfile);
    }

    logger.debug(`module version: ${moduleName}`);
  }

  /**
   * All modules
   */
  unlockAll(): void {
    if (existsSync(this.lockfilePath)) {
      require('fs-extra').removeSync(this.lockfilePath);
      logger.debug(`All modules version`);
    }
  }

  /**
   * version
   */
  getLockedversion(moduleName: string): string | undefined {
    const lockfile = this.load();

    if (!lockfile) {
      return undefined;
    }

    return lockfile.versions[moduleName];
  }

  /**
   * Allversion
   */
  getAllLockedversions(): Record<string, string> {
    const lockfile = this.load();

    if (!lockfile) {
      return {};
    }

    return { ...lockfile.versions };
  }

  /**
   * moduleYes/No
   */
  isLocked(moduleName: string): boolean {
    const version = this.getLockedversion(moduleName);
    return version !== undefined;
  }

  /**
   * module list
   */
  getLockedmodules(): string[] {
    const versions = this.getAllLockedversions();
    return Object.keys(versions);
  }
}

/**
 *
 */
export function createversionLockManager(projectDir?: string): versionLockManager {
  return new versionLockManager(projectDir);
}
