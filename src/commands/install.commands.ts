import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { moduleDownloadService } from '../services/module-download.service';
import { modulesManagerService } from '../services/modules-manager.service';
import { ApiService } from '../services/api.service';
import { ErrorHandler, CliError } from '../utils';
import { getConfig } from '../config';
import { ApiResponse, ModuleInformation } from '../types';
import { PATHS } from '../constants';

/**
 * module package.json  localModules
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

  // version，version
  let targetversion = version;
  if (!targetversion) {
    console.log(`Get ${moduleName} Latestversion...`);
    const response = await apiService.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );
    if (!response.success || !response.module) {
      throw new CliError('MODULE_NOT_FOUND', `GetModuleInformationfailed: ${moduleName}`, 404, {
        name: moduleName,
      });
    }
    targetversion = `^${response.module.latest}`;
  }

  //  localModules
  if (!packageJson.localModules) {
    packageJson.localModules = {};
  }

  // module
  packageJson.localModules[moduleName] = targetversion;

  //  package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  console.log(`✓  ${moduleName}@${targetversion}  package.json  localModules`);
}

/**
 * Record module.config.json
 * @param apiService - API service instance
 * @param projectDir - Directory
 * @param moduleName - module name
 * @param version - module version(,version)
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
      installedModules: {},
    };

    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  }

  const moduleConfig = await fs.readJson(moduleConfigPath);

  //  installedModules
  if (!moduleConfig.installedModules) {
    moduleConfig.installedModules = {};
  }

  // version，version
  let targetversion = version;
  if (!targetversion) {
    const response = await apiService.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );
    if (response.success && response.module) {
      targetversion = response.module.latest;
    }
  }

  // Record
  if (targetversion) {
    moduleConfig.installedModules[moduleName] = targetversion;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
    console.log(`✓  ${moduleName}@${targetversion}  module.config.json  installedModules`);
  }
}

/**
 * command
 * @param program - commander program instance
 * @param moduleDownloadService - module
 * @param modulesManager - module
 * @param api - API service instance
 */
export function registerInstallCommands(
  program: Command,
  moduleDownloadService: any,
  modulesManager: any,
  api: ApiService
): void {
  // modulecommand
  program
    .command('install <module>')
    .description('Installmodule（ format: module@version）')
    .option('-p, --port <port>', 'Port（Optional）')
    .option('--link', ' modules.json（Externaldependencies，Storage src/external_modules/）')
    .option('--save', ' package.json  localModules（Local，Storage src/local_modules/）')
    .option('--parallel', 'EnableParallelDownload（Default）')
    .option('--no-parallel', 'DisableParallelDownload')
    .option(
      '--concurrency <num>',
      'Concurrent downloads',
      (value) => parseInt(value),
      getConfig().maxConcurrentDownloads
    )
    .action(async (module, options) => {
      try {
        const initialCwd = process.env.INIT_CWD || process.cwd();

        //  module@version
        const [moduleName, version] = module.split('@');

        // Yes/No --link  --save
        if (options.link && options.save) {
          throw new CliError(
            'INVALID_INPUT',
            'Use --link  --save\n   --link:  modules.json (Externaldependencies)\n   --save:  package.json (Local)'
          );
        }

        // Directory
        let installDir: string;
        let installMode: 'link' | 'save' | 'temp';

        if (options.link) {
          installMode = 'link';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          console.log('✨ : Externaldependencies（ modules.json）\n');
        } else if (options.save) {
          installMode = 'save';
          installDir = PATHS.LOCAL_MODULES_DIR;
          console.log('✨ : Local（ package.json）\n');
        } else {
          // Default
          installMode = 'temp';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          console.log('✨ : TemporaryInstall（dependenciesManage）\n');
          console.log('💡 Hint: Use --link  modules.json， --save  package.json\n');
        }

        //
        if (installMode === 'link') {
          //  modules.json
          await modulesManager.addModule(initialCwd, moduleName, version ? version : undefined);
          await modulesManager.installAll(initialCwd);
        } else if (installMode === 'save') {
          //  package.json  localModules
          await addToPackageJson(api, initialCwd, moduleName, version);

          //
          if (options.parallel) {
            console.log(`🚀 EnableParallelDownload（Concurrent: ${options.concurrency}）`);
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
            console.log(`✓ module ${moduleName} PortConfigure ${options.port}`);
          } else {
            console.log(`  Hint: module ${moduleName}  ${PATHS.MODULE_CONFIG_FILE}，ConfigurePort`);
          }
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // command
  program
    .command('install-batch <modules...>')
    .description('Installmodule（ParallelDownload）')
    .option(
      '--concurrency <num>',
      'Concurrent downloads',
      (value) => parseInt(value),
      getConfig().maxConcurrentDownloads
    )
    .option('--link', ' modules.json')
    .option('--save', ' package.json  localModules')
    .action(async (modules, options) => {
      try {
        // module list
        const moduleList = modules.map((moduleItem: string) => {
          const [name, version] = moduleItem.split('@');
          return { name, version };
        });

        console.log(
          `🚀 Install ${moduleList.length} module（Concurrent: ${options.concurrency}）\n`
        );

        // Directory
        let installDir: string;
        if (options.save) {
          installDir = PATHS.LOCAL_MODULES_DIR;
        } else {
          installDir = PATHS.EXTERNAL_MODULES_DIR;
        }

        //
        await moduleDownloadService.installBatch(moduleList, installDir, options.concurrency);

        console.log(`\n✓ All modulesInstallComplete`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
