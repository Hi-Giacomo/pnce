import * as fs from 'fs-extra';
import * as path from 'path';
import * as tar from 'tar';
import { ApiService } from './api.service';
import { CliError, ErrorCode } from '../utils/errors';
import { Logger, initLogger } from '../utils/logger';
import { ProgressBar, MultiProgressManager } from '../utils/progress';
import axios from 'axios';
import retry from 'axios-retry';
import winston from 'winston';
import { DOWNLOAD, HTTP, PATHS } from '../constants';
import { ApiResponse, ModuleInfo } from '../types';

/**
 * 模块下载服务
 * 负责模块的下载、解压和安装
 */
export class ModuleDownloadService {
  private logger: Logger;

  constructor(
    private api: ApiService,
    logger?: Logger
  ) {
    if (logger) {
      this.logger = logger;
    } else {
      // 创建临时的logger对象
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
   * 下载并安装单个模块
   * @param moduleName - 模块名称
   * @param version - 版本号(可选,默认最新)
   * @param installDir - 安装目录
   */
  async install(
    moduleName: string,
    version?: string,
    installDir: string = 'node_modules'
  ): Promise<void> {
    const initialCwd = process.env.INIT_CWD || process.cwd();
    let targetVersion = version;
    let installPath = path.resolve(initialCwd, installDir, moduleName);

    // 如果没有指定版本，获取最新版本
    if (!targetVersion) {
      targetVersion = await this.getLatestVersion(moduleName);
    }

    if (!targetVersion) {
      throw new CliError(ErrorCode.VERSION_NOT_FOUND, `模块 "${moduleName}" 的版本 "latest" 不存在`, 404, { name: moduleName, version: 'latest' });
    }

    // 检查是否已安装且版本匹配
    const moduleStatus = await this.checkModuleStatus(
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
      console.log(`🔄 ${moduleName} 需要重新安装${moduleStatus.installedVersion ? ` (当前: ${moduleStatus.installedVersion})` : ''}...`);
    }

    console.log(`下载 ${moduleName}@${targetVersion}...`);

    // 下载并安装
    await this.downloadAndExtract(
      moduleName,
      targetVersion,
      installPath,
      initialCwd
    );

    console.log(`✓ ${moduleName}@${targetVersion} 安装成功`);
  }

  /**
   * 批量安装模块（并行）
   * @param modules 模块列表 [{ name, version }]
   * @param installDir 安装目录
   * @param concurrency 并发数
   */
  async installBatch(
    modules: Array<{ name: string; version?: string }>,
    installDir: string = 'node_modules',
    concurrency: number = DOWNLOAD.DEFAULT_CONCURRENCY
  ): Promise<void> {
    const initialCwd = process.env.INIT_CWD || process.cwd();
    const progressManager = new MultiProgressManager(this.logger);

    // 创建安装任务
    const tasks = modules.map(module => ({
      ...module,
      installPath: path.resolve(initialCwd, installDir, module.name),
    }));

    // 并发执行
    await this.concurrentExecute(
      tasks,
      concurrency,
      progressManager,
      installDir,
      initialCwd
    );

    progressManager.stopAll();
  }

  /**
   * 获取模块的最新版本
   */
  private async getLatestVersion(moduleName: string): Promise<string> {
    const response = await this.api.get<ApiResponse<{ module: ModuleInfo }>>(`/api/modules/${moduleName}`);

    if (!response.success || !response.module?.latest) {
      throw new CliError(
        ErrorCode.MODULE_NOT_FOUND,
        `模块 "${moduleName}" 不存在`
      );
    }

    return response.module.latest;
  }

  /**
   * 检查模块状态
   */
  private async checkModuleStatus(
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
    if (!await fs.pathExists(moduleConfigPath)) {
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
   * 下载并解压模块
   */
  private async downloadAndExtract(
    moduleName: string,
    version: string,
    installPath: string,
    initialCwd: string,
    progressManager?: MultiProgressManager
  ): Promise<void> {
    const downloadUrl = `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${version}/download`;

    // 配置重试
    const axiosInstance = axios.create();
    retry(axiosInstance, {
      retries: HTTP.RETRY_COUNT,
      retryDelay: retryCount => retryCount * HTTP.RETRY_DELAY_MS,
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

    // 创建进度条
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

    // 解压到目标目录
    await this.extractPackage(tempTgzPath, installPath);

    // 清理临时文件
    await fs.remove(tempTgzPath);
  }

  /**
   * 并发执行安装任务
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
    const semaphore = new Array(concurrency).fill(null);
    const executing: Set<Promise<void>> = new Set();

    for (const task of tasks) {
      // 如果并发数已满，等待一个任务完成
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }

      const promise = this.installTask(
        task,
        progressManager,
        installDir,
        initialCwd
      ).then(() => {
        executing.delete(promise);
      });

      executing.add(promise);
    }

    // 等待所有任务完成
    await Promise.all(executing);
  }

  /**
   * 执行单个安装任务
   */
  private async installTask(
    task: { name: string; version?: string; installPath: string },
    progressManager: MultiProgressManager,
    installDir: string,
    initialCwd: string
  ): Promise<void> {
    try {
      // 获取版本
      let targetVersion = task.version;
      if (!targetVersion) {
        targetVersion = await this.getLatestVersion(task.name);
      }

      // 检查状态
      const status = await this.checkModuleStatus(
        task.name,
        targetVersion,
        installDir,
        initialCwd
      );

      if (status.isInstalled && !status.needsUpdate) {
        console.log(`✓ ${task.name}@${targetVersion} 已安装`);
        return;
      }

      // 下载并安装
      await this.downloadAndExtract(
        task.name,
        targetVersion,
        task.installPath,
        initialCwd,
        progressManager
      );

      console.log(`✓ ${task.name}@${targetVersion} 安装成功`);
    } catch (error) {
      this.logger?.error('安装模块失败', {
        name: task.name,
        version: task.version,
        error,
      });
      throw error;
    }
  }

  /**
   * 解压包
   */
  private async extractPackage(tgzPath: string, targetPath: string): Promise<void> {
    // 删除旧目录（如果存在）
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    await fs.ensureDir(path.dirname(targetPath));

    await tar.extract({
      file: tgzPath,
      cwd: path.dirname(targetPath),
      strip: 1, // 移除顶层目录
    });

    this.logger?.debug('解压包成功', { tgzPath, targetPath });
  }
}
