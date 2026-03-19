import { Command } from 'commander';
import { modulesManagerService } from '../services/modules-manager.service';
import { ErrorHandler } from '../utils/errors';

/**
 * Register module dependencies management commands
 * @param program - Commander program instance
 * @param modulesManager - Modules manager service
 */
export function registerModulesManagerCommands(
  program: Command,
  modulesManager: modulesManagerService
): void {
  // Initialize modules.json configuration file
  program
    .command('modules-init')
    .description('Initialize modules.json configuration file')
    .action(() => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.initConfig(projectDir);
        console.log(
          '\n💡 Hint: You can now use the following commands to manage module dependencies:'
        );
        console.log('   yarn cli modules-add <module>     - Add module dependencies');
        console.log('   yarn cli modules-install          - Install all dependencies');
        console.log('   yarn cli modules-list             - View dependencies list');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // Add module dependency
  program
    .command('modules-add <module> [version]')
    .description('Add module to modules.json (example: yarn cli modules-add user ^1.0.0)')
    .option('--no-install', 'Only add to config, do not install immediately')
    .action(async (module, version, options) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.addModule(projectDir, module, version);

        if (options.install !== false) {
          console.log('\n⬇️  Installing module...');
          await modulesManager.installAll(projectDir);
        } else {
          console.log('\n💡 Hint: Run "yarn cli modules-install" to install modules');
        }
      } catch (error: unknown) {
        console.error('Add failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Remove module dependency
  program
    .command('modules-remove <module>')
    .description('Remove module dependency from modules.json')
    .action((module) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.removeModule(projectDir, module);

        console.log('\n💡 Hint: Run "yarn cli modules-prune" to clean up installed modules');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // Install all module dependencies
  program
    .command('modules-install')
    .description('Install all module dependencies according to modules.json')
    .option('--force', 'Force reinstall all modules')
    .action(async (options) => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.installAll(projectDir, { forceFresh: options.force });
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // List all module dependencies
  program
    .command('modules-list')
    .description('List all module dependencies')
    .action(() => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        modulesManager.list(projectDir);
      } catch (error: unknown) {
        console.error('List failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Clean up modules
  program
    .command('modules-prune')
    .description('Clean up installed modules not listed in modules.json')
    .action(async () => {
      try {
        const projectDir = process.env.INIT_CWD || process.cwd();
        await modulesManager.prune(projectDir);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
