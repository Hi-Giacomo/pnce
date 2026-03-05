import * as fs from 'fs-extra';
import * as path from 'path';
import FormData from 'form-data';
import { ApiService } from './api.service';
import { PackageJson } from '../types';
import { CliError, ErrorCode } from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * 模块上传服务
 * 负责模块的打包和上传
 */
export class ModuleUploadService {
  constructor(
    private api: ApiService,
    private logger?: Logger
  ) {}

  /**
   * 上传模块到服务器
   * @param moduleDir 模块目录
   */
  async upload(moduleDir: string): Promise<void> {
    try {
      const initialCwd = process.env.INIT_CWD || process.cwd();
      const absoluteModuleDir = path.resolve(initialCwd, moduleDir);

      // 验证目录存在
      if (!await fs.pathExists(absoluteModuleDir)) {
        throw CliError.fileNotFound(absoluteModuleDir);
      }

      // 读取 package.json
      const packageJson = await this.readPackageJson(absoluteModuleDir);

      // 读取 module.config.json
      const moduleConfig = await this.readModuleConfig(absoluteModuleDir);

      // 显示模块信息
      this.displayModuleInfo(packageJson, moduleConfig);

      // 创建临时文件
      const tempDir = path.join(require('os').homedir(), '.module-temp');
      await fs.ensureDir(tempDir);
      const tgzPath = path.join(tempDir, `${packageJson.name}-${packageJson.version}.tgz`);

      // 打包模块
      await this.createPackage(absoluteModuleDir, tgzPath);

      // 上传到服务器
      await this.uploadToServer(packageJson, moduleConfig, tgzPath);

      // 清理临时文件
      await fs.remove(tempDir);
    } catch (error) {
      this.logger?.error('上传模块失败', { error, moduleDir });
      throw error;
    }
  }

  /**
   * 读取 package.json
   */
  private async readPackageJson(moduleDir: string): Promise<PackageJson> {
    const packageJsonPath = path.join(moduleDir, 'package.json');

    if (!await fs.pathExists(packageJsonPath)) {
      throw CliError.fileNotFound(packageJsonPath);
    }

    const packageJson: PackageJson = await fs.readJson(packageJsonPath);

    if (!packageJson.name || !packageJson.version) {
      throw new CliError(
        ErrorCode.INVALID_INPUT,
        'package.json 中缺少必需的 name 或 version 字段'
      );
    }

    return packageJson;
  }

  /**
   * 读取 module.config.json
   */
  private async readModuleConfig(moduleDir: string): Promise<{
    appId?: string;
    teamId?: string;
    type?: string;
  }> {
    const moduleConfigPath = path.join(moduleDir, 'module.config.json');

    if (!await fs.pathExists(moduleConfigPath)) {
      return {};
    }

    return await fs.readJson(moduleConfigPath);
  }

  /**
   * 显示模块信息
   */
  private displayModuleInfo(
    packageJson: PackageJson,
    moduleConfig: { appId?: string; teamId?: string; type?: string }
  ): void {
    console.log(`正在打包模块 ${packageJson.name}@${packageJson.version}...`);
    console.log(`名称: ${packageJson.name}`);
    console.log(`版本: ${packageJson.version}`);
    console.log(`描述: ${packageJson.description || ''}`);

    if (moduleConfig.type) {
      console.log(`类型: ${moduleConfig.type}`);
    }
    if (moduleConfig.appId) {
      console.log(`应用ID: ${moduleConfig.appId}`);
    }
    if (moduleConfig.teamId) {
      console.log(`团队ID: ${moduleConfig.teamId}`);
    }
    console.log('注意: 作者信息将从您的登录账号自动获取');
  }

  /**
   * 创建打包文件
   */
  private async createPackage(sourceDir: string, outputPath: string): Promise<void> {
    // 确保 .npmignore 存在，排除 external_modules/ 目录
    await this.ensureNpmignore(sourceDir);

    const tar = require('tar');
    await tar.create(
      {
        gzip: true,
        file: outputPath,
        cwd: sourceDir,
        // 排除不需要的文件和目录
        filter: (filePath: string) => {
          const relativePath = path.relative(sourceDir, filePath);
          // 排除 node_modules, .git, npm-debug.log 等
          const excludePatterns = [
            'node_modules',
            '.git',
            'npm-debug.log',
            '.DS_Store',
            'coverage',
            '.coverage',
            'dist',
            '.pnce',
          ];

          return !excludePatterns.some(pattern => relativePath.startsWith(pattern));
        },
      },
      ['.'] // 打包整个目录
    );

    this.logger?.debug('创建打包文件', { sourceDir, outputPath });
  }

  /**
   * 确保 .npmignore 存在
   */
  private async ensureNpmignore(moduleDir: string): Promise<void> {
    const npmignorePath = path.join(moduleDir, '.npmignore');
    const defaultContent = `node_modules/
.git/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
coverage/
dist/
.pnce/
external_modules/
*.log
`;

    if (!await fs.pathExists(npmignorePath)) {
      await fs.writeFile(npmignorePath, defaultContent.trim());
    }
  }

  /**
   * 上传到服务器
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

    const response = await this.api.post('/api/modules/upload', formData, true);

    if (!response.success) {
      throw new CliError(
        ErrorCode.UPLOAD_FAILED,
        response.message || '上传失败'
      );
    }

    console.log(`✓ 模块 ${packageJson.name}@${packageJson.version} 上传成功!`);
    if (response.module?.author) {
      console.log(`  作者: ${response.module.author}`);
    }

    this.logger?.info('模块上传成功', {
      name: packageJson.name,
      version: packageJson.version,
      author: response.module?.author,
    });
  }
}
