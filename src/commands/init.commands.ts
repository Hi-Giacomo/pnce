import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  validateModuleName,
  normalizeModuleName,
  normalizeCamelCase,
  normalizeFileName,
} from '../utils';
import { getLogger } from '../utils/logger'; // Import getLogger
import { generateMicroservicefiles, createProjectStructure } from '../templates';
import { ErrorHandler } from '../utils/errors';
import { PATHS } from '../constants';

const DEFAULT_MODULE_VERSION = '0.0.1'; // Define constant for default version

const projectTypeAliases: Record<string, string> = {
  // Map for type aliases
  ms: 'microservice',
  sv: 'service',
};

/**
 * Update parent project's package.json localModules
 * @param isLocal - Whether the module is locally created (not from remote)
 */
async function addToParentPackageJson(
  projectDir: string,
  moduleName: string,
  version: string = DEFAULT_MODULE_VERSION,
  isLocal: boolean = false
): Promise<void> {
  const logger = getLogger();
  const packageJsonPath = path.join(projectDir, PATHS.PACKAGE_FILE);

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = await fs.readJson(packageJsonPath);

  // Initialize localModules
  if (!packageJson.localModules) {
    packageJson.localModules = {};
  }

  // Add module with local marker if created locally
  const versionWithMarker = isLocal ? `${version}-local` : version;
  packageJson.localModules[moduleName] = versionWithMarker;

  // Write back
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  logger.info(`✓ Recorded ${moduleName}@${versionWithMarker} to package.json localModules`);
}

/**
 * Update parent project's module.config.json installedModules
 */
async function addToParentModuleConfig(
  projectDir: string,
  moduleName: string,
  version: string = DEFAULT_MODULE_VERSION
): Promise<void> {
  const logger = getLogger();
  const moduleConfigPath = path.join(projectDir, PATHS.MODULE_CONFIG_FILE);

  if (!fs.existsSync(moduleConfigPath)) {
    return;
  }

  const moduleConfig = await fs.readJson(moduleConfigPath);

  // Initialize installedModules
  if (!moduleConfig.installedModules) {
    moduleConfig.installedModules = {};
  }

  // Add module
  moduleConfig.installedModules[moduleName] = version;

  // Write back
  await fs.writeJson(moduleConfigPath, moduleConfig, { spaces: 2 });
  logger.info(`✓ Recorded ${moduleName}@${version} to module.config.json installedModules`);
}

/**
 * Register init commands
 * @param program - Commander program instance
 */
export function registerInitCommands(program: Command): void {
  // Init command
  program
    .command('init [name]')
    .description('Initialize project (microservice or service)')
    .option('-d, --directory <dir>', 'Project directory path (default is current directory)')
    .option(
      '-t, --type <type>',
      'Project type: microservice (microservice) or service (service). Aliases: ms (microservice), sv (service)',
      'service'
    )
    .action(async (name, options) => {
      const logger = getLogger();
      let initialCwd = process.env.INIT_CWD || process.cwd();

      if (process.env.MODULE_INIT_CWD_FILE && fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        initialCwd = fs.readFileSync(process.env.MODULE_INIT_CWD_FILE, 'utf-8').trim();
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }

      let moduleName: string;
      let targetBaseDir: string = options.directory || '';

      if (name) {
        const parsedPath = path.parse(name);
        moduleName = parsedPath.base;
        targetBaseDir = options.directory || parsedPath.dir;
      } else if (options.directory) {
        moduleName = path.basename(options.directory);
      } else {
        moduleName = path.basename(initialCwd);
      }

      const validation = validateModuleName(moduleName);
      if (!validation.valid) {
        logger.error('❌ Module name validation failed:');
        logger.error(String(validation.error));
        logger.error('');
        logger.info('💡 Naming suggestions:');
        logger.info('   - Start with letters: my-module, user-service, demo-app');
        logger.info('   - Can include hyphens or underscores: my_module_1, user-service-v2');
        logger.info('   - Avoid pure numbers or starting with numbers: ❌ 123, 1module');
        return;
      }

      const normalizedClassName = normalizeModuleName(moduleName);
      const normalizedCamelCase = normalizeCamelCase(moduleName);
      const normalizedFileName = normalizeFileName(moduleName);

      let type = options.type;
      if (projectTypeAliases[type]) {
        type = projectTypeAliases[type];
      }

      if (type !== 'microservice' && type !== 'service') {
        logger.error('❌ Project type must be microservice (or ms) or service (or sv)');
        logger.info('💡 Supported aliases:');
        logger.info('   - microservice or ms: Create a microservice module');
        logger.info('   - service or sv: Create a main service');
        return;
      }

      let projectCreationPath: string;
      let displayPath: string;

      if (type === 'microservice') {
        let finalRelativeDir: string;
        if (targetBaseDir.startsWith(PATHS.LOCAL_MODULES_DIR)) {
          finalRelativeDir = targetBaseDir;
        } else {
          finalRelativeDir = path.join(PATHS.LOCAL_MODULES_DIR, targetBaseDir);
        }
        projectCreationPath = path.join(initialCwd, finalRelativeDir, moduleName);
        displayPath = path.join(finalRelativeDir, moduleName);
      } else {
        // type === 'service'
        projectCreationPath = path.join(initialCwd, targetBaseDir, moduleName);
        displayPath = path.join(targetBaseDir, moduleName);
      }

      if (fs.existsSync(projectCreationPath)) {
        logger.error('❌ Directory already exists');
        return;
      }

      logger.info(`\n🚀 Creating ${type} project: ${moduleName}`);
      logger.info(`📁 Target directory: ${displayPath}\n`);

      try {
        if (type === 'microservice') {
          await generateMicroservicefiles(
            projectCreationPath,
            moduleName,
            normalizedClassName,
            normalizedCamelCase,
            normalizedFileName
          );
        } else {
          // type === 'service'
          await createProjectStructure(projectCreationPath, moduleName);
        }
        logger.info(`\n✅ ${type} project ${moduleName} created successfully!\n`);
        logger.info('📋 Next steps:');
        logger.info(`   cd ${path.relative(process.cwd(), projectCreationPath)}`);
        logger.info('   npm install');
        logger.info('   npm run dev\n');

        if (type === 'microservice') {
          // Port allocation removed - users should configure PORT manually
          const envContent = `PORT=3000\n`;
          const envFilePath = path.join(projectCreationPath, '.env');
          await fs.writeFile(envFilePath, envContent);
          logger.info(`✓ Created .env file with default PORT=3000`);

          const parentPackageJsonPath = path.join(initialCwd, 'package.json');
          const isInProjectRoot = fs.existsSync(parentPackageJsonPath);

          if (isInProjectRoot) {
            await addToParentPackageJson(initialCwd, moduleName, DEFAULT_MODULE_VERSION, true);
            await addToParentModuleConfig(initialCwd, moduleName, DEFAULT_MODULE_VERSION);
            logger.info(`✓ Microservice '${moduleName}' registered in parent project.`);
          } else {
            logger.info(`✓ Standalone microservice '${moduleName}' created.`);
          }
        } else {
          // type === 'service'
          logger.info(`✓ Main service '${moduleName}' created.`);
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
