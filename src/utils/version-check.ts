import axios from 'axios';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * VersionInfo
 */
export interface VersionInfo {
  /**
   * Version
   */
  version: string;

  /**
   * 
   */
  publishedAt?: string;

  /**
   * 
   */
  changelog?: string;
}

/**
 * Version check
 */
export interface VersionCheckResult {
  /**
   * CurrentVersion
   */
  current: string;

  /**
   * Version
   */
  latest: string;

  /**
   * YesNo
   */
  hasUpdate: boolean;

  /**
   * Type
   */
  updateType: 'major' | 'minor' | 'patch' | 'none';

  /**
   * VersionInfo
   */
  latestInfo?: VersionInfo;
}

/**
 * Version check
 */
export class VersionChecker {
  private npmRegistry: string;

  constructor(npmRegistry: string = 'https://registry.npmjs.org') {
    this.npmRegistry = npmRegistry;
  }

  /**
   * Version
   */
  async check(packageName: string, currentVersion: string): Promise<VersionCheckResult> {
    try {
      logger.debug(`检查Version更新: ${packageName}@${currentVersion}`);

      const response = await axios.get(`${this.npmRegistry}/${packageName}/latest`);
      const latestInfo: VersionInfo = response.data;

      const latestVersion = latestInfo.version;
      const updateType = this.getUpdateType(currentVersion, latestVersion);
      const hasUpdate = updateType !== 'none';

      const result: VersionCheckResult = {
        current: currentVersion,
        latest: latestVersion,
        hasUpdate,
        updateType,
        latestInfo,
      };

      logger.debug(`Version checkComplete: ${hasUpdate ? '有更新' : '已Yes最新'}`);

      return result;
    } catch (error) {
      logger.error(`检查VersionFailed: ${error}`);
      throw new Error(`检查VersionFailed: ${error}`, { cause: error });
    }
  }

  /**
   * Type
   */
  private getUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' | 'none' {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    if (latestParts[0] && currentParts[0] && latestParts[0] > currentParts[0]) {
      return 'major';
    }

    if (latestParts[1] && currentParts[1] && latestParts[1] > currentParts[1]) {
      return 'minor';
    }

    if (latestParts[2] && currentParts[2] && latestParts[2] > currentParts[2]) {
      return 'patch';
    }

    return 'none';
  }

  /**
   * Version
   */
  async getChangelog(packageName: string, version?: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.npmRegistry}/${packageName}`);
      const data = response.data;
      const versions = data.versions;

      if (!versions) {
        return [];
      }

      const entries: string[] = [];

      if (version) {
        // Version
        const versionInfo = versions[version];
        if (versionInfo) {
          entries.push(`${version}: ${versionInfo.description || '无Description'}`);
        }
      } else {
        // AllVersion
        const versionNames = Object.keys(versions).sort().reverse().slice(0, 10);

        for (const v of versionNames) {
          const info = versions[v];
          entries.push(`${v}: ${info.description || '无Description'}`);
        }
      }

      return entries;
    } catch (error) {
      logger.error(`获取变更日志Failed: ${error}`);
      throw new Error(`获取变更日志Failed: ${error}`);
    }
  }
}

/**
 * 
 */
export function createVersionChecker(npmRegistry?: string): VersionChecker {
  return new VersionChecker(npmRegistry);
}
