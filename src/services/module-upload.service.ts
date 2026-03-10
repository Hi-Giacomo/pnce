import * as fs from 'fs-extra';
import * as path from 'path';
import FormData from 'form-data';
import { ApiService } from './api.service';
import { PackageJson, ApiResponse, moduleInfo } from '../types';
import { CliError, ErrorCode } from '../utils/errors';
import { Logger } from '../utils/logger';
import { DOWNLOAD, EXCLUDE_PATTERNS, DEFAULT_NPMIGNORE, PATHS } from '../constants';

/**
 * module
 * module
 */
export class moduleUploadService {
  constructor(
    private api: ApiService,
    private logger?: Logger
  ) {}

  /**
   * module
   * @param moduleDir - module directory
   */
  async upload(moduleDir: string): Promise<void> {
    try {
      const initialCwd = process.env.INIT_CWD || process.cwd();
      const absolutemoduleDir = path.resolve(initialCwd, moduleDir);

      // ValidationDirectory
      if (!(await fs.pathExists(absolutemoduleDir))) {
        throw CliError.fileNotFound(absolutemoduleDir);
      }

      //  package.json
      const packageJson = await this.readPackageJson(absolutemoduleDir);

      //  module.config.json
      const moduleConfig = await this.readmoduleConfig(absolutemoduleDir);

      // moduleInfo
      this.displaymoduleInfo(packageJson, moduleConfig);

      // File
      const tempDir = DOWNLOAD.TEMP_DIR_PATH;
      await fs.ensureDir(tempDir);
      const tgzPath = path.join(
        tempDir,
        `${packageJson.name}-${packageJson.version}${DOWNLOAD.TEMP_FILE_EXT}`
      );

      // module
      await this.createPackage(absolutemoduleDir, tgzPath);

      // 
      await this.uploadToServer(packageJson, moduleConfig, tgzPath);

      // File
      await fs.remove(tempDir);
    } catch (error) {
      this.logger?.error('上传moduleFailed', { error, moduleDir });
      throw error;
    }
  }

  /**
   *  package.json
   */
  private async readPackageJson(moduleDir: string): Promise<PackageJson> {
    const packageJsonPath = path.join(moduleDir, PATHS.PACKAGE_FILE);

    if (!(await fs.pathExists(packageJsonPath))) {
      throw CliError.fileNotFound(packageJsonPath);
    }

    const packageJson: PackageJson = await fs.readJson(packageJsonPath);

    if (!packageJson.name || !packageJson.version) {
      throw new CliError(ErrorCode.INVALID_INPUT, 'package.json 中缺少必需的 name 或 version 字段');
    }

    return packageJson;
  }

  /**
   *  module.config.json
   */
  private async readmoduleConfig(moduleDir: string): Promise<{
    appId?: string;
    teamId?: string;
    type?: string;
  }> {
    const moduleConfigPath = path.join(moduleDir, 'module.config.json');

    if (!(await fs.pathExists(moduleConfigPath))) {
      return {};
    }

    return await fs.readJson(moduleConfigPath);
  }

  /**
   * moduleInfo
   */
  private displaymoduleInfo(
    packageJson: PackageJson,
    moduleConfig: { appId?: string; teamId?: string; type?: string }
  ): void {
    console.log(`正在打包module ${packageJson.name}@${packageJson.version}...`);
    console.log(`名称: ${packageJson.name}`);
    console.log(`Version: ${packageJson.version}`);
    console.log(`Description: ${packageJson.description || ''}`);

    if (moduleConfig.type) {
      console.log(`Type: ${moduleConfig.type}`);
    }
    if (moduleConfig.appId) {
      console.log(`应用ID: ${moduleConfig.appId}`);
    }
    if (moduleConfig.teamId) {
      console.log(`团队ID: ${moduleConfig.teamId}`);
    }
    console.log('注意: AuthorInfo将从您的login账号自动获取');
  }

  /**
   * File
   */
  private async createPackage(sourceDir: string, outputPath: string): Promise<void> {
    //  .npmignore ， external_modules/ Directory
    await this.ensureNpmignore(sourceDir);

    const tar = require('tar');
    await tar.create(
      {
        gzip: true,
        file: outputPath,
        cwd: sourceDir,
        // FileDirectory
        filter: (filePath: string) => {
          const relativePath = path.relative(sourceDir, filePath);
          return !EXCLUDE_PATTERNS.some((pattern) => relativePath.startsWith(pattern));
        },
      },
      ['.'] // Directory
    );

    this.logger?.debug('创建打包File', { sourceDir, outputPath });
  }

  /**
   *  .npmignore 
   */
  private async ensureNpmignore(moduleDir: string): Promise<void> {
    const npmignorePath = path.join(moduleDir, PATHS.NPMIGNORE_FILE);

    if (!(await fs.pathExists(npmignorePath))) {
      await fs.writeFile(npmignorePath, DEFAULT_NPMIGNORE.trim());
    }
  }

  /**
   * 
   */
  private async uploadToServer(
    packageJson: PackageJson,
    moduleConfig: { appId?: string; teamId?: string; type?: string },
    tgzPath: string
  ): Promise<void> {
    const formData = new FormData();
    formData.append('package', fs.createReadStream(tgzPath));
    formData.append('name', packageJson.name);
    formData.append('version', packageJson.version);
    formData.append('description', packageJson.description || '');

    if (moduleConfig.appId) {
      formData.append('appId', moduleConfig.appId);
    }
    if (moduleConfig.teamId) {
      formData.append('teamId', moduleConfig.teamId);
    }
    if (moduleConfig.type) {
      formData.append('type', moduleConfig.type);
    }

    console.log('上传中...');

    const response = await this.api.post<ApiResponse<{ module: moduleInfo }>>(
      '/api/modules/upload',
      formData,
      true
    );

    if (!response.success) {
      throw new CliError(ErrorCode.UPLOAD_FAILED, response.message || '上传Failed');
    }

    console.log(`✓ module ${packageJson.name}@${packageJson.version} 上传Success!`);
    if (response.module?.author) {
      console.log(`  Author: ${response.module.author}`);
    }

    this.logger?.info('module上传Success', {
      name: packageJson.name,
      version: packageJson.version,
      author: response.module?.author,
    });
  }
}
