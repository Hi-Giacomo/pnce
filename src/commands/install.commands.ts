import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModuleDownloadService } from '../services/module-download.service';
import { ApiService } from '../services/api.service';
import { ErrorHandler, CliError } from '../utils';
import { getConfig } from '../config';
import { ApiResponse, ModuleInformation } from '../types';
import { PATHS } from '../constants';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Add module to package.json localModules
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

  // Get latest version if not specified
  let targetversion = version;
  if (!targetversion) {
    logger.info(`Getting latest version for module: ${moduleName}...`);
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

  // Initialize localModules if not exists
  if (!packageJson.localModules) {
    packageJson.localModules = {};
  }

  // Add module to localModules
  packageJson.localModules[moduleName] = targetversion;

  // Write to package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  logger.info(`Added ${moduleName}@${targetversion} to package.json localModules`);
}

/**
 * Record module in module.config.json
 * @param apiService - API service instance
 * @param projectDir - Directory
 * @param moduleName - module name
 * @param version - module version (optional)
 */
async function addTomoduleConfig(
  apiService: ApiService,
  projectDir: string,
  moduleName: string,
  version?: string
): Promise<void> {
  const moduleConfigPath = path.join(projectDir, PATHS.MODULE_CONFIG_FILE);

  if (!fs.existsSync(moduleConfigPath)) {
    // If module.config.json does not exist, create it from package.json
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

  // Initialize installedModules if not exists
  if (!moduleConfig.installedModules) {
    moduleConfig.installedModules = {};
  }

  // Get latest version if not specified
  let targetversion = version;
  if (!targetversion) {
    const response = await apiService.get<ApiResponse<{ module: ModuleInformation }>>(
      `/api/modules/${moduleName}`
    );
    if (response.success && response.module) {
      targetversion = response.module.latest;
    }
  }

  // Record installed module
  if (targetversion) {
    moduleConfig.installedModules[moduleName] = targetversion;
    await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
    logger.info(`Recorded ${moduleName}@${targetversion} in module.config.json installedModules`);
  }
}

/**
 * Register install commands
 * @param program - commander program instance
 * @param moduleDownloadService - module download service
 * @param api - API service instance
 */
export function registerInstallCommands(
  program: Command,
  moduleDownloadService: ModuleDownloadService,
  api: ApiService
): void {
  // Install module command
  program
    .command('install <module>')
    .description('Install module (format: module@version)')
    .option('-p, --port <port>', 'Port (Optional)')
    .option(
      '--link',
      'Link to modules.json (external dependencies, stored in src/external_modules/)'
    )
    .option('--save', 'Save to package.json localModules (local, stored in src/local_modules/)')
    .option('--parallel', 'Enable parallel download (default)')
    .option('--no-parallel', 'Disable parallel download')
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

        // Check --link and --save options
        if (options.link && options.save) {
          throw new CliError(
            'INVALID_INPUT',
            'Cannot use both --link and --save.\n   --link: Links to modules.json (external dependencies).\n   --save: Saves to package.json (local modules).'
          );
        }

        // Installation directory
        let installDir: string;
        let installMode: 'link' | 'save' | 'temp';

        if (options.link) {
          installMode = 'link';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          logger.info('Installation mode: External dependencies (modules.json)');
          console.log('✨ Installation mode: External dependencies (modules.json)\n');
        } else if (options.save) {
          installMode = 'save';
          installDir = PATHS.LOCAL_MODULES_DIR;
          logger.info('Installation mode: Local (package.json)');
          console.log('✨ Installation mode: Local (package.json)\n');
        } else {
          // Default
          installMode = 'temp';
          installDir = PATHS.EXTERNAL_MODULES_DIR;
          logger.info('Installation mode: Temporary install (dependency management)');
          console.log('✨ Installation mode: Temporary install (dependency management)\n');
          logger.info('Hint: Use --link to add to modules.json, --save to add to package.json');
          console.log(
            '💡 Hint: Use --link to add to modules.json, --save to add to package.json\n'
          );
        }

        // Perform the installation
        await moduleDownloadService.install(moduleName, version, installDir);

        // Record in module.config.json
        await addTomoduleConfig(api, initialCwd, moduleName, version);

        // Configure port for the module
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
            logger.info(`Module ${moduleName} port configured to ${options.port}`);
            console.log(`✓ Module ${moduleName} port configured to ${options.port}`);
          } else {
            logger.warn(
              `Module ${moduleName} does not have a ${PATHS.MODULE_CONFIG_FILE}. Cannot configure port.`
            );
            console.log(
              `  Hint: Module ${moduleName} does not have a ${PATHS.MODULE_CONFIG_FILE}. Cannot configure port.`
            );
          }
        } else {
          // Auto-allocate port if not specified
          const moduleDir = path.join(initialCwd, installDir, moduleName);
          const moduleConfigPath = path.join(moduleDir, PATHS.MODULE_CONFIG_FILE);

          if (fs.existsSync(moduleConfigPath)) {
            const config = await fs.readJson(moduleConfigPath);

            // Port configuration notice
            if (!config.port) {
              logger.info(`⚠️  No port configured for ${moduleName}, using default`);
              console.log(`⚠️  No port configured for ${moduleName}, using default`);
            } else {
              logger.info(`✓ Port configured: ${config.port} for ${moduleName}`);
              console.log(`✓ Port configured: ${config.port} for ${moduleName}`);
            }
          }
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // Install batch command
  program
    .command('install-batch <modules...>')
    .description('Install modules in batch (Parallel Download)')
    .option(
      '--concurrency <num>',
      'Number of concurrent downloads',
      (value) => parseInt(value),
      getConfig().maxConcurrentDownloads
    )
    .option('--link', 'Link to modules.json')
    .option('--save', 'Save to package.json localModules')
    .action(async (modules, options) => {
      try {
        // Process module list
        const moduleList = modules.map((moduleItem: string) => {
          const [name, version] = moduleItem.split('@');
          return { name, version };
        });

        logger.info(`Installing ${moduleList.length} modules (Concurrent: ${options.concurrency})`);
        console.log(
          `🚀 Installing ${moduleList.length} modules (Concurrent: ${options.concurrency})\n`
        );

        // Determine installation directory
        let installDir: string;
        if (options.save) {
          installDir = PATHS.LOCAL_MODULES_DIR;
        } else {
          installDir = PATHS.EXTERNAL_MODULES_DIR;
        }

        // Perform batch installation
        await moduleDownloadService.installBatch(moduleList, installDir, options.concurrency);

        logger.info(`All modules installed successfully.`);
        console.log(`\n✓ All modules installed successfully`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
