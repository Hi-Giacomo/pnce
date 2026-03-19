import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface ConfigFile {
  path: string;
  content: any;
  lastModified: number;
  checksum: string;
}

export interface ReloadEvent {
  type: 'file_changed' | 'file_added' | 'file_removed' | 'error';
  filePath: string;
  content?: any;
  error?: Error;
}

export class ConfigReloadService extends EventEmitter {
  private watchedFiles = new Map<string, ConfigFile>();
  private watchers = new Map<string, fs.FSWatcher>();
  private readonly logger = console;
  private readonly debounceTime = 500; // 500ms debounce
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
  }

  /**
   * Start watching configuration files
   */
  async startWatching(filePaths: string[]): Promise<void> {
    this.logger.log('🔍 Starting configuration file watching...');

    for (const filePath of filePaths) {
      await this.watchFile(filePath);
    }

    this.logger.log(`👁️  Watching ${filePaths.length} configuration files`);
  }

  /**
   * Stop watching all files
   */
  stopWatching(): void {
    this.logger.log('🛑 Stopping configuration file watching...');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        this.logger.log(`✓ Stopped watching: ${path}`);
      } catch (error) {
        this.logger.error(`❌ Error stopping watcher for ${path}:`, error);
      }
    }
    this.watchers.clear();
    this.watchedFiles.clear();
  }

  /**
   * Watch a single configuration file
   */
  private async watchFile(filePath: string): Promise<void> {
    try {
      // Resolve file path
      const resolvedPath = path.resolve(filePath);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        this.logger.warn(`⚠️  Configuration file not found: ${resolvedPath}`);
        return;
      }

      // Load initial file content
      const content = await this.loadConfigFile(resolvedPath);
      if (content) {
        this.watchedFiles.set(resolvedPath, content);
      }

      // Create file watcher
      const watcher = fs.watch(resolvedPath, { persistent: true }, (eventType, filename) => {
        if (filename === null) return; // Directory events
        this.handleFileChange(resolvedPath, eventType);
      });

      this.watchers.set(resolvedPath, watcher);
      this.logger.log(`✓ Started watching: ${resolvedPath}`);
    } catch (error) {
      this.logger.error(`❌ Error watching file ${filePath}:`, error);
      this.emit('error', {
        type: 'error',
        filePath,
        error: error instanceof Error ? error : new Error(String(error)),
      } as ReloadEvent);
    }
  }

  /**
   * Handle file change events
   */
  private handleFileChange(filePath: string, eventType: string): void {
    // Clear existing debounce timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Create new debounce timer
    const timer = setTimeout(async () => {
      await this.processFileChange(filePath, eventType);
      this.debounceTimers.delete(filePath);
    }, this.debounceTime);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process actual file change
   */
  private async processFileChange(filePath: string, eventType: string): Promise<void> {
    try {
      const newContent = await this.loadConfigFile(filePath);
      if (!newContent) {
        return;
      }

      const oldContent = this.watchedFiles.get(filePath);

      if (!oldContent) {
        // File was added
        this.watchedFiles.set(filePath, newContent);
        this.logger.log(`📄 Configuration file added: ${path.basename(filePath)}`);
        this.emit('file_added', {
          type: 'file_added',
          filePath,
          content: newContent.content,
        } as ReloadEvent);
        return;
      }

      // Check if content actually changed
      if (oldContent.checksum !== newContent.checksum) {
        this.watchedFiles.set(filePath, newContent);
        this.logger.log(`🔄 Configuration file changed: ${path.basename(filePath)}`);
        this.emit('file_changed', {
          type: 'file_changed',
          filePath,
          content: newContent.content,
          oldContent: oldContent.content,
        } as ReloadEvent);
      }
    } catch (error) {
      this.logger.error(`❌ Error processing file change for ${filePath}:`, error);
      this.emit('error', {
        type: 'error',
        filePath,
        error: error instanceof Error ? error : new Error(String(error)),
      } as ReloadEvent);
    }
  }

  /**
   * Load and parse configuration file
   */
  private async loadConfigFile(filePath: string): Promise<ConfigFile | null> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const checksum = this.calculateChecksum(content);

      return {
        path: filePath,
        content: this.parseConfigContent(content),
        lastModified: stats.mtime.getTime(),
        checksum,
      };
    } catch (error) {
      this.logger.error(`❌ Error loading config file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse configuration content based on file type
   */
  private parseConfigContent(content: string): any {
    const ext = path.extname(this.getCurrentFilePath());

    try {
      switch (ext) {
        case '.json':
          return JSON.parse(content);
        case '.js': {
          // Remove export and execute
          const jsContent = content.replace(/^export\s+/, '');
          return eval(`(${jsContent})`);
        }
        case '.ts': {
          // For TypeScript files, try to parse as JSON (common for tsconfig)
          try {
            return JSON.parse(content);
          } catch {
            return content; // Return as string if not valid JSON
          }
        }
        case '.yml':
        case '.yaml': {
          const yaml = require('js-yaml');
          return yaml.load(content);
        }
        case '.env': {
          return this.parseEnvFile(content);
        }
        default:
          return content; // Return as string for unknown types
      }
    } catch (error) {
      this.logger.error(`❌ Error parsing config content:`, error);
      return content;
    }
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return env;
  }

  /**
   * Calculate checksum for content comparison
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get current file path (helper)
   */
  private getCurrentFilePath(): string {
    // This is a placeholder - in real implementation,
    // you might need to track which file is being processed
    return '';
  }

  /**
   * Get all watched files information
   */
  getWatchedFiles(): ConfigFile[] {
    return Array.from(this.watchedFiles.values());
  }

  /**
   * Get specific file content
   */
  getFileContent(filePath: string): any | null {
    const file = this.watchedFiles.get(path.resolve(filePath));
    return file ? file.content : null;
  }

  /**
   * Force reload all watched files
   */
  async reloadAll(): Promise<void> {
    this.logger.log('🔄 Force reloading all configuration files...');

    for (const [filePath] of this.watchedFiles) {
      try {
        const newContent = await this.loadConfigFile(filePath);
        if (newContent) {
          const oldContent = this.watchedFiles.get(filePath);
          this.watchedFiles.set(filePath, newContent);

          this.emit('file_changed', {
            type: 'file_changed',
            filePath,
            content: newContent.content,
            oldContent: oldContent?.content,
          } as ReloadEvent);
        }
      } catch (error) {
        this.logger.error(`❌ Error reloading file ${filePath}:`, error);
      }
    }
  }

  /**
   * Add new file to watch
   */
  async addFile(filePath: string): Promise<void> {
    await this.watchFile(filePath);
    this.logger.log(`➕ Added configuration file to watch: ${filePath}`);
  }

  /**
   * Remove file from watch
   */
  removeFile(filePath: string): void {
    const resolvedPath = path.resolve(filePath);

    // Stop watcher
    const watcher = this.watchers.get(resolvedPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(resolvedPath);
    }

    // Remove from watched files
    this.watchedFiles.delete(resolvedPath);

    // Clear debounce timer
    const timer = this.debounceTimers.get(resolvedPath);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(resolvedPath);
    }

    this.logger.log(`➖ Removed configuration file from watch: ${filePath}`);

    this.emit('file_removed', {
      type: 'file_removed',
      filePath: resolvedPath,
    } as ReloadEvent);
  }

  /**
   * Get watching statistics
   */
  getStats(): {
    watchedFiles: number;
    activeWatchers: number;
    uptime: number;
  } {
    return {
      watchedFiles: this.watchedFiles.size,
      activeWatchers: this.watchers.size,
      uptime: process.uptime(),
    };
  }
}
