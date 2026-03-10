import * as fs from 'fs-extra';
import * as path from 'path';
import * as tar from 'tar';
import { ApiService } from './api.service';
import { CliError, ErrorCode } from '../utils/errors';
import { Logger } from '../utils/logger';
import { ProgressBar, MultiProgressManager } from '../utils/progress';
import axios from 'axios';
import retry from 'axios-retry';
import winston from 'winston';
import { DOWNLOAD, HTTP } from '../constants';
import { ApiResponse, moduleInfo } from '../types';

/**
 * module
 * module、
 */
export class moduleDownloadService {
  private logger: Logger;

  constructor(
    private api: ApiService,
    logger?: Logger
  ) {
    if (logger) {
      this.logger = logger;
    } else {
      // logger
      const tempWinstonLogger = winston.createLogger({
        level: 'info',
        transports: [
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ],
      });
      this.logger = new Logger(tempWinstonLogger);
    }
  }

  /**
   * module
   * @param moduleName - module name
   * @param version - Version(,Default)
   * @param installDir - Directory
   */
  async install(
    moduleName: string,
    version?: string,
    installDir: string = 'node_modules'
  ): Promise<void> {
    const initialCwd = process.env.INIT_CWD || process.cwd();
    let targetVersion = version;
    const installPath = path.resolve(initialCwd, installDir, moduleName);

    // Version，Version
    if (!targetVersion) {
      targetVersion = await this.getLatestVersion(moduleName);
    }

    if (!targetVersion) {
      throw new CliError(
        ErrorCode.VERSION_NOT_FOUND,
        `module "${moduleName}" 的Version "latest" does not exist`,
        404,
        { name: moduleName, version: 'latest' }
      );
    }

    // YesNoVersion
    const moduleStatus = await this.checkmoduleStatus(
      moduleName,
      targetVersion,
      installDir,
      initialCwd
    );

    if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
      console.log(`✓ ${moduleName}@${targetVersion} 已安装`);
      return;
    }

