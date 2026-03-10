/**
 * ProgressUtility
 */
import { default as cliProgress, SingleBar, Presets } from 'cli-progress';
import { Logger } from './logger';

/**
 * Progress
 */
export interface ProgressBarOptions {
  /**
   * Progress
   */
  title: string;

  /**
   * （）
   */
  totalSize: number;

  /**
   * 
   * @default 'shades_classic'
   */
  preset?: keyof typeof Presets;

  /**
   * YesNo
   * @default true
   */
  showSpeed?: boolean;

  /**
   * （RecordInfo）
   */
  logger?: Logger;
}

/**
 * Progress
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

    // Progress
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
   * Update progress
   * @param chunkSize Bytes downloaded this time
   */
  update(chunkSize: number): void {
    this.downloadedBytes += chunkSize;
    this.bar.update(this.downloadedBytes, {
      speed: this.calculateSpeed(),
    });

    // Log once per second
    const now = Date.now();
    if (this.logger && now - this.lastLogTime > 1000) {
      this.logger.debug('Download progress', {
        downloaded: this.downloadedBytes,
        total: this.totalSize,
        percentage: ((this.downloadedBytes / this.totalSize) * 100).toFixed(2),
        speed: this.calculateSpeed(),
      });
      this.lastLogTime = now;
    }
  }

  /**
   * Complete progress
   */
  stop(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.formatBytes(this.downloadedBytes / elapsed);

    this.bar.stop();

    if (this.logger) {
      this.logger.info('Download complete', {
        downloaded: this.downloadedBytes,
        elapsed: elapsed.toFixed(2),
        avgSpeed,
      });
    }

    console.log(`✓ Download complete (${avgSpeed}/s, ${elapsed.toFixed(2)}s)`);
  }

  /**
   * Calculate current speed
   */
  private calculateSpeed(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed === 0) return '0 B/s';
    const speed = this.downloadedBytes / elapsed;
    return this.formatBytes(speed) + '/s';
  }

  /**
   * Format bytes
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
 * Multi-progress bar manager (for parallel downloads)
 */
export class MultiProgressManager {
  private progressBars: Map<string, ProgressBar> = new Map();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Create a new progress bar
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
   * Update progress bar for specified ID
   */
  update(id: string, chunkSize: number): void {
    const progressBar = this.progressBars.get(id);
    if (progressBar) {
      progressBar.update(chunkSize);
    }
  }

  /**
   * Stop progress bar for specified ID
   */
  stop(id: string): void {
    const progressBar = this.progressBars.get(id);
    if (progressBar) {
      progressBar.stop();
      this.progressBars.delete(id);
    }
  }

  /**
   * Stop all progress bars
   */
  stopAll(): void {
    this.progressBars.forEach((bar, id) => {
      bar.stop();
      this.progressBars.delete(id);
    });
  }

  /**
   * Get number of active progress bars
   */
  getActiveCount(): number {
    return this.progressBars.size;
  }
}

/**
 * Create simple progress bar (for general progress display)
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
