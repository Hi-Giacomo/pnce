import * as fs from 'fs-extra';
import * as path from 'path';
import { ApiService } from './api.service';
import { moduleService } from './module.service';
import { modulesConfig, modulesLock, DEFAULT_MODULES_CONFIG } from '../types/modules-config';
import { ApiResponse, moduleInfo } from '../types';

/**
 * moduleDependencies
 *  npm  package.json + package-lock.json 
 */
export class modulesManagerService {
  private configFileName = 'modules.json';
  private lockFileName = 'modules-lock.json';
  private gitignoreFileName = '.gitignore';

  constructor(
    private api: ApiService,
    private moduleService: moduleService
  ) {}

  /**
   *  modules.json File
   */
  initConfig(projectDir: string): void {
    const configPath = path.join(projectDir, this.configFileName);

    if (fs.existsSync(configPath)) {
      console.log('⚠️  modules.json 已存在');
      return;
    }

    fs.writeJsonSync(configPath, DEFAULT_MODULES_CONFIG, { spaces: 2 });
    console.log('✓ 创建 modules.json 配置File');

    //  .gitignore
    this.updateGitignore(projectDir);
  }

  /**
   *  modules.json 
   * @param projectDir - Directory
   * @returns module
   */
  readConfig(projectDir: string): modulesConfig {
    const configPath = path.join(projectDir, this.configFileName);

    if (!fs.existsSync(configPath)) {
      return DEFAULT_MODULES_CONFIG;
    }

    return fs.readJsonSync(configPath);
  }

  /**
   *  modules.json
   */
  saveConfig(projectDir: string, config: modulesConfig): void {
    const configPath = path.join(projectDir, this.configFileName);
    fs.writeJsonSync(configPath, config, { spaces: 2 });
  }

  /**
   *  modules-lock.json
   */
  readLock(projectDir: string): modulesLock | null {
    const lockPath = path.join(projectDir, this.lockFileName);

    if (!fs.existsSync(lockPath)) {
      return null;
    }

    return fs.readJsonSync(lockPath);
  }

  /**
   * File
   */
  saveLock(projectDir: string, lock: modulesLock): void {
    const lockPath = path.join(projectDir, this.lockFileName);
    fs.writeJsonSync(lockPath, lock, { spaces: 2 });
  }

  /**
   * moduleDependencies modules.json
   */
  async addmodule(
    projectDir: string,
    moduleName: string,
    versionRange?: string,
    options?: { save?: boolean }
  ): Promise<void> {
    const config = this.readConfig(projectDir);

    // Version，Version
    let version = versionRange;
    if (!version) {
      console.log(`获取 ${moduleName} 的最新Version...`);
      const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
        `/api/modules/${moduleName}`
      );
      if (!response.success || !response.module) {
        throw new Error('获取moduleInfoFailed');
      }
      version = `^${response.module.latest}`;
    }

    // 
    if (!config.externalmodules) {
      config.externalmodules = {};
    }
    config.externalmodules[moduleName] = version;

