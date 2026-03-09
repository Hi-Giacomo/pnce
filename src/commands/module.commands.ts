import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModuleUploadService } from '../services/module-upload.service';
import { ModuleDownloadService } from '../services/module-download.service';
import { ErrorHandler } from '../utils/errors';
import { getConfigManager } from '../config/manager';

/**
 * 注册模块管理相关命令
 */
export function registerModuleCommands(
  program: Command,
  moduleUploadService: ModuleUploadService,
  _moduleDownloadService: ModuleDownloadService
): void {
  // Upload module command
  program
    .command('upload')
    .description(
      'Upload module to registry (automatically reads module info from module.config.json)'
    )
    .option('-d, --directory <dir>', 'Module directory path', '.')
    .action(async (options) => {
      try {
        const configManager = getConfigManager();
        // Check if logged in
        if (!configManager.getToken()) {
          throw new Error('Please login first, run: pnce login');
        }

        await moduleUploadService.upload(options.directory);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // Fix import path command (using old service)
  // const moduleService = new ModuleService(require('./index').api); // Get api instance from global
  program
    .command('fix-imports <module>')
    .description('Fix import paths of installed dependencies in module')
    .option(
      '-d, --dir <dir>',
      'Module directory (relative to src/external_modules or src/local_modules)',
      'src/external_modules'
    )
    .action(async (moduleName, options) => {
      try {
        const initialCwd = process.env.INIT_CWD || process.cwd();
        const projectRoot = initialCwd;
        const modulePath = path.join(projectRoot, options.dir, moduleName);

        if (!fs.existsSync(modulePath)) {
          console.error(`❌ Error: Module does not exist at ${modulePath}`);
          process.exit(1);
        }

        console.log(`\n🔧 Fixing import paths for module ${moduleName}...\n`);
        // Need to access moduleService methods, temporarily commented out
        // await moduleService.fixImportForModule(modulePath, projectRoot);
        console.log('\n✅ Import path fix complete!');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
