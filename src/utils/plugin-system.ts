import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';
import { Command } from 'commander';
import { PnceConfig, ConfigManager } from '../config/manager';
import { Logger } from 'winston';

const logger = getLogger();

/**
 * Interface
 */
export interface Plugin {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Author
   */
  author?: string;

  /**
   *
   */
  init?(context: PluginContext): void | Promise<void>;

  /**
   *
   */
  destroy?(): void | Promise<void>;

  /**
   * command
   */
  registercommands?: (program: Command) => void;

  /**
   * Validation
   */
  validateConfig?: (config: PnceConfig) => boolean;

  /**
   *
   */
  hooks?: {
    /**
     * command
     */
    beforecommand?: (command: string, args: string[]) => void | Promise<void>;

    /**
     * command
     */
    aftercommand?: (command: string, args: string[], result: unknown) => void | Promise<void>;

    /**
     * Error
     */
    onError?: (error: Error) => void | Promise<void>;
  };
}

/**
 *
 */
export interface PluginContext {
  /**
   * CLI version
   */
  version: string;

  /**
   *
   */
  config: PnceConfig | null;

  /**
   * Record
   */
  logger: Logger;

  /**
   * Utility
   */
  utils: {
    track: (event: string, data?: Record<string, unknown>) => void;
  };
}

/**
 *
 */
export interface PluginManifest {
  /**
   * Plugin name
   */
  name: string;

  /**
   * Plugin version
   */
  version: string;

  /**
   * file
   */
  entry: string;

  /**
   * dependencies
   */
  dependencies?: Record<string, string>;

  /**
   * Yes/No
   */
  enabled: boolean;
}

/**
 *
 */
export class PluginSystem {
  private pluginsDir: string;
  private manifestfile: string;
  private plugins: Map<string, Plugin> = new Map();
  private manifests: Map<string, PluginManifest> = new Map();
  private configManager: ConfigManager;

  constructor(pluginsDir?: string, configManager?: ConfigManager) {
    const configBaseDir = pluginsDir || path.join(require('os').homedir(), '.pnce');
    this.pluginsDir = path.join(configBaseDir, 'plugins');
    this.manifestfile = path.join(configBaseDir, 'plugins-manifest.json');

    //
    this.configManager = configManager || new ConfigManager();

    // Directory
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true });
    }

    this.loadManifest();
  }

  /**
   *
   */
  private loadManifest(): void {
    try {
      if (existsSync(this.manifestfile)) {
        const content = readFileSync(this.manifestfile, 'utf-8');
        const manifests: PluginManifest[] = JSON.parse(content);

        manifests.forEach((manifest) => {
          this.manifests.set(manifest.name, manifest);
        });
      }
    } catch (error) {
      logger.warn(`LoadPluginfailed: ${error}`);
    }
  }

  /**
   *
   */
  private saveManifest(): void {
    try {
      const manifests = Array.from(this.manifests.values());
      writeFileSync(this.manifestfile, JSON.stringify(manifests, null, 2), 'utf-8');
      logger.debug('PluginSave');
    } catch (error) {
      logger.error(`SavePluginfailed: ${error}`);
    }
  }

  /**
   *
   * @param plugin -
   */
  async register(plugin: Plugin): Promise<void> {
    try {
      // Yes/No
      if (this.plugins.has(plugin.name)) {
        throw new Error(`Pluginalready exists: ${plugin.name}`);
      }

      // Current
      const config = this.configManager.getConfig();

      //
      const context: PluginContext = {
        version: process.env.PNCE_VERSION || '0.0.9',
        config: config,
        logger: logger as unknown as Logger,
        utils: {
          track: (event: string, data?: Record<string, unknown>) => {
            logger.debug(`PluginEvent: ${plugin.name}.${event}`, data);
          },
        },
      };

      if (plugin.init) {
        await plugin.init(context);
      }

      this.plugins.set(plugin.name, plugin);

      //
      const manifest: PluginManifest = {
        name: plugin.name,
        version: plugin.version,
        entry: '', // file
        enabled: true,
      };
      this.manifests.set(plugin.name, manifest);
      this.saveManifest();

      logger.info(`PluginRegister: ${plugin.name}@${plugin.version}`);
    } catch (error) {
      logger.error(
        `RegisterPluginfailed: ${plugin.name}`,
        error instanceof Error ? { error } : { error: String(error) }
      );
      throw error;
    }
  }

  /**
   *
   * @param name - Plugin name
   */
  async unregister(name: string): Promise<void> {
    try {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        throw new Error(`Plugindoes not exist: ${name}`);
      }

      //
      if (plugin.destroy) {
        await plugin.destroy();
      }

      this.plugins.delete(name);
      this.manifests.delete(name);
      this.saveManifest();

      logger.info(`Plugin: ${name}`);
    } catch (error) {
      logger.error(
        `Pluginfailed: ${name}`,
        error instanceof Error ? { error } : { error: String(error) }
      );
      throw error;
    }
  }

  /**
   *
   * @param name - Plugin name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * All
   */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   *
   * @param name - Plugin name
   */
  async enable(name: string): Promise<void> {
    const manifest = this.manifests.get(name);
    if (!manifest) {
      throw new Error(`Plugindoes not exist: ${name}`);
    }

    manifest.enabled = true;
    this.saveManifest();

    logger.info(`PluginEnable: ${name}`);
  }

  /**
   *
   * @param name - Plugin name
   */
  async disable(name: string): Promise<void> {
    const manifest = this.manifests.get(name);
    if (!manifest) {
      throw new Error(`Plugindoes not exist: ${name}`);
    }

    manifest.enabled = false;
    this.saveManifest();

    logger.info(`PluginDisable: ${name}`);
  }

  /**
   * Allcommand
   * @param program - commander
   */
  registerAllcommands(program: Command): void {
    this.plugins.forEach((plugin) => {
      if (plugin.registercommands) {
        try {
          plugin.registercommands(program);
          logger.debug(`PlugincommandRegister: ${plugin.name}`);
        } catch (error) {
          logger.error(
            `RegisterPlugincommandfailed: ${plugin.name}`,
            error instanceof Error ? { error } : { error: String(error) }
          );
        }
      }
    });
  }

  /**
   * command
   * @param command - command
   * @param args -
   */
  async triggerBeforecommand(command: string, args: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach((plugin) => {
      if (plugin.hooks?.beforecommand) {
        const promise = plugin.hooks.beforecommand!(command, args);
        if (promise instanceof Promise) {
          promises.push(promise);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * command
   * @param command - command
   * @param args -
   * @param result -
   */
  async triggerAftercommand(command: string, args: string[], result: unknown): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach((plugin) => {
      if (plugin.hooks?.aftercommand) {
        const promise = plugin.hooks.aftercommand!(command, args, result);
        if (promise instanceof Promise) {
          promises.push(promise);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Error
   * @param error - Error
   */
  async triggerOnError(error: Error): Promise<void> {
    const promises: Promise<void>[] = [];

    this.plugins.forEach((plugin) => {
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
   * Directory
   */
  getPluginsDir(): string {
    return this.pluginsDir;
  }

  /**
   * Get configuration
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
}

/**
 * Global
 */
let pluginSystemInstance: PluginSystem | null = null;

/**
 *
 */
export function getPluginSystem(): PluginSystem {
  if (!pluginSystemInstance) {
    pluginSystemInstance = new PluginSystem();
  }
  return pluginSystemInstance;
}

/**
 *
 */
export function createPluginSystem(
  pluginsDir?: string,
  configManager?: ConfigManager
): PluginSystem {
  return new PluginSystem(pluginsDir, configManager);
}