    // 
    if (options?.save !== false) {
      this.saveConfig(projectDir, config);
      console.log(`✓ 已添加 ${moduleName}@${version} 到 modules.json`);
    }
  }

  /**
   *  modules.json module
   */
  removemodule(projectDir: string, moduleName: string): void {
    const config = this.readConfig(projectDir);

    if (config.externalmodules && config.externalmodules[moduleName]) {
      delete config.externalmodules[moduleName];
      this.saveConfig(projectDir, config);
      console.log(`✓ 已从 modules.json 移除 ${moduleName}`);
    } else {
      console.log(`⚠️  ${moduleName} 不在DependenciesList中`);
    }
  }

  /**
   * AllmoduleDependencies
   */
  async installAll(projectDir: string, options?: { forceFresh?: boolean }): Promise<void> {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);

    if (!config.externalmodules || Object.keys(config.externalmodules).length === 0) {
      console.log('📦 没有需要安装的外部module');
      return;
    }

    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    // const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log(`\n📦 Start安装外部module...`);
    console.log(`📁 安装Directory: ${installDir}\n`);

    const newLock: modulesLock = {
      modules: {},
      lockfileVersion: 1,
      generatedAt: new Date().toISOString(),
    };

    let installed = 0;
    let skipped = 0;

    for (const [moduleName, versionRange] of Object.entries(config.externalmodules)) {
      try {
        // Version，Version
        const targetVersion = await this.resolveVersion(
          moduleName,
          versionRange,
          lock,
          options?.forceFresh
        );

        // moduleStatus（Validation）
        const moduleStatus = await this.moduleService.checkmoduleStatus(
          moduleName,
          targetVersion,
          installDir
        );

        if (moduleStatus.isInstalled && !moduleStatus.needsUpdate && !options?.forceFresh) {
          console.log(`⏭️  ${moduleName}@${targetVersion} 已安装且未修改（跳过）`);
          skipped++;

          // Info
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
            console.log(`🔄 ${moduleName} 需要重新安装（Version变更或代码有修改）...`);
          } else {
            console.log(`⬇️  安装 ${moduleName}@${targetVersion}...`);
          }
          await this.moduleService.install(moduleName, targetVersion, installDir);
          installed++;

          // RecordFile
          newLock.modules[moduleName] = {
            version: targetVersion,
            resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetVersion}/download`,
          };
        }
      } catch (error: unknown) {
        console.error(
          `❌ 安装 ${moduleName} Failed:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // File
    if (config.options?.lockFile !== false) {
      this.saveLock(projectDir, newLock);
      console.log(`\n✓ 已更新 ${this.lockFileName}`);
    }

    console.log(`\n✅ 安装Complete！`);
    console.log(`   新安装: ${installed} 个`);
    console.log(`   已跳过: ${skipped} 个`);
  }

  /**
   * Version，Version
   */
  private async resolveVersion(
    moduleName: string,
    versionRange: string,
    lock: modulesLock | null,
    forceFresh?: boolean
  ): Promise<string> {
    // FileYes，Version
    if (lock && lock.modules[moduleName] && !forceFresh) {
      return lock.modules[moduleName].version;
    }

    // moduleInfo
    const response = await this.api.get<ApiResponse<{ module: moduleInfo }>>(
      `/api/modules/${moduleName}`
    );
    if (!response.success || !response.module) {
      throw new Error('获取moduleInfoFailed');
    }

    const module = response.module;
    const availableVersions = Object.keys(module.versions);

    // Version
    if (versionRange === 'latest' || versionRange === '*') {
      return module.latest;
    }

    //  ^  ~ 
    const cleanVersion = versionRange.replace(/^[\^~]/, '');

    // YesVersion
    if (availableVersions.includes(cleanVersion)) {
      return cleanVersion;
    }

    // NoVersion
    return module.latest;
  }

  /**
   *  .gitignore，module directory
   */
  updateGitignore(projectDir: string): void {
    const gitignorePath = path.join(projectDir, this.gitignoreFileName);
    const ignoreEntries = ['external_modules/', 'local_modules/'];

    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    }

    let modified = false;

    // Directory
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
   * module
   */
  async prune(projectDir: string): Promise<void> {
    const config = this.readConfig(projectDir);
    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    if (!fs.existsSync(absoluteInstallDir)) {
      console.log('📦 module directorydoes not exist');
      return;
    }

    const installedmodules = fs.readdirSync(absoluteInstallDir);
    const configuredmodules = Object.keys(config.externalmodules || {});

    const toRemove = installedmodules.filter((m) => !configuredmodules.includes(m));

    if (toRemove.length === 0) {
      console.log('✓ 没有需要清理的module');
      return;
    }

    console.log(`\n🗑️  清理 ${toRemove.length} 个未使用的module:\n`);

    for (const moduleName of toRemove) {
      const modulePath = path.join(absoluteInstallDir, moduleName);
      fs.removeSync(modulePath);
      console.log(`   ✓ 删除 ${moduleName}`);
    }

    console.log('\n✅ 清理Complete！');
  }

  /**
   * AllmoduleDependencies
   */
  list(projectDir: string): void {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);
    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log('\n📦 外部moduleDependencies:\n');

    if (!config.externalmodules || Object.keys(config.externalmodules).length === 0) {
      console.log('   (无)');
      return;
    }

    for (const [moduleName, versionRange] of Object.entries(config.externalmodules)) {
      const lockedVersion = lock?.modules[moduleName]?.version;
      const isInstalled = fs.existsSync(path.join(absoluteInstallDir, moduleName));

      const status = isInstalled ? '✓' : '✗';
      const versionInfo = lockedVersion ? `${versionRange} (锁定: ${lockedVersion})` : versionRange;

      console.log(`   ${status} ${moduleName}@${versionInfo}`);
    }

    console.log('');
  }
}
