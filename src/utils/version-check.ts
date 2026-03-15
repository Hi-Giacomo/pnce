import axios from 'axios';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * versionInfo
 */
export interface versionInfo {
  /**
   * version
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
 * version check
 */
export interface versioncheckResult {
  /**
   * Currentversion
   */
  current: string;

  /**
   * version
   */
  latest: string;

  /**
   * Yes/No
   */
  hasUpdate: boolean;

  /**
   * Type
   */
  updateType: 'major' | 'minor' | 'patch' | 'none';

  /**
   * versionInfo
   */
  latestInfo?: versionInfo;
}

/**
 * version check
 */
export class versionchecker {
  private npmRegistry: string;

  constructor(npmRegistry: string = 'https://registry.npmjs.org') {
    this.npmRegistry = npmRegistry;
  }

  /**
   * version
   */
  async check(packageName: string, currentversion: string): Promise<versioncheckResult> {
    try {
      logger.debug(`checkversionUpdate: ${packageName}@${currentversion}`);

      const response = await axios.get(`${this.npmRegistry}/${packageName}/latest`);
      const latestInfo: versionInfo = response.data;

      const latestversion = latestInfo.version;
      const updateType = this.getUpdateType(currentversion, latestversion);
      const hasUpdate = updateType !== 'none';

      const result: versioncheckResult = {
        current: currentversion,
        latest: latestversion,
        hasUpdate,
        updateType,
        latestInfo,
      };

      logger.debug(`version checkComplete: ${hasUpdate ? 'Update' : 'YesLatest'}`);

      return result;
    } catch (error) {
      logger.error(`checkversionfailed: ${error}`);
      throw new Error(`checkversionfailed: ${error}`, { cause: error });
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
   * version
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
        // version
        const versionInfo = versions[version];
        if (versionInfo) {
          entries.push(`${version}: ${versionInfo.description || 'Description'}`);
        }
      } else {
        // Allversion
        const versionNames = Object.keys(versions).sort().reverse().slice(0, 10);

        for (const v of versionNames) {
          const info = versions[v];
          entries.push(`${v}: ${info.description || 'Description'}`);
        }
      }

      return entries;
    } catch (error) {
      logger.error(`GetLogfailed: ${error}`);
      throw new Error(`GetLogfailed: ${error}`);
    }
  }
}

/**
 *
 */
export function createversionchecker(npmRegistry?: string): versionchecker {
  return new versionchecker(npmRegistry);
}
