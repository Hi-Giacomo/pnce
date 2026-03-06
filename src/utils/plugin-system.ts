import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';
import { Command } from 'commander';
import { PnceConfig, ConfigManager } from '../config/manager';
import { Logger } from 'winston';

const logger = getLogger();

/**
 * 插件接口
 */
export interface Plugin {
  /**
   * 插件名称
   */
  name: string;

  /**
   * 插件版本
   */
  version: string;

  /**
   * 插件描述
   */
  description?: string;

  /**
   * 作者
   */
  author?: string;

  /**
   * 初始化函数
   */
  init?(context: PluginContext): void | Promise<void>;

  /**
   * 销毁函数
   */
  destroy?(): void | Promise<void>;

  /**
   * 命令注册函数
   */
  registerCommands?: (program: Command) => void;

  /**
   * 配置验证函数
   */
  validateConfig?: (config: PnceConfig) => boolean;

  /**
   * 钩子函数
   */
  hooks?: {
    /**
     * 命令执行前钩子
     */
    beforeCommand?: (command: string, args: string[]) => void | Promise<void>;

  /**
   * 命令执行后钩子
   */
  afterCommand?: (command: string, args: string[], result: unknown) => void | Promise<void>;

    /**
     * 错误处理钩子
     */
    onError?: (error: Error) => void | Promise<void>;
  };
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /**
   * CLI 版本
   */
  version: string;

  /**
   * 配置管理器
   */
  config: PnceConfig | null;

  /**
   * 日志记录器
   */
  logger: Logger;

  /**
   * 获取工具函数
   */
  utils: {
    track: (event: string, data?: Record<string, unknown>) => void;
  };
}

/**
 * 插件清单
 */
export interface PluginManifest {
  /**
   * 插件名称
   */
  name: string;

  /**
   * 插件版本
   */
  version: string;

  /**
   * 入口文件
   */
  entry: string;

  /**
   * 依赖项
   */
  dependencies?: Record<string, string>;

  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 插件系统管理器
 */
export class PluginSystem {
  private pluginsDir: string;
  private manifestFile: string;
  private plugins: Map<string, Plugin> = new Map();
  private manifests: Map<string, PluginManifest> = new Map();
  private configManager: ConfigManager;

