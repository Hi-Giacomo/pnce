/**
 * 下载进度条工具
 */
import { default as cliProgress, SingleBar, Presets } from 'cli-progress';
import { Logger } from './logger';

/**
 * 进度条配置
 */
export interface ProgressBarOptions {
  /**
   * 进度条标题
   */
  title: string;

  /**
   * 总大小（字节）
   */
  totalSize: number;

  /**
   * 预设样式
   * @default 'shades_classic'
   */
  preset?: keyof typeof Presets;

  /**
   * 是否显示速度
   * @default true
   */
  showSpeed?: boolean;

  /**
   * 日志器（用于记录下载信息）
   */
  logger?: Logger;
}

/**
 * 下载进度条类
 */
export class ProgressBar {
  private bar: SingleBar;
  private startTime: number;
  private downloadedBytes: number;
  private totalSize: number;
  private lastLogTime: number;
  private logger?: Logger;

  constructor(options: ProgressBarOptions) {
    this.totalSize = options.totalSize;
    this.downloadedBytes = 0;
    this.startTime = Date.now();
    this.lastLogTime = this.startTime;
    this.logger = options.logger;

    // 创建进度条
    this.bar = new cliProgress.SingleBar(
      {
        format: `${options.title} |{bar}| {percentage}% | {value}/{total} bytes | Speed: {speed}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );

    this.bar.start(options.totalSize, 0, { speed: '0 B/s' });
  }

  /**
   * 更新进度
   * @param chunkSize 本次下载的字节数
   */
  update(chunkSize: number): void {
    this.downloadedBytes += chunkSize;
    this.bar.update(this.downloadedBytes, {
      speed: this.calculateSpeed(),
    });

    // 每秒记录一次日志
    const now = Date.now();
    if (this.logger && now - this.lastLogTime > 1000) {
      this.logger.debug('下载进度', {
        downloaded: this.downloadedBytes,
        total: this.totalSize,
        percentage: ((this.downloadedBytes / this.totalSize) * 100).toFixed(2),
        speed: this.calculateSpeed(),
      });
      this.lastLogTime = now;
    }
  }

  /**
   * 完成进度
   */
  stop(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.formatBytes(this.downloadedBytes / elapsed);

    this.bar.stop();

    if (this.logger) {
      this.logger.info('下载完成', {
        downloaded: this.downloadedBytes,
        elapsed: elapsed.toFixed(2),
        avgSpeed,
      });
    }

    console.log(`✓ 下载完成 (${avgSpeed}/s, ${elapsed.toFixed(2)}s)`);
  }

  /**
   * 计算当前速度
   */
  private calculateSpeed(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed === 0) return '0 B/s';
    const speed = this.downloadedBytes / elapsed;
    return this.formatBytes(speed) + '/s';
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }
}

/**
 * 多进度条管理器（用于并行下载）
 */
export class MultiProgressManager {
  private progressBars: Map<string, ProgressBar> = new Map();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * 创建一个新的进度条
   */
  create(id: string, options: Omit<ProgressBarOptions, 'title'>): ProgressBar {
    const progressBar = new ProgressBar({
      title: id,
      ...options,
      logger: this.logger,
    });

    this.progressBars.set(id, progressBar);
    return progressBar;
  }

  /**
   * 更新指定ID的进度条
   */
  update(id: string, chunkSize: number): void {
    const progressBar = this.progressBars.get(id);
    if (progressBar) {
      progressBar.update(chunkSize);
    }
  }

  /**
   * 停止指定ID的进度条
   */
  stop(id: string): void {
    const progressBar = this.progressBars.get(id);
    if (progressBar) {
      progressBar.stop();
      this.progressBars.delete(id);
    }
  }

  /**
   * 停止所有进度条
   */
  stopAll(): void {
    this.progressBars.forEach((bar, id) => {
      bar.stop();
      this.progressBars.delete(id);
    });
  }

  /**
   * 获取进行中的进度条数量
   */
  getActiveCount(): number {
    return this.progressBars.size;
  }
}

/**
 * 创建简单的进度条（用于通用进度显示）
 */
export function createSimpleProgressBar(title: string, total: number): SingleBar {
  const bar = new cliProgress.SingleBar(
    {
      format: `${title} |{bar}| {percentage}% | {value}/{total}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(total, 0);
  return bar;
}
