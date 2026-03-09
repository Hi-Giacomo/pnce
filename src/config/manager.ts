import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { CliError, ErrorCode, CryptoUtil } from '../utils';

/**
 * 配置接口
 */
export interface PnceConfig {
  /**
   * API服务器地址
   */
  apiServer: string;

  /**
   * OAuth2授权端点
   */
  oauthEndpoint: string;

  /**
   * OAuth2回调端口
   */
  oauthPort: number;

  /**
   * 用户认证Token
   */
  token?: string;

  /**
   * Token过期时间
   */
  tokenExpiresAt?: number;

  /**
   * 刷新Token
   */
  refreshToken?: string;

  /**
   * 默认输出目录
   */
  outputDir: string;

  /**
   * 是否使用代理
   */
  useProxy: boolean;

  /**
   * 代理地址
   */
  proxyUrl?: string;

  /**
   * 下载超时时间（毫秒）
   */
  downloadTimeout: number;

  /**
   * 上传超时时间（毫秒）
   */
  uploadTimeout: number;

  /**
   * 并发下载数量
   */
  maxConcurrentDownloads: number;

  /**
   * 是否启用缓存
   */
  enableCache: boolean;

  /**
   * 缓存目录
   */
  cacheDir: string;

  /**
   * 缓存过期时间（毫秒）
   */
  cacheExpireTime: number;

  /**
   * 日志级别
   */
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  /**
   * 是否显示详细日志
   */
  verbose: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: PnceConfig = {
  apiServer: process.env.PNCE_API_SERVER || 'http://localhost:3000',
  oauthEndpoint: process.env.PNCE_OAUTH_ENDPOINT || 'http://localhost:5173/authorize',
  oauthPort: parseInt(process.env.PNCE_OAUTH_PORT || '3001'),
  outputDir: process.cwd(),
  useProxy: false,
  downloadTimeout: 300000, // 5分钟
  uploadTimeout: 600000, // 10分钟
  maxConcurrentDownloads: 3,
  enableCache: true,
  cacheDir: path.join(os.homedir(), '.pnce', 'cache'),
  cacheExpireTime: 7 * 24 * 60 * 60 * 1000, // 7天
  logLevel: 'info',
  verbose: false,
};

/**
 * 配置优先级: 项目配置 > 用户配置 > 默认配置
 */
export class ConfigManager {
  private userConfigPath: string;
  private projectConfigPath: string;
  private userConfig: Partial<PnceConfig> = {};
  private projectConfig: Partial<PnceConfig> = {};

  constructor() {
    // 用户配置目录
    const userConfigDir = path.join(os.homedir(), '.pnce');
    this.userConfigPath = path.join(userConfigDir, 'config.json');

    // 项目配置目录
    this.projectConfigPath = path.join(process.cwd(), '.pnce', 'config.json');

    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.userConfigPath),
      path.dirname(this.projectConfigPath),
      DEFAULT_CONFIG.cacheDir,
    ];

    dirs.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载用户配置
   */
  private loadUserConfig(): Partial<PnceConfig> {
    if (!existsSync(this.userConfigPath)) {
      return {};
    }

    try {
      const content = readFileSync(this.userConfigPath, 'utf-8');
      const config = JSON.parse(content);
      return config;
    } catch (error) {
      console.warn(`加载用户配置失败: ${error}`);
      return {};
    }
  }

  /**
   * 加载项目配置
   */
  private loadProjectConfig(): Partial<PnceConfig> {
    if (!existsSync(this.projectConfigPath)) {
      return {};
    }

    try {
      const content = readFileSync(this.projectConfigPath, 'utf-8');
      const config = JSON.parse(content);
      return config;
    } catch (error) {
      console.warn(`加载项目配置失败: ${error}`);
      return {};
    }
  }

  /**
   * 加载环境变量配置
   */
  private loadEnvConfig(): Partial<PnceConfig> {
    const env: Partial<PnceConfig> = {};

    if (process.env.PNCE_API_SERVER) {
      env.apiServer = process.env.PNCE_API_SERVER;
    }

    if (process.env.PNCE_OAUTH_ENDPOINT) {
      env.oauthEndpoint = process.env.PNCE_OAUTH_ENDPOINT;
    }

    if (process.env.PNCE_OAUTH_PORT) {
      const port = parseInt(process.env.PNCE_OAUTH_PORT);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        env.oauthPort = port;
      }
    }

