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
import { ApiResponse, ModuleInformation } from '../types';

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
   * @param version - version(,Default)
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

    // version，version
    if (!targetVersion) {
      targetVersion = await this.getLatestversion(moduleName);
    }

    if (!targetVersion) {
      throw new CliError(
        ErrorCode.VERSION_NOT_FOUND,
        `module "${moduleName}" version "latest" does not exist`,
        404,
        { name: moduleName, version: 'latest' }
      );
    }

    // Yes/Noversion
    const moduleStatus = await this.checkModuleStatus(
      moduleName,
      targetVersion,
      installDir,
      initialCwd
    );

    if (moduleStatus.isInstalled && !moduleStatus.needsUpdate) {
      console.log(`✓ ${moduleName}@${targetVersion} Install`);
      return;
    }

    if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
      console.log(
        `🔄 ${moduleName} Install${moduleStatus.installedversion ? ` (Current: ${moduleStatus.installedversion})` : ''}...`
      );
    }

    console.log(`Download ${moduleName}@${targetVersion}...`);

    //
    await this.downloadAndExtract(moduleName, targetVersion, installPath, initialCwd);

    console.log(`✓ ${moduleName}@${targetVersion} installation successful`);
  }

  /**
   * module（）
   * @param modules module list [{ name, version }]
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
   * moduleversion
   */
  private async getLatestversion(moduleName: string): Promise<string> {
    const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );

    if (!response.success || !response.module?.latest) {
      throw new CliError(ErrorCode.MODULE_NOT_FOUND, `module "${moduleName}" does not exist`);
    }

    return response.module.latest;
  }

  /**
   * module status
   */
  private async checkModuleStatus(
    moduleName: string,
    targetversion: string,
    installDir: string,
    projectRoot: string
  ): Promise<{
    isInstalled: boolean;
    needsUpdate: boolean;
    installedversion: string | null;
    installedName: string | null;
  }> {
    const basePath = projectRoot;
    const modulePath = path.resolve(basePath, installDir, moduleName);

    const isInstalled = await fs.pathExists(modulePath);

    if (!isInstalled) {
      return {
        isInstalled: false,
        needsUpdate: false,
        installedversion: null,
        installedName: null,
      };
    }

    const moduleConfigPath = path.join(modulePath, 'module.config.json');
    if (!(await fs.pathExists(moduleConfigPath))) {
      return {
        isInstalled: true,
        needsUpdate: true,
        installedversion: null,
        installedName: null,
      };
    }

    const moduleConfig = await fs.readJson(moduleConfigPath);
    const installedversion = moduleConfig.version || null;
    const installedName = moduleConfig.name || null;

    const needsUpdate = installedversion !== targetversion;

    return {
      isInstalled: true,
      needsUpdate,
      installedversion,
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

    // file
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
      // version
      let targetVersion = task.version;
      if (!targetVersion) {
        targetVersion = await this.getLatestversion(task.name);
      }

      // Status
      const status = await this.checkModuleStatus(task.name, targetVersion, installDir, initialCwd);

      if (status.isInstalled && !status.needsUpdate) {
        console.log(`✓ ${task.name}@${targetVersion} Install`);
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

      console.log(`✓ ${task.name}@${targetVersion} installation successful`);
    } catch (error) {
      this.logger?.error('Installmodulefailed', {
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
  private async extractPackage(tgzFilePath: string, targetPath: string): Promise<void> {
    // Directory（）
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    await fs.ensureDir(path.dirname(targetPath));

    await tar.extract({
      file: tgzFilePath,
      cwd: path.dirname(targetPath),
      strip: 1, // Directory
    });

    this.logger?.debug('ExtractPackageSuccess', { tgzFilePath, targetPath });
  }
}