    if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
      console.log(
        `🔄 ${moduleName} 需要重新安装${moduleStatus.installedVersion ? ` (Current: ${moduleStatus.installedVersion})` : ''}...`
      );
    }

    console.log(`下载 ${moduleName}@${targetVersion}...`);

    // 
    await this.downloadAndExtract(moduleName, targetVersion, installPath, initialCwd);

    console.log(`✓ ${moduleName}@${targetVersion} Installation successful`);
  }

  /**
   * module（）
   * @param modules moduleList [{ name, version }]
   * @param installDir Directory
   * @param concurrency 
   */
  async installBatch(
    modules: Array<{ name: string; version?: string }>,
    installDir: string = 'node_modules',
    concurrency: number = DOWNLOAD.DEFAULT_CONCURRENCY
  ): Promise<void> {
    const initialCwd = process.env.INIT_CWD || process.cwd();
    const progressManager = new MultiProgressManager(this.logger);

    // 
    const tasks = modules.map((module) => ({
      ...module,
      installPath: path.resolve(initialCwd, installDir, module.name),
    }));

    // 
    await this.concurrentExecute(tasks, concurrency, progressManager, installDir, initialCwd);

    progressManager.stopAll();
  }

  /**
   * moduleVersion
   */
  private async getLatestVersion(moduleName: string): Promise<string> {
    const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
      `/api/modules/${moduleName}`
    );

    if (!response.success || !response.module?.latest) {
      throw new CliError(ErrorCode.MODULE_NOT_FOUND, `module "${moduleName}" does not exist`);
    }

    return response.module.latest;
  }

  /**
   * moduleStatus
   */
  private async checkmoduleStatus(
    moduleName: string,
    targetVersion: string,
    installDir: string,
    projectRoot: string
  ): Promise<{
    isInstalled: boolean;
    needsUpdate: boolean;
    installedVersion: string | null;
    installedName: string | null;
  }> {
    const basePath = projectRoot;
    const modulePath = path.resolve(basePath, installDir, moduleName);

    const isInstalled = await fs.pathExists(modulePath);

    if (!isInstalled) {
      return {
        isInstalled: false,
        needsUpdate: false,
        installedVersion: null,
        installedName: null,
      };
    }

    const moduleConfigPath = path.join(modulePath, 'module.config.json');
    if (!(await fs.pathExists(moduleConfigPath))) {
      return {
        isInstalled: true,
        needsUpdate: true,
        installedVersion: null,
        installedName: null,
      };
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedVersion = moduleConfig.version || null;
    const installedName = moduleConfig.name || null;

    const needsUpdate = installedVersion !== targetVersion;

    return {
      isInstalled: true,
      needsUpdate,
      installedVersion,
      installedName,
    };
  }

  /**
   * module
   */

  private async downloadAndExtract(
    moduleName: string,
    version: string,
    installPath: string,
    _initialCwd: string,
    progressManager?: MultiProgressManager
  ): Promise<void> {
    const downloadUrl = `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${version}/download`;

    // 
    const axiosInstance = axios.create();
    retry(axiosInstance, {
      retries: HTTP.RETRY_COUNT,
      retryDelay: (retryCount) => retryCount * HTTP.RETRY_DELAY_MS,
    });

    const response = await axiosInstance({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: this.api['getAuthHeaders']?.() || {},
    });

    const contentLength = parseInt(response.headers['content-length'], 10);
    const tempDir = DOWNLOAD.TEMP_DIR_PATH;
    await fs.ensureDir(tempDir);

    const tempTgzPath = path.join(tempDir, `${moduleName}-${version}${DOWNLOAD.TEMP_FILE_EXT}`);
    const writer = fs.createWriteStream(tempTgzPath);

    // Progress
    let progressBar: ProgressBar | null = null;
    if (progressManager && contentLength) {
      progressBar = progressManager.create(moduleName, {
        totalSize: contentLength,
        logger: this.logger,
      });
    }

    let downloadedBytes = 0;
    response.data.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      if (progressBar) {
        progressBar.update(chunk.length);
      }
    });

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.pipe(writer);
    });

    if (progressBar) {
      progressBar.stop();
      if (progressManager) {
        progressManager.stop(moduleName);
      }
    }

    // Directory
    await this.extractPackage(tempTgzPath, installPath);

    // File
    await fs.remove(tempTgzPath);
  }

  /**
   * 
   */
  private async concurrentExecute(
    tasks: Array<{
      name: string;
      version?: string;
      installPath: string;
    }>,
    concurrency: number,
    progressManager: MultiProgressManager,
    installDir: string,
    initialCwd: string
  ): Promise<void> {
    const executing: Set<Promise<void>> = new Set();

    for (const task of tasks) {
      // ，Complete
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }

      const promise = this.installTask(task, progressManager, installDir, initialCwd).then(() => {
        executing.delete(promise);
      });

      executing.add(promise);
    }

    // AllComplete
    await Promise.all(executing);
  }

  /**
   * 
   */
  private async installTask(
    task: { name: string; version?: string; installPath: string },
    progressManager: MultiProgressManager,
    installDir: string,
    initialCwd: string
  ): Promise<void> {
    try {
      // Version
      let targetVersion = task.version;
      if (!targetVersion) {
        targetVersion = await this.getLatestVersion(task.name);
      }

      // Status
      const status = await this.checkmoduleStatus(task.name, targetVersion, installDir, initialCwd);

      if (status.isInstalled && !status.needsUpdate) {
        console.log(`✓ ${task.name}@${targetVersion} 已安装`);
        return;
      }

      // 
      await this.downloadAndExtract(
        task.name,
        targetVersion,
        task.installPath,
        initialCwd,
        progressManager
      );

      console.log(`✓ ${task.name}@${targetVersion} Installation successful`);
    } catch (error) {
      this.logger?.error('安装moduleFailed', {
        name: task.name,
        version: task.version,
        error,
      });
      throw error;
    }
  }

  /**
   * 
   */
  private async extractPackage(tgzPath: string, targetPath: string): Promise<void> {
    // Directory（）
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    await fs.ensureDir(path.dirname(targetPath));

    await tar.extract({
      file: tgzPath,
      cwd: path.dirname(targetPath),
      strip: 1, // Directory
    });

    this.logger?.debug('解压包Success', { tgzPath, targetPath });
  }
}