    if (process.env.PNCE_TOKEN) {
      env.token = process.env.PNCE_TOKEN;
    }

    if (process.env.PNCE_OUTPUT_DIR) {
      env.outputDir = process.env.PNCE_OUTPUT_DIR;
    }

    if (process.env.PNCE_PROXY_URL) {
      env.useProxy = true;
      env.proxyUrl = process.env.PNCE_PROXY_URL;
    }

    if (process.env.PNCE_LOG_LEVEL) {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      const logLevel = process.env.PNCE_LOG_LEVEL.toLowerCase();
      if (validLevels.includes(logLevel)) {
        env.logLevel = logLevel as 'error' | 'warn' | 'info' | 'debug';
      } else {
        console.warn(
          `Invalid PNCE_LOG_LEVEL: ${process.env.PNCE_LOG_LEVEL}. Valid values are: ${validLevels.join(', ')}`
        );
      }
    }

    if (process.env.PNCE_VERBOSE) {
      env.verbose = process.env.PNCE_VERBOSE === 'true';
    }

    if (process.env.PNCE_NO_CACHE) {
      env.enableCache = false;
    }

    return env;
  }

  /**
   * 加载所有配置
   */
  loadAll(): void {
    this.userConfig = this.loadUserConfig();
    this.projectConfig = this.loadProjectConfig();
  }

  /**
   * 获取合并后的配置
   * 优先级: 环境变量 > 项目配置 > 用户配置 > 默认配置
   */
  getConfig(): PnceConfig {
    const envConfig = this.loadEnvConfig();

    return {
      ...DEFAULT_CONFIG,
      ...this.userConfig,
      ...this.projectConfig,
      ...envConfig,
    };
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof PnceConfig>(key: K): PnceConfig[K] {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * 设置用户配置
   */
  setUserConfig(config: Partial<PnceConfig>): void {
    this.userConfig = { ...this.userConfig, ...config };
    this.saveUserConfig();
  }

  /**
   * 设置项目配置
   */
  setProjectConfig(config: Partial<PnceConfig>): void {
    this.projectConfig = { ...this.projectConfig, ...config };
    this.saveProjectConfig();
  }

  /**
   * 保存用户配置
   */
  private saveUserConfig(): void {
    try {
      writeFileSync(this.userConfigPath, JSON.stringify(this.userConfig, null, 2), 'utf-8');
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `保存用户配置失败: ${error}`);
    }
  }

  /**
   * 保存项目配置
   */
  private saveProjectConfig(): void {
    try {
      const projectDir = path.dirname(this.projectConfigPath);
      if (!existsSync(projectDir)) {
        mkdirSync(projectDir, { recursive: true });
      }
      writeFileSync(this.projectConfigPath, JSON.stringify(this.projectConfig, null, 2), 'utf-8');
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `保存项目配置失败: ${error}`);
    }
  }

  /**
   * 清除用户配置
   */
  clearUserConfig(): void {
    this.userConfig = {};
    if (existsSync(this.userConfigPath)) {
      require('fs-extra').removeSync(this.userConfigPath);
    }
  }

  /**
   * 清除项目配置
   */
  clearProjectConfig(): void {
    this.projectConfig = {};
    const projectDir = path.dirname(this.projectConfigPath);
    if (existsSync(projectDir)) {
      require('fs-extra').removeSync(projectDir);
    }
  }

  /**
   * 设置认证Token（加密存储）
   */
  setAuth(token: string, refreshToken?: string, expiresIn?: number): void {
    const tokenData: Partial<PnceConfig> = {
      token: CryptoUtil.encrypt(token),
    };

    if (refreshToken) {
      tokenData.refreshToken = CryptoUtil.encrypt(refreshToken);
    }

    if (expiresIn) {
      tokenData.tokenExpiresAt = Date.now() + expiresIn * 1000;
    }

    this.setUserConfig(tokenData);
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    const config = { ...this.userConfig };
    delete config.token;
    delete config.refreshToken;
    delete config.tokenExpiresAt;
    this.userConfig = config;
    this.saveUserConfig();
  }

  /**
   * 检查Token是否过期
   */
  isTokenExpired(): boolean {
    const expiresAt = this.userConfig.tokenExpiresAt;
    if (!expiresAt) return false;

    // 提前5分钟认为Token已过期
    return Date.now() > expiresAt - 5 * 60 * 1000;
  }

  /**
   * 获取当前Token（解密后返回）
   */
  getToken(): string | undefined {
    const encryptedToken = this.userConfig.token;
    if (!encryptedToken) return undefined;

    try {
      return CryptoUtil.decrypt(encryptedToken);
    } catch (error) {
      console.warn('解密 Token 失败:', error);
      return undefined;
    }
  }

  /**
   * 获取刷新Token（解密后返回）
   */
  getRefreshToken(): string | undefined {
    const encryptedToken = this.userConfig.refreshToken;
    if (!encryptedToken) return undefined;

    try {
      return CryptoUtil.decrypt(encryptedToken);
    } catch (error) {
      console.warn('解密 Refresh Token 失败:', error);
      return undefined;
    }
  }

  /**
   * 获取配置文件路径
   */
  getUserConfigPath(): string {
    return this.userConfigPath;
  }

  getProjectConfigPath(): string {
    return this.projectConfigPath;
  }

  /**
   * 获取配置档案目录
   */
  private getProfilesDir(): string {
    return path.join(os.homedir(), '.pnce', 'profiles');
  }

  /**
   * 切换到指定配置档案
   * @param profileName 档案名称
   */
  switchProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();
    const profilePath = path.join(profilesDir, `${profileName}.json`);

    if (!existsSync(profilePath)) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `配置档案 "${profileName}" 不存在`);
    }

    // 读取档案内容
    try {
      const content = require('fs-extra').readFileSync(profilePath, 'utf-8');
      const profileConfig = JSON.parse(content);

      // 备份当前配置
      const backupPath = path.join(profilesDir, 'backup.json');
      require('fs-extra').writeFileSync(
        backupPath,
        JSON.stringify(this.userConfig, null, 2),
        'utf-8'
      );

      // 应用档案配置
      this.userConfig = profileConfig;
      this.saveUserConfig();

      console.log(`✅ 已切换到配置档案: ${profileName}`);
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `加载配置档案失败: ${error}`);
    }
  }

  /**
   * 保存当前配置为档案
   * @param profileName 档案名称
   */
  saveProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();

    // 确保目录存在
    if (!existsSync(profilesDir)) {
      require('fs-extra').mkdirSync(profilesDir, { recursive: true });
    }

    const profilePath = path.join(profilesDir, `${profileName}.json`);

    try {
      require('fs-extra').writeFileSync(
        profilePath,
        JSON.stringify(this.userConfig, null, 2),
        'utf-8'
      );
      console.log(`✅ 已保存配置档案: ${profileName}`);
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `保存配置档案失败: ${error}`);
    }
  }

  /**
   * 列出所有配置档案
   */
  listProfiles(): string[] {
    const profilesDir = this.getProfilesDir();

    if (!existsSync(profilesDir)) {
      return [];
    }

    try {
      const files = require('fs-extra').readdirSync(profilesDir);
      return files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * 删除配置档案
   * @param profileName 档案名称
   */
  deleteProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();
    const profilePath = path.join(profilesDir, `${profileName}.json`);

    if (!existsSync(profilePath)) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `配置档案 "${profileName}" 不存在`);
    }

    try {
      require('fs-extra').removeSync(profilePath);
      console.log(`✅ 已删除配置档案: ${profileName}`);
    } catch (error: unknown) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `删除配置档案失败: ${error}`);
    }
  }
}

/**
 * 全局配置管理器实例
 */
let configManager: ConfigManager | null = null;

/**
 * 获取配置管理器实例
 */
export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
    configManager.loadAll();
  }

  return configManager;
}

/**
 * 获取配置
 */
export function getConfig(): PnceConfig {
  return getConfigManager().getConfig();
}

/**
 * 重置配置管理器（主要用于测试）
 */
export function resetConfigManager(): void {
  configManager = null;
}
