import * as fs from 'fs-extra';
import * as path from 'path';
import { ApiService } from './api.service';
import { ModuleService } from './module.service';
import { ModulesConfig, ModulesLock, DEFAULT_MODULES_CONFIG } from '../types/modules-config';
import { ApiResponse, ModuleInfo } from '../types';

/**
 * 模块依赖管理服务
 * 类似 npm 的 package.json + package-lock.json 机制
 */
export class ModulesManagerService {
  private configFileName = 'modules.json';
  private lockFileName = 'modules-lock.json';
  private gitignoreFileName = '.gitignore';

  constructor(
    private api: ApiService,
    private moduleService: ModuleService
  ) {}

  /**
   * 初始化 modules.json 配置文件
   */
  initConfig(projectDir: string): void {
    const configPath = path.join(projectDir, this.configFileName);
    
    if (fs.existsSync(configPath)) {
      console.log('⚠️  modules.json 已存在');
      return;
    }

    fs.writeJsonSync(configPath, DEFAULT_MODULES_CONFIG, { spaces: 2 });
    console.log('✓ 创建 modules.json 配置文件');

    // 更新 .gitignore
    this.updateGitignore(projectDir);
  }

  /**
   * 读取 modules.json 配置
   * @param projectDir - 项目根目录路径
   * @returns 模块配置对象
   */
  readConfig(projectDir: string): ModulesConfig {
    const configPath = path.join(projectDir, this.configFileName);
    
    if (!fs.existsSync(configPath)) {
      return DEFAULT_MODULES_CONFIG;
    }

    return fs.readJsonSync(configPath);
  }

  /**
   * 保存配置到 modules.json
   */
  saveConfig(projectDir: string, config: ModulesConfig): void {
    const configPath = path.join(projectDir, this.configFileName);
    fs.writeJsonSync(configPath, config, { spaces: 2 });
  }

  /**
   * 读取 modules-lock.json
   */
  readLock(projectDir: string): ModulesLock | null {
    const lockPath = path.join(projectDir, this.lockFileName);
    
    if (!fs.existsSync(lockPath)) {
      return null;
    }

    return fs.readJsonSync(lockPath);
  }

  /**
   * 保存锁定文件
   */
  saveLock(projectDir: string, lock: ModulesLock): void {
    const lockPath = path.join(projectDir, this.lockFileName);
    fs.writeJsonSync(lockPath, lock, { spaces: 2 });
  }

  /**
   * 添加模块依赖到 modules.json
   */
  async addModule(
    projectDir: string,
    moduleName: string,
    versionRange?: string,
    options?: { save?: boolean }
  ): Promise<void> {
    const config = this.readConfig(projectDir);
    
    // 如果没有指定版本，获取最新版本
    let version = versionRange;
    if (!version) {
      console.log(`获取 ${moduleName} 的最新版本...`);
      const response = await this.api.get<ApiResponse<{ module: ModuleInfo }>>(`/api/modules/${moduleName}`);
      if (!response.success || !response.module) {
        throw new Error('获取模块信息失败');
      }
      version = `^${response.module.latest}`;
    }

    // 添加到配置
    if (!config.externalModules) {
      config.externalModules = {};
    }
    config.externalModules[moduleName] = version;

    // 保存配置
    if (options?.save !== false) {
      this.saveConfig(projectDir, config);
      console.log(`✓ 已添加 ${moduleName}@${version} 到 modules.json`);
    }
  }

  /**
   * 从 modules.json 移除模块
   */
  removeModule(projectDir: string, moduleName: string): void {
    const config = this.readConfig(projectDir);
    
    if (config.externalModules && config.externalModules[moduleName]) {
      delete config.externalModules[moduleName];
      this.saveConfig(projectDir, config);
      console.log(`✓ 已从 modules.json 移除 ${moduleName}`);
    } else {
      console.log(`⚠️  ${moduleName} 不在依赖列表中`);
    }
  }

  /**
   * 安装所有模块依赖
   */
  async installAll(projectDir: string, options?: { forceFresh?: boolean }): Promise<void> {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);

