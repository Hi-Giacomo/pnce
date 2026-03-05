import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { CliError, ErrorCode } from '../utils/errors';

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
  apiServer: 'http://62.234.36.178:3000',
  oauthEndpoint: 'http://62.234.36.178:5173/authorize',
  oauthPort: 3001,
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

    dirs.forEach(dir => {
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
      env.oauthPort = parseInt(process.env.PNCE_OAUTH_PORT);
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
      env.logLevel = process.env.PNCE_LOG_LEVEL as any;
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
   * 设置认证Token
   */
  setAuth(token: string, refreshToken?: string, expiresIn?: number): void {
    const tokenData: Partial<PnceConfig> = {
      token,
      refreshToken,
    };

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
   * 获取当前Token
   */
  getToken(): string | undefined {
    return this.userConfig.token;
  }

  /**
   * 获取刷新Token
   */
  getRefreshToken(): string | undefined {
    return this.userConfig.refreshToken;
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
