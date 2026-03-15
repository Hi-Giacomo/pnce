import * as fs from 'fs-extra';
import * as path from 'path';
import { ApiService } from './api.service';
import { moduleService } from './module.service';
import { modulesConfig, modulesLock, DEFAULT_MODULES_CONFIG } from '../types/modules-config';
import { ApiResponse, ModuleInformation } from '../types';

/**
 * module dependencies
 *  npm  package.json + package-lock.json
 */
export class modulesManagerService {
  private configfileName = 'modules.json';
  private lockfileName = 'modules-lock.json';
  private gitignorefileName = '.gitignore';

  constructor(
    private api: ApiService,
    private moduleService: moduleService
  ) {}

  /**
   *  modules.json file
   */
  initConfig(projectDir: string): void {
    const configPath = path.join(projectDir, this.configfileName);

    if (fs.existsSync(configPath)) {
      console.log('⚠️  modules.json already exists');
      return;
    }

    fs.writeJsonSync(configPath, DEFAULT_MODULES_CONFIG, { spaces: 2 });
    console.log('✓ Create modules.json Configurefile');

    //  .gitignore
    this.updateGitignore(projectDir);
  }

  /**
   *  modules.json
   * @param projectDir - Directory
   * @returns module
   */
  readConfig(projectDir: string): modulesConfig {
    const configPath = path.join(projectDir, this.configfileName);

    if (!fs.existsSync(configPath)) {
      return DEFAULT_MODULES_CONFIG;
    }

    return fs.readJsonSync(configPath);
  }

  /**
   *  modules.json
   */
  saveConfig(projectDir: string, config: modulesConfig): void {
    const configPath = path.join(projectDir, this.configfileName);
    fs.writeJsonSync(configPath, config, { spaces: 2 });
  }

  /**
   * Save modules-lock.json file
   */
  readLock(projectDir: string): modulesLock | null {
    const lockPath = path.join(projectDir, this.lockfileName);

    if (!fs.existsSync(lockPath)) {
      return null;
    }

    return fs.readJsonSync(lockPath);
  }

  /**
   * file
   */
  saveLock(projectDir: string, lock: modulesLock): void {
    const lockPath = path.join(projectDir, this.lockfileName);
    fs.writeJsonSync(lockPath, lock, { spaces: 2 });
  }

  /**
   * module dependencies modules.json
   */
  async addModule(
    projectDir: string,
    moduleName: string,
    versionRange?: string,
    options?: { save?: boolean }
  ): Promise<void> {
    const config = this.readConfig(projectDir);

    // version，version
    let version = versionRange;
    if (!version) {
      console.log(`Get ${moduleName} Latestversion...`);
      const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
        `/api/modules/${moduleName}`
      );
      if (!response.success || !response.module) {
        throw new Error('Getmodule informationfailed');
      }
      version = `^${response.module.latest}`;
    }

    //
    if (!config.externalModules) {
      config.externalModules = {};
    }
    config.externalModules[moduleName] = version;

