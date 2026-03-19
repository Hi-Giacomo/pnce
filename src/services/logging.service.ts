import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
  userId?: string;
  requestId?: string;
}

export interface LogConfig {
  level: LogEntry['level'];
  format: 'json' | 'text' | 'combined';
  output: 'console' | 'file' | 'both';
  filePath?: string;
  maxSize?: number;
  maxFiles?: number;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableMetadata: boolean;
}

export interface LogStats {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  errorRate: number;
  avgLogsPerMinute: number;
  oldestLog?: string;
  newestLog?: string;
}

export class LoggingService extends EventEmitter {
  private config: LogConfig;
  private logBuffer: LogEntry[] = [];
  private stats: LogStats = {
    totalLogs: 0,
    logsByLevel: { debug: 0, info: 0, warn: 0, error: 0 },
    logsByService: {},
    errorRate: 0,
    avgLogsPerMinute: 0,
  };
  private fileWriter?: fs.WriteStream;
  private readonly logger = console;
  private readonly defaultConfig: LogConfig = {
    level: 'info',
    format: 'combined',
    output: 'both',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    enableColors: true,
    enableTimestamps: true,
    enableMetadata: true,
  };

  constructor(config?: Partial<LogConfig>) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Initialize logging service
   */
  async initialize(): Promise<void> {
    // Create log directory if needed
    if (this.config.output === 'file' || this.config.output === 'both') {
      await this.ensureLogDirectory();
      await this.setupFileWriter();
    }

    this.logger.log('📝 Logging service initialized');
    this.logger.log(`   Level: ${this.config.level}`);
    this.logger.log(`   Format: ${this.config.format}`);
    this.logger.log(`   Output: ${this.config.output}`);
    this.logger.log(`   File: ${this.config.filePath || 'N/A'}`);
  }

  /**
   * Log a message
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Filter by level
    if (!this.shouldLog(logEntry.level)) {
      return;
    }

    // Add to buffer
    this.logBuffer.push(logEntry);
    this.updateStats(logEntry);

    // Output based on configuration
    if (this.config.output === 'console' || this.config.output === 'both') {
      this.outputToConsole(logEntry);
    }

    if (this.config.output === 'file' || this.config.output === 'both') {
      this.outputToFile(logEntry);
    }

    // Emit event for listeners
    this.emit('log', logEntry);
  }

  /**
   * Convenience methods for different log levels
   */
  debug(message: string, service: string = 'system', metadata?: Record<string, any>): void {
    this.log({ level: 'debug', message, service, metadata });
  }

  info(message: string, service: string = 'system', metadata?: Record<string, any>): void {
    this.log({ level: 'info', message, service, metadata });
  }

  warn(message: string, service: string = 'system', metadata?: Record<string, any>): void {
    this.log({ level: 'warn', message, service, metadata });
  }

  error(message: string, service: string = 'system', metadata?: Record<string, any>): void {
    this.log({ level: 'error', message, service, metadata });
  }

  /**
   * Log with trace ID for request tracking
   */
  logWithTrace(
    level: LogEntry['level'],
    message: string,
    service: string = 'system',
    traceId: string,
    metadata?: Record<string, any>
  ): void {
    this.log({ level, message, service, traceId, metadata });
  }

  /**
   * Log with user context
   */
  logWithUser(
    level: LogEntry['level'],
    message: string,
    service: string = 'system',
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.log({ level, message, service, userId, metadata });
  }

  /**
   * Get logs with filtering
   */
  getLogs(filter?: {
    level?: LogEntry['level'];
    service?: string;
    startTime?: Date;
    endTime?: Date;
    traceId?: string;
    userId?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logBuffer];

    // Apply filters
    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.service) {
      filtered = filtered.filter((log) => log.service === filter.service);
    }

    if (filter?.startTime) {
      const startTime = filter.startTime.toISOString();
      filtered = filtered.filter((log) => log.timestamp >= startTime);
    }

    if (filter?.endTime) {
      const endTime = filter.endTime.toISOString();
      filtered = filtered.filter((log) => log.timestamp <= endTime);
    }

    if (filter?.traceId) {
      filtered = filtered.filter((log) => log.traceId === filter.traceId);
    }

    if (filter?.userId) {
      filtered = filtered.filter((log) => log.userId === filter.userId);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filter?.limit && filter.limit > 0) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get logging statistics
   */
  getStats(): LogStats {
    return { ...this.stats };
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
    this.initializeStats();
    this.logger.log('🗑️  Log buffer cleared');
  }