    if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
      console.log('📦 没有需要安装的外部模块');
      return;
    }

    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log(`\n📦 开始安装外部模块...`);
    console.log(`📁 安装目录: ${installDir}\n`);

    const newLock: ModulesLock = {
      modules: {},
      lockfileVersion: 1,
      generatedAt: new Date().toISOString(),
    };

    let installed = 0;
    let skipped = 0;

    for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
      try {
        // 解析版本范围，获取具体版本
        const targetVersion = await this.resolveVersion(moduleName, versionRange, lock, options?.forceFresh);
        
        // 检查模块状态（包括哈希验证）
        const moduleStatus = await this.moduleService.checkModuleStatus(moduleName, targetVersion, installDir);
        
        if (moduleStatus.isInstalled && !moduleStatus.needsUpdate && !options?.forceFresh) {
          console.log(`⏭️  ${moduleName}@${targetVersion} 已安装且未修改（跳过）`);
          skipped++;
          
          // 使用现有的锁定信息
          if (lock && lock.modules[moduleName]) {
            newLock.modules[moduleName] = lock.modules[moduleName];
          } else {
            newLock.modules[moduleName] = {
              version: targetVersion,
              resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`,
            };
          }
        } else {
          if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
            console.log(`🔄 ${moduleName} 需要重新安装（版本变更或代码有修改）...`);
          } else {
            console.log(`⬇️  安装 ${moduleName}@${targetVersion}...`);
          }
          await this.moduleService.install(moduleName, targetVersion, installDir);
          installed++;
          
          // 记录到锁定文件
          newLock.modules[moduleName] = {
            version: targetVersion,
            resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`,
          };
        }
      } catch (error: unknown) {
        console.error(`❌ 安装 ${moduleName} 失败:`, error instanceof Error ? error.message : String(error));
      }
    }

    // 保存锁定文件
    if (config.options?.lockFile !== false) {
      this.saveLock(projectDir, newLock);
      console.log(`\n✓ 已更新 ${this.lockFileName}`);
    }

    console.log(`\n✅ 安装完成！`);
    console.log(`   新安装: ${installed} 个`);
    console.log(`   已跳过: ${skipped} 个`);
  }

  /**
   * 解析版本范围，返回具体版本
   */
  private async resolveVersion(
    moduleName: string,
    versionRange: string,
    lock: ModulesLock | null,
    forceFresh?: boolean
  ): Promise<string> {
    // 如果有锁定文件且不是强制刷新，优先使用锁定版本
    if (lock && lock.modules[moduleName] && !forceFresh) {
      return lock.modules[moduleName].version;
    }

    // 获取模块信息
    const response = await this.api.get<ApiResponse<{ module: ModuleInfo }>>(`/api/modules/${moduleName}`);
    if (!response.success || !response.module) {
      throw new Error('获取模块信息失败');
    }

    const module = response.module;
    const availableVersions = Object.keys(module.versions);

    // 简单的版本范围解析
    if (versionRange === 'latest' || versionRange === '*') {
      return module.latest;
    }

    // 移除 ^ 或 ~ 前缀
    const cleanVersion = versionRange.replace(/^[\^~]/, '');

    // 如果是精确版本
    if (availableVersions.includes(cleanVersion)) {
      return cleanVersion;
    }

    // 否则返回最新版本
    return module.latest;
  }

  /**
   * 更新 .gitignore，添加模块目录
   */
  updateGitignore(projectDir: string): void {
    const gitignorePath = path.join(projectDir, this.gitignoreFileName);
    const ignoreEntries = [
      'external_modules/',
      'local_modules/'
    ];

    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    }

    let modified = false;

    // 添加需要忽略的目录
    for (const entry of ignoreEntries) {
      if (!content.includes(entry)) {
        if (!modified) {
          if (content && !content.endsWith('\n')) {
            content += '\n';
          }
          content += `\n# External and local modules (managed by modules.json and package.json)\n`;
          modified = true;
        }
        content += `${entry}\n`;
      }
    }

    if (modified) {
      fs.writeFileSync(gitignorePath, content);
      console.log(`✓ 已更新 .gitignore`);
    }
  }

  /**
   * 清理未使用的模块
   */
  async prune(projectDir: string): Promise<void> {
    const config = this.readConfig(projectDir);
    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    if (!fs.existsSync(absoluteInstallDir)) {
      console.log('📦 模块目录不存在');
      return;
    }

    const installedModules = fs.readdirSync(absoluteInstallDir);
    const configuredModules = Object.keys(config.externalModules || {});

    const toRemove = installedModules.filter(m => !configuredModules.includes(m));

    if (toRemove.length === 0) {
      console.log('✓ 没有需要清理的模块');
      return;
    }

    console.log(`\n🗑️  清理 ${toRemove.length} 个未使用的模块:\n`);
    
    for (const moduleName of toRemove) {
      const modulePath = path.join(absoluteInstallDir, moduleName);
      fs.removeSync(modulePath);
      console.log(`   ✓ 删除 ${moduleName}`);
    }

    console.log('\n✅ 清理完成！');
  }

  /**
   * 列出所有模块依赖
   */
  list(projectDir: string): void {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);
    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log('\n📦 外部模块依赖:\n');

    if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
      console.log('   (无)');
      return;
    }

    for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
      const lockedVersion = lock?.modules[moduleName]?.version;
      const isInstalled = fs.existsSync(path.join(absoluteInstallDir, moduleName));
      
      const status = isInstalled ? '✓' : '✗';
      const versionInfo = lockedVersion ? `${versionRange} (锁定: ${lockedVersion})` : versionRange;
      
      console.log(`   ${status} ${moduleName}@${versionInfo}`);
    }

    console.log('');
  }
}
