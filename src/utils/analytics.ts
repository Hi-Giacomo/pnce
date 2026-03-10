import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * 
 */
export interface AnalyticsEvent {
  /**
   * 
   */
  event: string;

  /**
   * 
   */
  timestamp: number;

  /**
   * CLI Version
   */
  version: string;

  /**
   * Node.js Version
   */
  nodeVersion: string;

  /**
   * 
   */
  platform: string;

  /**
   * Data
   */
  data?: Record<string, any>;
}

/**
 * 
 */
export interface AnalyticsConfig {
  /**
   * YesNoEnable analytics
   */
  enabled: boolean;

  /**
   * 
   */
  endpoint?: string;
}

/**
 * 
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
   * 
   */
  private loadConfig(): AnalyticsConfig {
    try {
      if (existsSync(this.configPath)) {
        const content = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn(`加载统计配置Failed: ${error}`);
    }

    // Default Configuration：Disable analytics
    return { enabled: false };
  }

  /**
   * 
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
      logger.error(`保存统计配置Failed: ${error}`);
    }
  }

  /**
   * YesNo
   */
  isEnabled(): boolean {
    return this.config.enabled === true;
  }

  /**
   * Enable analytics
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
   * Disable analytics
   */
  disable(): void {
    this.config.enabled = false;
    this.saveConfig();
    logger.info('使用统计已禁用');
  }

  /**
   * Record
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

      // LocalFile
      const events = this.loadEvents();
      events.push(eventData);
      this.saveEvents(events);

      logger.debug(`事件已Record: ${event}`);

      // ，
      if (this.config.endpoint) {
        this.sendEvent(eventData).catch((error) => {
          logger.debug(`发送统计事件Failed: ${error}`);
        });
      }
    } catch (error) {
      logger.debug(`Record统计事件Failed: ${error}`);
    }
  }

  /**
   * 
   */
  private loadEvents(): AnalyticsEvent[] {
    try {
      if (existsSync(this.eventsFile)) {
        const content = readFileSync(this.eventsFile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.debug(`加载统计事件Failed: ${error}`);
    }

    return [];
  }

  /**
   * 
   */
  private saveEvents(events: AnalyticsEvent[]): void {
    try {
      const dir = path.dirname(this.eventsFile);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      //  100 
      const recentEvents = events.slice(-100);

      writeFileSync(this.eventsFile, JSON.stringify(recentEvents, null, 2), 'utf-8');
    } catch (error) {
      logger.debug(`保存统计事件Failed: ${error}`);
    }
  }

  /**
   * 
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
      logger.debug(`发送统计事件Failed: ${error}`);
    }
  }

  /**
   * Local
   */
  clearEvents(): void {
    try {
      if (existsSync(this.eventsFile)) {
        const fs = require('fs-extra');
        fs.removeSync(this.eventsFile);
        logger.info('Local统计事件已清空');
      }
    } catch (error) {
      logger.error(`清空统计事件Failed: ${error}`);
    }
  }

  /**
   * Info
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
 * Global
 */
let analyticsManagerInstance: AnalyticsManager | null = null;

/**
 * 
 */
export function getAnalyticsManager(): AnalyticsManager {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager();
  }
  return analyticsManagerInstance;
}

/**
 * Record
 */
export function track(event: string, data?: Record<string, any>): void {
  getAnalyticsManager().track(event, data);
}
