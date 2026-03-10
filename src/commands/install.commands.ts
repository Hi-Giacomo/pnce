import { command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { moduleDownloadService } from '../services/module-download.service';
import { modulesManagerService } from '../services/modules-manager.service';
import { ApiService } from '../services/api.service';
import { ErrorHandler, CliError } from '../utils';
import { getConfig } from '../config';
import { ApiResponse, moduleInfo } from '../types';
import { PATHS } from '../constants';

/**
 * module package.json  localmodules 
 */
async function addToPackageJson(
  apiService: ApiService,
  projectDir: string,
  moduleName: string,
  version?: string
): Promise<void> {
  const packageJsonPath = path.join(projectDir, PATHS.PACKAGE_FILE);

  if (!fs.existsSync(packageJsonPath)) {
    throw new CliError('FILE_NOT_FOUND', `${PATHS.PACKAGE_FILE} does not exist`, 404);
  }

  const packageJson = await fs.readJson(packageJsonPath);

  // Version，Version
  let targetVersion = version;
  if (!targetVersion) {
    console.log(`获取 ${moduleName} 的最新Version...`);
    const response = await apiService.get<ApiResponse<{ module: moduleInfo }>>(
      `/api/modules/${moduleName}`
    );
    if (!response.success || !response.module) {
      throw new CliError('MODULE_NOT_FOUND', `获取moduleInfoFailed: ${moduleName}`, 404, {
        name: moduleName,
      });
    }
    targetVersion = `^${response.module.latest}`;
  }

  //  localmodules 
  if (!packageJson.localmodules) {
    packageJson.localmodules = {};
  }

  // module
  packageJson.localmodules[moduleName] = targetVersion;

  //  package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  console.log(`✓ 已添加 ${moduleName}@${targetVersion} 到 package.json 的 localmodules`);
}

/**
 * Record module.config.json
 * @param apiService - API service instance
 * @param projectDir - Directory
 * @param moduleName - module name
 * @param version - module version(,Version)
 */
async function addTomoduleConfig(
  apiService: ApiService,
  projectDir: string,
  moduleName: string,
  version?: string
): Promise<void> {
  const moduleConfigPath = path.join(projectDir, PATHS.MODULE_CONFIG_FILE);

  if (!fs.existsSync(moduleConfigPath)) {
    //  module.config.json，
    const packageJsonPath = path.join(projectDir, PATHS.PACKAGE_FILE);
    const packageJson = fs.existsSync(packageJsonPath) ? await fs.readJson(packageJsonPath) : {};

    const moduleConfig = {
      name: packageJson.name || 'unknown',
      description: packageJson.description || '',
      author: packageJson.author || 'module-author',
      version: packageJson.version || '1.0.0',
      type: 'service' as const,
      appId: '',
      teamId: '',
      installedmodules: {},
    };

    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  const moduleConfig = await fs.readJson(moduleConfigPath);

  //  installedmodules 
  if (!moduleConfig.installedmodules) {
    moduleConfig.installedmodules = {};
  }

  // Version，Version
  let targetVersion = version;
  if (!targetVersion) {
    const response = await apiService.get<ApiResponse<{ module: moduleInfo }>>(
      `/api/modules/${moduleName}`
    );
    if (response.success && response.module) {
      targetVersion = response.module.latest;
    }
  }

  // Record
  if (targetVersion) {
    moduleConfig.installedmodules[moduleName] = targetVersion;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
    console.log(
      `✓ 已添加 ${moduleName}@${targetVersion} 到 module.config.json 的 installedmodules`
    );
  }
}

/**
 * command
 * @param program - commander program instance
 * @param moduleDownloadService - module
 * @param modulesManager - module
 * @param api - API service instance
 */
export function registerInstallcommands(
  program: command,
  moduleDownloadService: moduleDownloadService,
  modulesManager: modulesManagerService,
  api: ApiService
): void {
  // modulecommand
  program
    .command('install <module>')
    .description('安装module（支持 format: module@version）')
    .option('-p, --port <port>', '指定Port（可选）')
    .option('--link', '添加到 modules.json（外部Dependencies，Storage在 src/external_modules/）')
    .option('--save', '添加到 package.json 的 localmodules（Local集成，Storage在 src/local_modules/）')
    .option('--parallel', '启用并行下载（Default开启）')
    .option('--no-parallel', '禁用并行下载')
    .option(
      '--concurrency <num>',
      'Concurrent Downloads',
      (value) => parseInt(value),
      getConfig().maxConcurrentDownloads
    )
    .action(async (module, options) => {
      try {
        const initialCwd = process.env.INIT_CWD || process.cwd();

        //  module@version 
        const [moduleName, version] = module.split('@');

        // YesNo --link  --save
        if (options.link && options.save) {
          throw new CliError(
            'INVALID_INPUT',
            '不能同时使用 --link 和 --save\n   --link: 添加到 modules.json (外部Dependencies)\n   --save: 添加到 package.json (Local集成)'
          );
        }

        // Directory
        let installDir: string;
        let installMode: 'link' | 'save' | 'temp';

        if (options.link) {
          installMode = 'link';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          console.log('✨ 模式: 外部Dependencies（添加到 modules.json）\n');
        } else if (options.save) {
          installMode = 'save';
          installDir = PATHS.LOCAL_MODULES_DIR;
          console.log('✨ 模式: Local集成（添加到 package.json）\n');
        } else {
          // Default
          installMode = 'temp';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          console.log('✨ 模式: 临时安装（不加入Dependencies管理）\n');
          console.log('💡 Hint: 使用 --link 添加到 modules.json，或 --save 添加到 package.json\n');
        }

        // 
        if (installMode === 'link') {
          //  modules.json 
          await modulesManager.addmodule(initialCwd, moduleName, version ? version : undefined);
          await modulesManager.installAll(initialCwd);
        } else if (installMode === 'save') {
          //  package.json  localmodules 
          await addToPackageJson(api, initialCwd, moduleName, version);

          // 
          if (options.parallel) {
            console.log(`🚀 启用并行下载（并发数: ${options.concurrency}）`);
          }

          await moduleDownloadService.install(moduleName, version, installDir);
        } else {
          // 
          await moduleDownloadService.install(moduleName, version, installDir);
        }

        // Record module.config.json
        await addTomoduleConfig(api, initialCwd, moduleName, version);

        // Port，module
        if (options.port) {
          const moduleConfigPath = path.join(
            initialCwd,
            installDir,
            moduleName,
            PATHS.MODULE_CONFIG_FILE
          );

          if (fs.existsSync(moduleConfigPath)) {
            const config = await fs.readJson(moduleConfigPath);
            config.port = parseInt(options.port);
            await fs.writeJson(moduleConfigPath, config, { spaces: 2 });
            console.log(`✓ module ${moduleName} Port已配置为 ${options.port}`);
          } else {
            console.log(
              `  Hint: module ${moduleName} 没有 ${PATHS.MODULE_CONFIG_FILE}，无法配置Port`
            );
          }
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // command
  program
    .command('install-batch <modules...>')
    .description('批量安装module（并行下载）')
    .option(
      '--concurrency <num>',
      'Concurrent Downloads',
      (value) => parseInt(value),
      getConfig().maxConcurrentDownloads
    )
    .option('--link', '添加到 modules.json')
    .option('--save', '添加到 package.json 的 localmodules')
    .action(async (modules, options) => {
      try {
        // moduleList
        const moduleList = modules.map((module: string) => {
          const [name, version] = module.split('@');
          return { name, version };
        });

        console.log(`🚀 批量安装 ${moduleList.length} 个module（并发数: ${options.concurrency}）\n`);

        // Directory
        let installDir: string;
        if (options.save) {
          installDir = PATHS.LOCAL_MODULES_DIR;
        } else {
          installDir = PATHS.EXTERNAL_MODULES_DIR;
        }

        // 
        await moduleDownloadService.installBatch(moduleList, installDir, options.concurrency);

        console.log(`\n✓ Allmodule安装Complete`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
