import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 别名配置文件
 */
export interface AliasConfig {
  /**
   * 别名映射
   */
  aliases: Record<string, string>;
}

/**
 * 别名管理器
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
   * 加载别名配置
   */
  private loadConfig(): AliasConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`加载别名配置失败: ${error}`);
    }

    return { aliases: {} };
  }

  /**
   * 保存别名配置
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.debug('别名配置已保存');
    } catch (error) {
      logger.error(`保存别名配置失败: ${error}`);
      throw error;
    }
  }

  /**
   * 添加别名
   * @param alias - 别名
   * @param command - 原始命令
   */
  add(alias: string, command: string): void {
    this.config.aliases[alias] = command;
    this.saveConfig();
    logger.info(`别名已添加: ${alias} -> ${command}`);
  }

  /**
   * 移除别名
   * @param alias - 别名
   */
  remove(alias: string): void {
    if (this.config.aliases[alias]) {
      delete this.config.aliases[alias];
      this.saveConfig();
      logger.info(`别名已移除: ${alias}`);
    }
  }

  /**
   * 解析别名
   * @param args - 命令参数
   * @returns 解析后的命令参数
   */
  resolve(args: string[]): string[] {
    const command = args[0];
    const alias = this.config.aliases[command];

    if (alias) {
      // 替换别名为原始命令
      const aliasParts = alias.split(' ');
      const result = [...aliasParts, ...args.slice(1)];
      logger.debug(`别名已解析: ${command} -> ${result.join(' ')}`);
      return result;
    }

    return args;
  }

  /**
   * 检查命令是否为别名
   */
  isAlias(command: string): boolean {
    return !!this.config.aliases[command];
  }

  /**
   * 获取所有别名
   */
  list(): Record<string, string> {
    return { ...this.config.aliases };
  }

  /**
   * 清空所有别名
   */
  clear(): void {
    this.config.aliases = {};
    this.saveConfig();
    logger.info('所有别名已清空');
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

/**
 * 全局别名管理器实例
 */
let aliasManagerInstance: AliasManager | null = null;

/**
 * 获取别名管理器实例
 */
export function getAliasManager(): AliasManager {
  if (!aliasManagerInstance) {
    aliasManagerInstance = new AliasManager();
  }
  return aliasManagerInstance;
}

/**
 * 创建别名管理器实例
 */
export function createAliasManager(configDir?: string): AliasManager {
  return new AliasManager(configDir);
}