    //
    if (options?.save !== false) {
      this.saveConfig(projectDir, config);
      console.log(`✓  ${moduleName}@${version}  modules.json`);
    }
  }

  /**
   *  modules.json module
   */
  removeModule(projectDir: string, moduleName: string): void {
    const config = this.readConfig(projectDir);

    if (config.externalModules && config.externalModules[moduleName]) {
      delete config.externalModules[moduleName];
      this.saveConfig(projectDir, config);
      console.log(`✓  modules.json  ${moduleName}`);
    } else {
      console.log(`⚠️  ${moduleName} dependencies listMedium`);
    }
  }

  /**
   * All modules dependencies
   */
  async installAll(projectDir: string, options?: { forceFresh?: boolean }): Promise<void> {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);

    if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
      console.log('📦 InstallExternalmodule');
      return;
    }

    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    // const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log(`\n📦 StartInstallExternalmodule...`);
    console.log(`📁 InstallDirectory: ${installDir}\n`);

    const newLock: modulesLock = {
      modules: {},
      lockfileversion: 1,
      generatedAt: new Date().toISOString(),
    };

    let installed = 0;
    let skipped = 0;

    for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
      try {
        // version，version
        const targetversion = await this.resolveversion(
          moduleName,
          versionRange,
          lock,
          options?.forceFresh
        );

        // module status（Validation）
        const moduleStatus = await this.moduleService.checkModuleStatus(
          moduleName,
          targetversion,
          installDir
        );

        if (moduleStatus.isInstalled && !moduleStatus.needsUpdate && !options?.forceFresh) {
          console.log(`⏭️  ${moduleName}@${targetversion} Install（Skip）`);
          skipped++;

          // Info
          if (lock && lock.modules[moduleName]) {
            newLock.modules[moduleName] = lock.modules[moduleName];
          } else {
            newLock.modules[moduleName] = {
              version: targetversion,
              resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetversion}/download`,
            };
          }
        } else {
          if (moduleStatus.isInstalled && moduleStatus.needsUpdate) {
            console.log(`🔄 ${moduleName} Install（versionCode）...`);
          } else {
            console.log(`⬇️  Install ${moduleName}@${targetversion}...`);
          }
          await this.moduleService.install(moduleName, targetversion, installDir);
          installed++;

          // Recordfile
          newLock.modules[moduleName] = {
            version: targetversion,
            resolved: `${this.api['axiosInstance'].defaults.baseURL}/api/modules/${moduleName}/${targetversion}/download`,
          };
        }
      } catch (error: unknown) {
        console.error(
          `❌ Install ${moduleName} failed:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // file
    if (config.options?.lockfile !== false) {
      this.saveLock(projectDir, newLock);
      console.log(`\n✓ Update ${this.lockfileName}`);
    }

    console.log(`\n✅ InstallComplete！`);
    console.log(`   Install: ${installed} `);
    console.log(`   Skip: ${skipped} `);
  }

  /**
   * version，version
   */
  private async resolveversion(
    moduleName: string,
    versionRange: string,
    lock: modulesLock | null,
    forceFresh?: boolean
  ): Promise<string> {
    // fileYes，version
    if (lock && lock.modules[moduleName] && !forceFresh) {
      return lock.modules[moduleName].version;
    }

    // module information
    const response = await this.api.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );
    if (!response.success || !response.module) {
      throw new Error('Getmodule informationfailed');
    }

    const module = response.module;
    const availableversions = Object.keys(module.versions);

    // version
    if (versionRange === 'latest' || versionRange === '*') {
      return module.latest;
    }

    //  ^  ~
    const cleanversion = versionRange.replace(/^[\^~]/, '');

    // Yesversion
    if (availableversions.includes(cleanversion)) {
      return cleanversion;
    }

    // Noversion
    return module.latest;
  }

  /**
   *  .gitignore，module directory
   */
  updateGitignore(projectDir: string): void {
    const gitignorePath = path.join(projectDir, this.gitignorefileName);
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
      console.log(`✓ Update .gitignore`);
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
      console.log('📦 module directory does not exist');
      return;
    }

    const installedModules = fs.readdirSync(absoluteInstallDir);
    const configuredmodules = Object.keys(config.externalModules || {});

    const toRemove = installedModules.filter((m) => !configuredmodules.includes(m));

    if (toRemove.length === 0) {
      console.log('✓ Cleanmodule');
      return;
    }

    console.log(`\n🗑️  Clean ${toRemove.length} Usemodule:\n`);

    for (const moduleName of toRemove) {
      const modulePath = path.join(absoluteInstallDir, moduleName);
      fs.removeSync(modulePath);
      console.log(`   ✓ Delete ${moduleName}`);
    }

    console.log('\n✅ CleanComplete！');
  }

  /**
   * All modules dependencies
   */
  list(projectDir: string): void {
    const config = this.readConfig(projectDir);
    const lock = this.readLock(projectDir);
    const installDir = config.options?.installDir || DEFAULT_MODULES_CONFIG.options!.installDir!;
    const absoluteInstallDir = path.resolve(projectDir, installDir);

    console.log('\n📦 Externalmodule dependencies:\n');

    if (!config.externalModules || Object.keys(config.externalModules).length === 0) {
      console.log('   ()');
      return;
    }

    for (const [moduleName, versionRange] of Object.entries(config.externalModules)) {
      const lockedversion = lock?.modules[moduleName]?.version;
      const isInstalled = fs.existsSync(path.join(absoluteInstallDir, moduleName));

      const status = isInstalled ? '✓' : '✗';
      const versionInfo = lockedversion ? `${versionRange} (: ${lockedversion})` : versionRange;

      console.log(`   ${status} ${moduleName}@${versionInfo}`);
    }

    console.log('');
  }
}
