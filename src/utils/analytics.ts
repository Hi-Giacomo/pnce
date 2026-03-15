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
   * CLI version
   */
  version: string;

  /**
   * Node.js version
   */
  nodeversion: string;

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
   * Yes/NoEnable analytics
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
  private eventsfile: string;

  constructor(configDir?: string) {
    const configBaseDir = configDir || path.join(require('os').homedir(), '.pnce');
    this.configPath = path.join(configBaseDir, 'analytics.json');
    this.eventsfile = path.join(configBaseDir, 'analytics-events.json');
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
      logger.warn(`LoadStatisticsConfigurefailed: ${error}`);
    }

    // Default Config：Disable analytics
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
      logger.debug('StatisticsConfigureSave');
    } catch (error) {
      logger.error(`SaveStatisticsConfigurefailed: ${error}`);
    }
  }

  /**
   * Yes/No
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
    logger.info('UseStatisticsEnable');
  }

  /**
   * Disable analytics
   */
  disable(): void {
    this.config.enabled = false;
    this.saveConfig();
    logger.info('UseStatisticsDisable');
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
        nodeversion: process.version,
        platform: process.platform,
        data,
      };

      // Localfile
      const events = this.loadEvents();
      events.push(eventData);
      this.saveEvents(events);

      logger.debug(`EventRecord: ${event}`);

      // ，
      if (this.config.endpoint) {
        this.sendEvent(eventData).catch((error) => {
          logger.debug(`SendStatisticsEventfailed: ${error}`);
        });
      }
    } catch (error) {
      logger.debug(`RecordStatisticsEventfailed: ${error}`);
    }
  }

  /**
   *
   */
  private loadEvents(): AnalyticsEvent[] {
    try {
      if (existsSync(this.eventsfile)) {
        const content = readFileSync(this.eventsfile, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.debug(`LoadStatisticsEventfailed: ${error}`);
    }

    return [];
  }

  /**
   *
   */
  private saveEvents(events: AnalyticsEvent[]): void {
    try {
      const dir = path.dirname(this.eventsfile);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      //  100
      const recentEvents = events.slice(-100);

      writeFileSync(this.eventsfile, JSON.stringify(recentEvents, null, 2), 'utf-8');
    } catch (error) {
      logger.debug(`SaveStatisticsEventfailed: ${error}`);
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
      logger.debug(`StatisticsEventSend: ${event.event}`);
    } catch (error) {
      logger.debug(`SendStatisticsEventfailed: ${error}`);
    }
  }

  /**
   * Local
   */
  clearEvents(): void {
    try {
      if (existsSync(this.eventsfile)) {
        const fs = require('fs-extra');
        fs.removeSync(this.eventsfile);
        logger.info('LocalStatisticsEventEmpty');
      }
    } catch (error) {
      logger.error(`EmptyStatisticsEventfailed: ${error}`);
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
