import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 使用统计事件
 */
export interface AnalyticsEvent {
  /**
   * 事件名称
   */
  event: string;

  /**
   * 事件时间
   */
  timestamp: number;

  /**
   * CLI 版本
   */
  version: string;

  /**
   * Node.js 版本
   */
  nodeVersion: string;

  /**
   * 操作系统
   */
  platform: string;

  /**
   * 额外数据
   */
  data?: Record<string, any>;
}

/**
 * 使用统计配置
 */
export interface AnalyticsConfig {
  /**
   * 是否启用统计
   */
  enabled: boolean;

  /**
   * 统计服务器地址
   */
  endpoint?: string;
}

/**
 * 使用统计管理器
 */
export class AnalyticsManager {
  private configPath: string;
  private config: AnalyticsConfig;
  private eventsFile: string;

  constructor(configDir?: string) {
    const configBaseDir = configDir || path.join(require('os').homedir(), '.pnce');
    this.configPath = path.join(configBaseDir, 'analytics.json');
    this.eventsFile = path.join(configBaseDir, 'analytics-events.json');
    this.config = this.loadConfig();
  }

  /**
   * 加载统计配置
   */
  private loadConfig(): AnalyticsConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`加载统计配置失败: ${error}`);
    }

    // 默认配置：禁用统计
    return { enabled: false };
  }

  /**
   * 保存统计配置
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.debug('统计配置已保存');
    } catch (error) {
      logger.error(`保存统计配置失败: ${error}`);
    }
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled === true;
  }

  /**
   * 启用统计
   */
  enable(endpoint?: string): void {
    this.config.enabled = true;
    if (endpoint) {
      this.config.endpoint = endpoint;
    }
    this.saveConfig();
    logger.info('使用统计已启用');
  }

  /**
   * 禁用统计
   */
  disable(): void {
    this.config.enabled = false;
    this.saveConfig();
    logger.info('使用统计已禁用');
  }

  /**
   * 记录事件
   */
  track(event: string, data?: Record<string, any>): void {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const eventData: AnalyticsEvent = {
        event,
        timestamp: Date.now(),
        version: process.env.PNCE_VERSION || '0.0.9',
        nodeVersion: process.version,
        platform: process.platform,
        data,
      };

      // 保存到本地文件
      const events = this.loadEvents();
      events.push(eventData);
      this.saveEvents(events);

      logger.debug(`事件已记录: ${event}`);

      // 如果配置了端点，发送到服务器
      if (this.config.endpoint) {
        this.sendEvent(eventData).catch((error) => {
          logger.debug(`发送统计事件失败: ${error}`);
        });
      }
    } catch (error) {
      logger.debug(`记录统计事件失败: ${error}`);
    }
  }

  /**
   * 加载事件
   */
  private loadEvents(): AnalyticsEvent[] {
    try {
      if (existsSync(this.eventsFile)) {
        const content = readFileSync(this.eventsFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.debug(`加载统计事件失败: ${error}`);
    }

    return [];
  }

  /**
   * 保存事件
   */
  private saveEvents(events: AnalyticsEvent[]): void {
    try {
      const dir = path.dirname(this.eventsFile);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // 只保留最近 100 条事件
      const recentEvents = events.slice(-100);

      writeFileSync(this.eventsFile, JSON.stringify(recentEvents, null, 2), 'utf-8');
    } catch (error) {
      logger.debug(`保存统计事件失败: ${error}`);
    }
  }

  /**
   * 发送事件到服务器
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      const axios = await import('axios');
      await axios.default.post(this.config.endpoint, event, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logger.debug(`统计事件已发送: ${event.event}`);
    } catch (error) {
      logger.debug(`发送统计事件失败: ${error}`);
    }
  }

  /**
   * 清空本地事件
   */
  clearEvents(): void {
    try {
      if (existsSync(this.eventsFile)) {
        const fs = require('fs-extra');
        fs.removeSync(this.eventsFile);
        logger.info('本地统计事件已清空');
      }
    } catch (error) {
      logger.error(`清空统计事件失败: ${error}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { enabled: boolean; eventCount: number; endpoint?: string } {
    return {
      enabled: this.isEnabled(),
      eventCount: this.loadEvents().length,
      endpoint: this.config.endpoint,
    };
  }
}

/**
 * 全局统计管理器实例
 */
let analyticsManagerInstance: AnalyticsManager | null = null;

/**
 * 获取统计管理器实例
 */
export function getAnalyticsManager(): AnalyticsManager {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager();
  }
  return analyticsManagerInstance;
}

/**
 * 记录事件的便利函数
 */
export function track(event: string, data?: Record<string, any>): void {
  getAnalyticsManager().track(event, data);
}
