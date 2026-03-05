import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  level: LogLevel;
  dir: string;
  maxFiles: number;
  maxSize: string;
  format: 'json' | 'simple';
}

/**
 * 获取默认日志配置
 */
function getDefaultConfig(): LoggerConfig {
  return {
    level: (process.env.PNCE_LOG_LEVEL || 'info') as LogLevel,
    dir: path.join(process.cwd(), '.pnce', 'logs'),
    maxFiles: 30,
    maxSize: '10m',
    format: (process.env.PNCE_LOG_FORMAT || 'simple') as 'json' | 'simple',
  };
}

/**
 * 创建日志目录
 */
async function ensureLogDir(config: LoggerConfig): Promise<void> {
  await fs.ensureDir(config.dir);
}

/**
 * 创建日志格式
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
 * 创建Winston Logger
 */
export async function createLogger(config?: Partial<LoggerConfig>): Promise<winston.Logger> {
  const finalConfig = { ...getDefaultConfig(), ...config };
  await ensureLogDir(finalConfig);

  const logFormat = createLogFormat(finalConfig);

  const transports: winston.transport[] = [
    // 控制台输出
    new winston.transports.Console({
      format: finalConfig.format === 'json'
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

    // 错误日志文件
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

    // 所有日志文件
    new winston.transports.File({
      filename: path.join(finalConfig.dir, 'combined.log'),
      maxFiles: finalConfig.maxFiles,
      maxsize: parseInt(finalConfig.maxSize) * 1024 * 1024,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
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
 * Logger类 - 提供便捷的日志方法
 */
export class Logger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  /**
   * 记录错误
   */
  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * 记录信息
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * 记录调试信息
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * 创建子日志器
   */
  child(defaultMeta: Record<string, unknown>): Logger {
    return new Logger(this.logger.child(defaultMeta));
  }

  /**
   * 获取底层Winston Logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

/**
 * 全局日志器实例
 */
let globalLogger: Logger | null = null;

/**
 * 初始化全局日志器
 */
export async function initLogger(config?: Partial<LoggerConfig>): Promise<void> {
  if (globalLogger) {
    return;
  }

  const winstonLogger = await createLogger(config);
  globalLogger = new Logger(winstonLogger);
}

/**
 * 获取全局日志器
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    // 如果未初始化，创建一个临时的控制台日志器
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