  /**
   * Export logs to file
   */
  async exportLogs(filePath: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      const logs = this.getLogs();
      let content: string;

      if (format === 'json') {
        content = JSON.stringify(logs, null, 2);
      } else {
        content = this.convertToCSV(logs);
      }

      await fs.writeFile(filePath, content, 'utf8');
      this.logger.log(`📤 Logs exported to: ${filePath}`);
    } catch (error) {
      this.logger.error(`❌ Failed to export logs:`, error);
    }
  }

  /**
   * Rotate log files
   */
  async rotateLogs(): Promise<void> {
    if (!this.config.filePath || !this.fileWriter) {
      return;
    }

    try {
      // Close current file writer
      this.fileWriter.end();

      // Rename current file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = this.config.filePath.replace(/(\.[^.]+)$/, `-${timestamp}$1`);
      await fs.rename(this.config.filePath, rotatedPath);

      // Clean up old files
      await this.cleanupOldFiles();

      // Create new file writer
      await this.setupFileWriter();

      this.logger.log('🔄 Log files rotated');
    } catch (error) {
      this.logger.error('❌ Failed to rotate logs:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('⚙️  Logging configuration updated');
  }

  /**
   * Check if log entry should be logged based on level
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const entryLevelIndex = levels.indexOf(level);

    return entryLevelIndex >= currentLevelIndex;
  }

  /**
   * Output to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);

    if (this.config.enableColors) {
      const colorCode = this.getColorCode(entry.level);
      console.log(`\x1b[${colorCode}m${formatted}\x1b[0m`);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Output to file
   */
  private outputToFile(entry: LogEntry): void {
    if (!this.fileWriter) {
      return;
    }

    const formatted = this.formatLogEntry(entry);
    this.fileWriter.write(formatted + '\n');
  }

  /**
   * Format log entry based on configuration
   */
  private formatLogEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(entry);
      case 'text':
        return this.formatAsText(entry);
      case 'combined':
      default:
        return this.formatAsCombined(entry);
    }
  }

  /**
   * Format as plain text
   */
  private formatAsText(entry: LogEntry): string {
    const timestamp = this.config.enableTimestamps ? `[${entry.timestamp}] ` : '';
    const metadata =
      this.config.enableMetadata && entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';

    return `${timestamp}[${entry.level.toUpperCase()}] [${entry.service}] ${entry.message}${metadata}`;
  }

  /**
   * Format as combined format
   */
  private formatAsCombined(entry: LogEntry): string {
    const parts = [entry.timestamp, entry.level.toUpperCase(), entry.service, entry.message];

    if (this.config.enableMetadata && entry.metadata) {
      parts.push(JSON.stringify(entry.metadata));
    }

    if (entry.traceId) {
      parts.push(`trace:${entry.traceId}`);
    }

    if (entry.userId) {
      parts.push(`user:${entry.userId}`);
    }

    return parts.join(' | ');
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorCode(level: LogEntry['level']): string {
    switch (level) {
      case 'debug':
        return '36'; // Cyan
      case 'info':
        return '32'; // Green
      case 'warn':
        return '33'; // Yellow
      case 'error':
        return '31'; // Red
      default:
        return '37'; // White
    }
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    if (this.config.filePath) {
      const dir = path.dirname(this.config.filePath);
      await fs.ensureDir(dir);
    }
  }

  /**
   * Setup file writer
   */
  private async setupFileWriter(): Promise<void> {
    if (!this.config.filePath) {
      return;
    }

    // Check if file exists and needs rotation
    if (await fs.exists(this.config.filePath)) {
      const stats = await fs.stat(this.config.filePath);
      if (stats.size >= (this.config.maxSize || 10 * 1024 * 1024)) {
        await this.rotateLogs();
        return;
      }
    }

    this.fileWriter = fs.createWriteStream(this.config.filePath, { flags: 'a' });
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldFiles(): Promise<void> {
    if (!this.config.filePath) {
      return;
    }

    try {
      const dir = path.dirname(this.config.filePath);
      const files = await fs.readdir(dir);
      const logFiles = files
        .filter((file) => file.includes('-'))
        .map((file) => path.join(dir, file))
        .sort((a, b) => {
          const statA = fs.statSync(a);
          const statB = fs.statSync(b);
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      // Keep only the most recent files
      const filesToDelete = logFiles.slice(this.config.maxFiles || 5);

      for (const file of filesToDelete) {
        await fs.remove(file);
      }
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old log files:', error);
    }
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): void {
    this.stats = {
      totalLogs: 0,
      logsByLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      logsByService: {},
      errorRate: 0,
      avgLogsPerMinute: 0,
    };
  }

  /**
   * Update statistics with new log entry
   */
  private updateStats(entry: LogEntry): void {
    this.stats.totalLogs++;
    this.stats.logsByLevel[entry.level]++;

    if (!this.stats.logsByService[entry.service]) {
      this.stats.logsByService[entry.service] = 0;
    }
    this.stats.logsByService[entry.service]++;

    // Update error rate
    this.stats.errorRate = (this.stats.logsByLevel.error / this.stats.totalLogs) * 100;

    // Update average logs per minute
    if (this.logBuffer.length > 0) {
      const timeSpan =
        (new Date().getTime() - new Date(this.logBuffer[0].timestamp).getTime()) / 60000; // minutes
      this.stats.avgLogsPerMinute = this.logBuffer.length / Math.max(timeSpan, 1);
    }

    // Update oldest and newest log timestamps
    if (this.logBuffer.length === 1) {
      this.stats.oldestLog = entry.timestamp;
      this.stats.newestLog = entry.timestamp;
    } else {
      this.stats.oldestLog =
        this.stats.oldestLog! < entry.timestamp ? this.stats.oldestLog : entry.timestamp;
      this.stats.newestLog =
        this.stats.newestLog! > entry.timestamp ? this.stats.newestLog : entry.timestamp;
    }
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'service', 'message', 'metadata', 'traceId', 'userId'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.level,
      log.service,
      `"${log.message.replace(/"/g, '""')}"`,
      log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
      log.traceId || '',
      log.userId || '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  /**
   * Get service logs for specific service
   */
  getServiceLogs(serviceName: string, limit?: number): LogEntry[] {
    return this.getLogs({ service: serviceName, limit });
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit?: number): LogEntry[] {
    return this.getLogs({ level: 'error', limit });
  }

  /**
   * Search logs by message content
   */
  searchLogs(
    query: string,
    options?: {
      service?: string;
      level?: LogEntry['level'];
      limit?: number;
    }
  ): LogEntry[] {
    const allLogs = this.getLogs();

    let filtered = allLogs.filter((log) => log.message.toLowerCase().includes(query.toLowerCase()));

    if (options?.service) {
      filtered = filtered.filter((log) => log.service === options.service);
    }

    if (options?.level) {
      filtered = filtered.filter((log) => log.level === options.level);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}
