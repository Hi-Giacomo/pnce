import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { CliError, ErrorCode, CryptoUtil } from '../utils';

/**
 * Configuration Interface
 */
export interface PnceConfig {
  /**
   * API Server URL
   */
  apiServer: string;

  /**
   * OAuth2 authorization Endpoint
   */
  oauthEndpoint: string;

  /**
   * OAuth2 Callback Port
   */
  oauthPort: number;

  /**
   * User Authentication Token
   */
  token?: string;

  /**
   * Token Expiration Time
   */
  tokenExpiresAt?: number;

  /**
   * Refresh Token
   */
  refreshToken?: string;

  /**
   * Default Output Directory
   */
  outputDir: string;

  /**
   * Use Proxy
   */
  useProxy: boolean;

  /**
   * Proxy URL
   */
  proxyUrl?: string;

  /**
   * Download Timeout (ms)
   */
  downloadTimeout: number;

  /**
   * Upload Timeout (ms)
   */
  uploadTimeout: number;

  /**
   * Concurrent Downloads
   */
  maxConcurrentDownloads: number;

  /**
   * Enable Cache
   */
  enableCache: boolean;

  /**
   * Cache Directory
   */
  cacheDir: string;

  /**
   * Cache Expiration Time (ms)
   */
  cacheExpireTime: number;

  /**
   * Log Level
   */
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  /**
   * Verbose Logging
   */
  verbose: boolean;
}

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: PnceConfig = {
  apiServer: process.env.PNCE_API_SERVER || 'http://localhost:3000',
  oauthEndpoint: process.env.PNCE_OAUTH_ENDPOINT || 'http://localhost:5173/authorize',
  oauthPort: parseInt(process.env.PNCE_OAUTH_PORT || '3001'),
  outputDir: process.cwd(),
  useProxy: false,
  downloadTimeout: 300000, // 5
  uploadTimeout: 600000, // 10
  maxConcurrentDownloads: 3,
  enableCache: true,
  cacheDir: path.join(os.homedir(), '.pnce', 'cache'),
  cacheExpireTime: 7 * 24 * 60 * 60 * 1000, // 7
  logLevel: 'info',
  verbose: false,
};

/**
 * Configuration Priority:  > User > Default Configuration
 */
export class ConfigManager {
  private userConfigPath: string;
  private projectConfigPath: string;
  private userConfig: Partial<PnceConfig> = {};
  private projectConfig: Partial<PnceConfig> = {};

