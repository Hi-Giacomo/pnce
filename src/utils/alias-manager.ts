import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Aliasfile
 */
export interface AliasConfig {
  /**
   * Alias
   */
  aliases: Record<string, string>;
}

/**
 * Alias
 */
export class AliasManager {
  private configPath: string;
  private config: AliasConfig;

  constructor(configDir?: string) {
    const configBaseDir = configDir || path.join(require('os').homedir(), '.pnce');
    this.configPath = path.join(configBaseDir, 'aliases.json');
    this.config = this.loadConfig();
  }

  /**
   * Alias
   */
  private loadConfig(): AliasConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`LoadAliasConfigurefailed: ${error}`);
    }

    return { aliases: {} };
  }

  /**
   * Alias
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.debug('AliasConfigureSave');
    } catch (error) {
      logger.error(`SaveAliasConfigurefailed: ${error}`);
      throw error;
    }
  }

  /**
   * Add alias
   * @param alias - Alias
   * @param command - command
   */
  add(alias: string, command: string): void {
    this.config.aliases[alias] = command;
    this.saveConfig();
    logger.info(`Alias: ${alias} -> ${command}`);
  }

  /**
   * Alias
   * @param alias - Alias
   */
  remove(alias: string): void {
    if (this.config.aliases[alias]) {
      delete this.config.aliases[alias];
      this.saveConfig();
      logger.info(`Alias: ${alias}`);
    }
  }

  /**
   * Alias
   * @param args - command
   * @returns command
   */
  resolve(args: string[]): string[] {
    const command = args[0];
    const alias = command !== undefined ? this.config.aliases[command] : undefined;

    if (alias) {
      // Aliascommand
      const aliasParts = alias.split(' ');
      const result = [...aliasParts, ...args.slice(1)];
      logger.debug(`Alias: ${command} -> ${result.join(' ')}`);
      return result;
    }

    return args;
  }

  /**
   * commandYes/NoAlias
   */
  isAlias(command: string): boolean {
    return !!this.config.aliases[command];
  }

  /**
   * AllAlias
   */
  list(): Record<string, string> {
    return { ...this.config.aliases };
  }

  /**
   * AllAlias
   */
  clear(): void {
    this.config.aliases = {};
    this.saveConfig();
    logger.info('AllAliasEmpty');
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

/**
 * GlobalAlias
 */
let aliasManagerInstance: AliasManager | null = null;

/**
 * Alias
 */
export function getAliasManager(): AliasManager {
  if (!aliasManagerInstance) {
    aliasManagerInstance = new AliasManager();
  }
  return aliasManagerInstance;
}

/**
 * Alias
 */
export function createAliasManager(configDir?: string): AliasManager {
  return new AliasManager(configDir);
}
