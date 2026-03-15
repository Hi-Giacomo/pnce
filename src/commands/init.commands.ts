import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import {
  validateModuleName,
  normalizeModuleName,
  normalizeCamelCase,
  normalizeFileName,
} from '../utils';
import { generateMicroservicefiles, createProjectStructure } from '../templates';
import { ErrorHandler } from '../utils/errors';
import { PATHS } from '../constants';

/**
 * Update parent project's package.json localModules
 * @param isLocal - Whether the module is locally created (not from remote)
 */
async function addToParentPackageJson(
  projectDir: string,
  moduleName: string,
  version: string = '0.0.1',
  isLocal: boolean = false
): Promise<void> {
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
  console.log(`✓ Recorded ${moduleName}@${versionWithMarker} to package.json localModules`);
}

/**
 * Update parent project's module.config.json installedModules
 */
async function addToParentModuleConfig(
  projectDir: string,
  moduleName: string,
  version: string = '0.0.1'
): Promise<void> {
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
  console.log(`✓ Recorded ${moduleName}@${version} to module.config.json installedModules`);
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
      'Project type: microservice (microservice) or service (service)',
      'service'
    )
    .action(async (name, options) => {
      // Determine working directory
      let initialCwd = process.env.INIT_CWD || process.cwd();

      // Read from environment variable file
      if (process.env.MODULE_INIT_CWD_FILE && fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        initialCwd = fs.readFileSync(process.env.MODULE_INIT_CWD_FILE, 'utf-8').trim();
        // Clean up the file
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }

      let targetDir;
      if (name) {
        // Module name provided, use as subdirectory
        targetDir = path.resolve(initialCwd, name);
      } else {
        // No name provided, use -d directory or current directory
        targetDir = options.directory ? path.resolve(initialCwd, options.directory) : initialCwd;
      }

      // Get module name
      const moduleName = name || path.basename(targetDir);

      // Validate module name
      const validation = validateModuleName(moduleName);
      if (!validation.valid) {
        console.error('❌ Module name validation failed:');
        console.error(validation.error);
        console.error('');
        console.error('💡 Naming suggestions:');
        console.error('   - Start with letters: my-module, user-service, demo-app');
        console.error('   - Can include hyphens or underscores: my_module_1, user-service-v2');
        console.error('   - Avoid pure numbers or starting with numbers: ❌ 123, 1module');
        return;
      }

      // Normalize module name
      const normalizedClassName = normalizeModuleName(moduleName);
      const normalizedCamelCase = normalizeCamelCase(moduleName);
      const normalizedFileName = normalizeFileName(moduleName);

      // Validate project type
      if (options.type !== 'microservice' && options.type !== 'service') {
        console.error('❌ Project type must be microservice or service');
        return;
      }

      // Service type
      if (options.type === 'service') {
        const projectPath = targetDir;
        if (fs.existsSync(projectPath)) {
          console.error('❌ Directory already exists');
          return;
        }

        console.log(`\n🚀 Creating service project: ${moduleName}`);
        console.log(`📁 Target directory: ${projectPath}\n`);

        try {
          await createProjectStructure(projectPath, moduleName);
          console.log(`\n✅ Service project ${moduleName} created successfully!\n`);
          console.log('📋 Next steps:');
          console.log(`   cd ${moduleName}`);
          console.log('   npm install');
          console.log('   npm run dev\n');
        } catch (error) {
          ErrorHandler.handle(error);
        }
        return;
      }

      // Microservice type
      // Check if we're in a project root (has package.json)
      const parentPackageJsonPath = path.join(initialCwd, 'package.json');
      const isInProjectRoot = fs.existsSync(parentPackageJsonPath);

      let actualTargetDir: string;
      let parentProjectDir: string | null = null;

      if (isInProjectRoot) {
        // We're in a project, create in src/local_modules/
        parentProjectDir = initialCwd;
        actualTargetDir = path.join(initialCwd, PATHS.LOCAL_MODULES_DIR, moduleName);
        console.log(`\n🚀 Creating microservice in src/local_modules/: ${moduleName}`);
      } else {
        // Not in a project, create in specified directory
        actualTargetDir = targetDir;
        console.log(`\n🚀 Creating standalone microservice: ${moduleName}`);
      }

      // Check if already exists
      if (fs.existsSync(actualTargetDir)) {
        console.log('❌ Directory already exists');
        return;
      }

      // Create directory
      fs.ensureDirSync(actualTargetDir);

      // Generate microservice
      await generateMicroservicefiles(
        actualTargetDir,
        moduleName,
        normalizedClassName,
        normalizedCamelCase,
        normalizedFileName
      );

      // If in project, record to parent project's config files
      if (parentProjectDir) {
        await addToParentPackageJson(parentProjectDir, moduleName, '0.0.1', true);
        await addToParentModuleConfig(parentProjectDir, moduleName, '0.0.1');
      }

      console.log(`\n✅ Microservice ${moduleName} created successfully!`);
    });
}
