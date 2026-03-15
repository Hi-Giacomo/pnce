import { Command } from 'commander';
import chalk from 'chalk';
import { getPluginSystem } from '../utils/plugin-system';

/**
 * Plugin command
 */
export const plugincommand = new Command('plugin')
  .description('Manage plugin system')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 Plugin System\n'));

    if (plugins.length === 0) {
      console.log(chalk.gray('No plugins installed\n'));
    } else {
      plugins.forEach((plugin) => {
        console.log(chalk.green(`  ${plugin.name}`));
        console.log(chalk.gray(`    version: ${plugin.version}`));
        if (plugin.description) {
          console.log(chalk.gray(`    Description: ${plugin.description}`));
        }
        if (plugin.author) {
          console.log(chalk.gray(`    Author: ${plugin.author}`));
        }
        console.log();
      });
    }

    console.log(chalk.gray('Usage:'));
    console.log('  pnce plugin list       - List all plugins');
    console.log('  pnce plugin enable     - Show plugin info');
    console.log(chalk.gray('\nNote: Plugin system currently only supports built-in plugins'));
  });

/**
 * List plugins subcommand
 */
export const listPlugincommand = new Command('list')
  .description('List all installed plugins')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 Plugin List\n'));

    if (plugins.length === 0) {
      console.log(chalk.gray('No plugins installed\n'));
    } else {
      plugins.forEach((plugin) => {
        console.log(chalk.green(`  ${plugin.name}`));
        console.log(chalk.gray(`    version: ${plugin.version}`));
        if (plugin.description) {
          console.log(chalk.gray(`    Description: ${plugin.description}`));
        }
        if (plugin.author) {
          console.log(chalk.gray(`    Author: ${plugin.author}`));
        }
        console.log();
      });
    }
  });

/**
 * Plugin info subcommand
 */
export const infoPlugincommand = new Command('info')
  .description('Show plugin system information')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 Plugin System Info\n'));

    console.log(chalk.white('Plugins Directory:'));
    console.log(chalk.gray(`  ${pluginSystem.getPluginsDir()}`));

    console.log(chalk.white('\nInstalled Plugins:'));
    console.log(chalk.gray(`  ${plugins.length} plugins`));

    console.log(chalk.white('\nSystem Status:'));
    console.log(chalk.green('  ✓ Plugin system ready'));

    console.log(chalk.gray('\nPlugin Features:'));
    console.log(chalk.gray('  • command extension'));
    console.log(chalk.gray('  • Hook system'));
    console.log(chalk.gray('  • Config validation'));
    console.log(chalk.gray('  • Event tracking'));

    console.log(chalk.gray('\nDevelopment Docs:'));
    console.log(chalk.gray('  check source code for plugin development API\n'));
  });

export function register(program: Command): void {
  const pluginCmd = program.addCommand(plugincommand);
  pluginCmd.addCommand(listPlugincommand);
  pluginCmd.addCommand(infoPlugincommand);
}
