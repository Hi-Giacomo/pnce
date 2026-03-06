import { Command } from 'commander';
import chalk from 'chalk';
import { getPluginSystem } from '../utils/plugin-system';

/**
 * 插件命令
 */
export const pluginCommand = new Command('plugin')
  .description('管理插件系统')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 插件系统 / Plugin System\n'));

    if (plugins.length === 0) {
      console.log(chalk.gray('暂无已安装插件 / No plugins installed\n'));
    } else {
      plugins.forEach(plugin => {
        console.log(chalk.green(`  ${plugin.name}`));
        console.log(chalk.gray(`    版本: ${plugin.version}`));
        if (plugin.description) {
          console.log(chalk.gray(`    描述: ${plugin.description}`));
        }
        if (plugin.author) {
          console.log(chalk.gray(`    作者: ${plugin.author}`));
        }
        console.log();
      });
    }

    console.log(chalk.gray('使用方法 / Usage:'));
    console.log('  pnce plugin list       - 列出所有插件 / List all plugins');
    console.log('  pnce plugin enable     - 启用插件功能说明 / Show info');
    console.log(chalk.gray('\n注意 / Note: 插件系统目前仅支持内置插件'));
  });

/**
 * 列出插件子命令
 */
export const listPluginCommand = new Command('list')
  .description('列出所有已安装的插件')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 插件列表 / Plugin List\n'));

    if (plugins.length === 0) {
      console.log(chalk.gray('暂无已安装插件 / No plugins installed\n'));
    } else {
      plugins.forEach(plugin => {
        console.log(chalk.green(`  ${plugin.name}`));
        console.log(chalk.gray(`    版本 / Version: ${plugin.version}`));
        if (plugin.description) {
          console.log(chalk.gray(`    描述 / Description: ${plugin.description}`));
        }
        if (plugin.author) {
          console.log(chalk.gray(`    作者 / Author: ${plugin.author}`));
        }
        console.log();
      });
    }
  });

/**
 * 插件信息子命令
 */
export const infoPluginCommand = new Command('info')
  .description('显示插件系统信息')
  .action(() => {
    const pluginSystem = getPluginSystem();
    const plugins = pluginSystem.list();

    console.log(chalk.cyan('\n🔌 插件系统信息 / Plugin System Info\n'));

    console.log(chalk.white('插件目录 / Plugins Directory:'));
    console.log(chalk.gray(`  ${pluginSystem.getPluginsDir()}`));

    console.log(chalk.white('\n已安装插件 / Installed Plugins:'));
    console.log(chalk.gray(`  ${plugins.length} 个插件 / ${plugins.length} plugins`));

    console.log(chalk.white('\n系统状态 / System Status:'));
    console.log(chalk.green('  ✓ 插件系统已就绪 / Plugin system ready'));

    console.log(chalk.gray('\n插件功能 / Plugin Features:'));
    console.log(chalk.gray('  • 命令扩展 / Command extension'));
    console.log(chalk.gray('  • 钩子系统 / Hook system'));
    console.log(chalk.gray('  • 配置验证 / Config validation'));
    console.log(chalk.gray('  • 事件追踪 / Event tracking'));

    console.log(chalk.gray('\n开发文档 / Development Docs:'));
    console.log(chalk.gray('  查看源码了解插件开发接口'));
    console.log(chalk.gray('  Check source code for plugin development API\n'));
  });

export function register(program: Command): void {
  const pluginCmd = program.addCommand(pluginCommand);
  pluginCmd.addCommand(listPluginCommand);
  pluginCmd.addCommand(infoPluginCommand);
}
