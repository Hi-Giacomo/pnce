import axios from 'axios';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 版本信息
 */
export interface VersionInfo {
  /**
   * 版本号
   */
  version: string;

  /**
   * 发布日期
   */
  publishedAt?: string;

  /**
   * 变更日志
   */
  changelog?: string;
}

/**
 * 版本检查结果
 */
export interface VersionCheckResult {
  /**
   * 当前版本
   */
  current: string;

  /**
   * 最新版本
   */
  latest: string;

  /**
   * 是否有更新
   */
  hasUpdate: boolean;

  /**
   * 更新类型
   */
  updateType: 'major' | 'minor' | 'patch' | 'none';

  /**
   * 最新版本信息
   */
  latestInfo?: VersionInfo;
}

/**
 * 版本检查器
 */
export class VersionChecker {
  private npmRegistry: string;

  constructor(npmRegistry: string = 'https://registry.npmjs.org') {
    this.npmRegistry = npmRegistry;
  }

  /**
   * 检查版本更新
   */
  async check(packageName: string, currentVersion: string): Promise<VersionCheckResult> {
    try {
      logger.debug(`检查版本更新: ${packageName}@${currentVersion}`);

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

      logger.debug(`版本检查完成: ${hasUpdate ? '有更新' : '已是最新'}`);

      return result;
    } catch (error) {
      logger.error(`检查版本失败: ${error}`);
      throw new Error(`检查版本失败: ${error}`, { cause: error });
    }
  }

  /**
   * 获取更新类型
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
   * 获取版本变更历史
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
        // 获取特定版本的变更
        const versionInfo = versions[version];
        if (versionInfo) {
          entries.push(`${version}: ${versionInfo.description || '无描述'}`);
        }
      } else {
        // 获取所有版本的变更
        const versionNames = Object.keys(versions).sort().reverse().slice(0, 10);

        for (const v of versionNames) {
          const info = versions[v];
          entries.push(`${v}: ${info.description || '无描述'}`);
        }
      }

      return entries;
    } catch (error) {
      logger.error(`获取变更日志失败: ${error}`);
      throw new Error(`获取变更日志失败: ${error}`, { cause: error });
    }
  }
}

/**
 * 导出便利函数
 */
export function createVersionChecker(npmRegistry?: string): VersionChecker {
  return new VersionChecker(npmRegistry);
}