  constructor(pluginsDir?: string, configManager?: ConfigManager) {
    const configBaseDir = pluginsDir || path.join(require('os').homedir(), '.pnce');
    this.pluginsDir = path.join(configBaseDir, 'plugins');
    this.manifestFile = path.join(configBaseDir, 'plugins-manifest.json');

    // 初始化配置管理器
    this.configManager = configManager || new ConfigManager();

    // 确保插件目录存在
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true });
    }

    this.loadManifest();
  }

  /**
   * 加载插件清单
   */
  private loadManifest(): void {
    try {
      if (existsSync(this.manifestFile)) {
        const content = readFileSync(this.manifestFile, 'utf-8');
        const manifests: PluginManifest[] = JSON.parse(content);

        manifests.forEach(manifest => {
          this.manifests.set(manifest.name, manifest);
        });
      }
    } catch (error) {
      logger.warn(`加载插件清单失败: ${error}`);
    }
  }

  /**
   * 保存插件清单
   */
  private saveManifest(): void {
    try {
      const manifests = Array.from(this.manifests.values());
      writeFileSync(this.manifestFile, JSON.stringify(manifests, null, 2), 'utf-8');
      logger.debug('插件清单已保存');
    } catch (error) {
      logger.error(`保存插件清单失败: ${error}`);
    }
  }

  /**
   * 注册插件
   * @param plugin - 插件实例
   */
  async register(plugin: Plugin): Promise<void> {
    try {
      // 检查插件是否已注册
      if (this.plugins.has(plugin.name)) {
        throw new Error(`插件已存在: ${plugin.name}`);
      }

      // 获取当前配置
      const config = this.configManager.getConfig();

      // 初始化插件
      const context: PluginContext = {
        version: process.env.PNCE_VERSION || '0.0.9',
        config: config,
        logger: logger as unknown as Logger,
        utils: {
          track: (event: string, data?: Record<string, unknown>) => {
            logger.debug(`插件事件: ${plugin.name}.${event}`, data);
          },
        },
      };

      if (plugin.init) {
        await plugin.init(context);
      }

      this.plugins.set(plugin.name, plugin);

      // 更新清单
      const manifest: PluginManifest = {
        name: plugin.name,
        version: plugin.version,
        entry: '', // 内联插件无需入口文件
        enabled: true,
      };
      this.manifests.set(plugin.name, manifest);
      this.saveManifest();

      logger.info(`插件已注册: ${plugin.name}@${plugin.version}`);
    } catch (error) {
      logger.error(`注册插件失败: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * 注销插件
   * @param name - 插件名称
   */
  async unregister(name: string): Promise<void> {
    try {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        throw new Error(`插件不存在: ${name}`);
      }

      // 销毁插件
      if (plugin.destroy) {
        await plugin.destroy();
      }

      this.plugins.delete(name);
      this.manifests.delete(name);
      this.saveManifest();

      logger.info(`插件已注销: ${name}`);
    } catch (error) {
      logger.error(`注销插件失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 获取插件
   * @param name - 插件名称
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 列出所有插件
   */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 启用插件
   * @param name - 插件名称
   */
  async enable(name: string): Promise<void> {
    const manifest = this.manifests.get(name);
    if (!manifest) {
      throw new Error(`插件清单不存在: ${name}`);
    }

    manifest.enabled = true;
    this.saveManifest();

    logger.info(`插件已启用: ${name}`);
  }

  /**
   * 禁用插件
   * @param name - 插件名称
   */
  async disable(name: string): Promise<void> {
    const manifest = this.manifests.get(name);
    if (!manifest) {
      throw new Error(`插件清单不存在: ${name}`);
    }

    manifest.enabled = false;
    this.saveManifest();

    logger.info(`插件已禁用: ${name}`);
  }

  /**
   * 注册所有插件的命令
   * @param program - Commander 程序实例
   */
  registerAllCommands(program: Command): void {
    this.plugins.forEach(plugin => {
      if (plugin.registerCommands) {
        try {
          plugin.registerCommands(program);
          logger.debug(`插件命令已注册: ${plugin.name}`);
        } catch (error) {
          logger.error(`注册插件命令失败: ${plugin.name}`, error);
        }
      }
    });
  }

  /**
   * 触发命令执行前钩子
   * @param command - 命令
   * @param args - 参数
   */
  async triggerBeforeCommand(command: string, args: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach(plugin => {
      if (plugin.hooks?.beforeCommand) {
        const promise = plugin.hooks.beforeCommand!(command, args);
        if (promise instanceof Promise) {
          promises.push(promise);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * 触发命令执行后钩子
   * @param command - 命令
   * @param args - 参数
   * @param result - 结果
   */
  async triggerAfterCommand(command: string, args: string[], result: unknown): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach(plugin => {
      if (plugin.hooks?.afterCommand) {
        const promise = plugin.hooks.afterCommand!(command, args, result);
        if (promise instanceof Promise) {
          promises.push(promise);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * 触发错误处理钩子
   * @param error - 错误
   */
  async triggerOnError(error: Error): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach(plugin => {
      if (plugin.hooks?.onError) {
        const promise = plugin.hooks.onError!(error);
        if (promise instanceof Promise) {
          promises.push(promise);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * 获取插件目录路径
   */
  getPluginsDir(): string {
    return this.pluginsDir;
  }

  /**
   * 获取配置管理器
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
}

/**
 * 全局插件系统实例
 */
let pluginSystemInstance: PluginSystem | null = null;

/**
 * 获取插件系统实例
 */
export function getPluginSystem(): PluginSystem {
  if (!pluginSystemInstance) {
    pluginSystemInstance = new PluginSystem();
  }
  return pluginSystemInstance;
}

/**
 * 创建插件系统实例
 */
export function createPluginSystem(pluginsDir?: string, configManager?: ConfigManager): PluginSystem {
  return new PluginSystem(pluginsDir, configManager);
}
