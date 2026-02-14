import * as fs from 'fs-extra';
import * as path from 'path';
import { Config } from '../types';
import {
  DEFAULT_REGISTRY_URL,
  DEFAULT_WEBSITE_URL,
  ENV_KEYS,
  CONFIG_FILE_NAME
} from '../config/default.config';

const CONFIG_FILE = CONFIG_FILE_NAME;

export class ConfigService {
  private static configPath: string = path.join(process.cwd(), CONFIG_FILE);

  static getConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      return fs.readJsonSync(this.configPath);
    }
    return {
      registry: process.env[ENV_KEYS.MODULE_REGISTRY] || DEFAULT_REGISTRY_URL,
      website: process.env[ENV_KEYS.MODULE_REGISTRY_WEBSITE] || DEFAULT_WEBSITE_URL,
      authToken: process.env[ENV_KEYS.MODULE_AUTH_TOKEN] || ''
    };
  }

  static saveConfig(config: Config): void {
    fs.writeJsonSync(this.configPath, config, { spaces: 2 });
  }

  static updateConfig(updates: Partial<Config>): Config {
    const config = this.getConfig();
    const newConfig = { ...config, ...updates };
    this.saveConfig(newConfig);
    return newConfig;
  }
}