  constructor() {
    // User Configuration Directory
    const userConfigDir = path.join(os.homedir(), '.pnce');
    this.userConfigPath = path.join(userConfigDir, 'config.json');

    // Project Configuration Directory
    this.projectConfigPath = path.join(process.cwd(), '.pnce', 'config.json');

    // Directory
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
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
   * Load user configuration
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
      console.warn(`Load user configurationFailed: ${error}`);
      return {};
    }
  }

  /**
   * Load project configuration
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
      console.warn(`Load project configurationFailed: ${error}`);
      return {};
    }
  }

  /**
   * Load environment variable configuration
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
   * Load all configurations
   */
  loadAll(): void {
    this.userConfig = this.loadUserConfig();
    this.projectConfig = this.loadProjectConfig();
  }

  /**
   * Get merged configuration
   * : Environment variables >  > User > Default Configuration
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
   * Get specific configuration item
   */
  get<K extends keyof PnceConfig>(key: K): PnceConfig[K] {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * Set user configuration
   */
  setUserConfig(config: Partial<PnceConfig>): void {
    this.userConfig = { ...this.userConfig, ...config };
    this.saveUserConfig();
  }

  /**
   * Set project configuration
   */
  setProjectConfig(config: Partial<PnceConfig>): void {
    this.projectConfig = { ...this.projectConfig, ...config };
    this.saveProjectConfig();
  }

  /**
   * Save user configuration
   */
  private saveUserConfig(): void {
    try {
      writeFileSync(this.userConfigPath, JSON.stringify(this.userConfig, null, 2), 'utf-8');
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `Save user configurationFailed: ${error}`);
    }
  }

  /**
   * Save project configuration
   */
  private saveProjectConfig(): void {
    try {
      const projectDir = path.dirname(this.projectConfigPath);
      if (!existsSync(projectDir)) {
        mkdirSync(projectDir, { recursive: true });
      }
      writeFileSync(this.projectConfigPath, JSON.stringify(this.projectConfig, null, 2), 'utf-8');
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `Save project configurationFailed: ${error}`);
    }
  }

  /**
   * Clear user configuration
   */
  clearUserConfig(): void {
    this.userConfig = {};
    if (existsSync(this.userConfigPath)) {
      require('fs-extra').removeSync(this.userConfigPath);
    }
  }

  /**
   * Clear project configuration
   */
  clearProjectConfig(): void {
    this.projectConfig = {};
    const projectDir = path.dirname(this.projectConfigPath);
    if (existsSync(projectDir)) {
      require('fs-extra').removeSync(projectDir);
    }
  }

  /**
   * Set authentication token (encrypted storage)
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
   * Clear authentication information
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
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiresAt = this.userConfig.tokenExpiresAt;
    if (!expiresAt) return false;

    // 5Token expired
    return Date.now() > expiresAt - 5 * 60 * 1000;
  }

  /**
   * Get current token (decrypted)
   */
  getToken(): string | undefined {
    const encryptedToken = this.userConfig.token;
    if (!encryptedToken) return undefined;

    try {
      return CryptoUtil.decrypt(encryptedToken);
    } catch (error) {
      console.warn('Failed to decrypt token:', error);
      return undefined;
    }
  }

  /**
   * Refresh Token（）
   */
  getRefreshToken(): string | undefined {
    const encryptedToken = this.userConfig.refreshToken;
    if (!encryptedToken) return undefined;

    try {
      return CryptoUtil.decrypt(encryptedToken);
    } catch (error) {
      console.warn('Failed to decrypt refresh token:', error);
      return undefined;
    }
  }

  /**
   * Get configuration file path
   */
  getUserConfigPath(): string {
    return this.userConfigPath;
  }

  getProjectConfigPath(): string {
    return this.projectConfigPath;
  }

  /**
   * Get configuration profile directory
   */
  private getProfilesDir(): string {
    return path.join(os.homedir(), '.pnce', 'profiles');
  }

  /**
   * Switch to specified configuration profile
   * @param profileName 
   */
  switchProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();
    const profilePath = path.join(profilesDir, `${profileName}.json`);

    if (!existsSync(profilePath)) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `Configuration profile "${profileName}" does not exist`);
    }

    // 
    try {
      const content = require('fs-extra').readFileSync(profilePath, 'utf-8');
      const profileConfig = JSON.parse(content);

      // Current
      const backupPath = path.join(profilesDir, 'backup.json');
      require('fs-extra').writeFileSync(
        backupPath,
        JSON.stringify(this.userConfig, null, 2),
        'utf-8'
      );

      // 
      this.userConfig = profileConfig;
      this.saveUserConfig();

      console.log(`✅ 已切换到Configuration profile: ${profileName}`);
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `加载Configuration profileFailed: ${error}`);
    }
  }

  /**
   * Save current configuration as profile
   * @param profileName 
   */
  saveProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();

    // Directory
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
      console.log(`✅ 已保存Configuration profile: ${profileName}`);
    } catch (error) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `保存Configuration profileFailed: ${error}`);
    }
  }

  /**
   * List all configuration profiles
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
   * Delete configuration profile
   * @param profileName 
   */
  deleteProfile(profileName: string): void {
    const profilesDir = this.getProfilesDir();
    const profilePath = path.join(profilesDir, `${profileName}.json`);

    if (!existsSync(profilePath)) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `Configuration profile "${profileName}" does not exist`);
    }

    try {
      require('fs-extra').removeSync(profilePath);
      console.log(`✅ 已Delete configuration profile: ${profileName}`);
    } catch (error: unknown) {
      throw new CliError(ErrorCode.CONFIG_ERROR, `Delete configuration profileFailed: ${error}`);
    }
  }
}

/**
 * Global configuration manager instance
 */
let configManager: ConfigManager | null = null;

/**
 * Get configuration manager instance
 */
export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
    configManager.loadAll();
  }

  return configManager;
}

/**
 * Get configuration
 */
export function getConfig(): PnceConfig {
  return getConfigManager().getConfig();
}

/**
 * Reset configuration manager (mainly for testing)
 */
export function resetConfigManager(): void {
  configManager = null;
}
