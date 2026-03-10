import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

/**
 * Log Level
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * 
 */
export interface LoggerConfig {
  level: LogLevel;
  dir: string;
  maxFiles: number;
  maxSize: string;
  format: 'json' | 'simple';
}

/**
 * Default
 */
function getDefaultConfig(): LoggerConfig {
  return {
    level: (process.env.PNCE_LOG_LEVEL || 'info') as LogLevel,
    // UserDirectory，YesCurrentDirectory
    dir: path.join(os.homedir(), '.pnce', 'logs'),
    maxFiles: 30,
    maxSize: '10m',
    format: (process.env.PNCE_LOG_FORMAT || 'simple') as 'json' | 'simple',
  };
}

/**
 * Directory
 */
async function ensureLogDir(config: LoggerConfig): Promise<void> {
  await fs.ensureDir(config.dir);
}

/**
 * 
 */
function createLogFormat(config: LoggerConfig): winston.Logform.Format {
  if (config.format === 'json') {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
  }

  return winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      return log;
    })
  );
}

/**
 * Winston Logger
 */
export async function createLogger(config?: Partial<LoggerConfig>): Promise<winston.Logger> {
  const finalConfig = { ...getDefaultConfig(), ...config };
  await ensureLogDir(finalConfig);

  const logFormat = createLogFormat(finalConfig);

  const transports: winston.transport[] = [
    // 
    new winston.transports.Console({
      format:
        finalConfig.format === 'json'
          ? logFormat
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'HH:mm:ss' }),
              winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level}]: ${message}`;
              })
            ),
      level: finalConfig.level,
    }),

    // ErrorFile
    new winston.transports.File({
      filename: path.join(finalConfig.dir, 'error.log'),
      level: 'error',
      maxFiles: finalConfig.maxFiles,
      maxsize: parseInt(finalConfig.maxSize) * 1024 * 1024,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // AllFile
    new winston.transports.File({
      filename: path.join(finalConfig.dir, 'combined.log'),
      maxFiles: finalConfig.maxFiles,
      maxsize: parseInt(finalConfig.maxSize) * 1024 * 1024,
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ];

  const logger = winston.createLogger({
    level: finalConfig.level,
    transports,
    exitOnError: false,
  });

  return logger;
}

/**
 * Logger - 
 */
export class Logger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  /**
   * RecordError
   */
  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  /**
   * RecordWarning
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * RecordInfo
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * RecordInfo
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * 
   */
  child(defaultMeta: Record<string, unknown>): Logger {
    return new Logger(this.logger.child(defaultMeta));
  }

  /**
   * Winston Logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

/**
 * Global
 */
let globalLogger: Logger | null = null;

/**
 * Global
 */
export async function initLogger(config?: Partial<LoggerConfig>): Promise<void> {
  if (globalLogger) {
    return;
  }

  const winstonLogger = await createLogger(config);
  globalLogger = new Logger(winstonLogger);
}

/**
 * Global
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    // ，
    const tempLogger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
    globalLogger = new Logger(tempLogger);
  }

  return globalLogger;
}
