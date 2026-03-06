import { Command } from 'commander';
import chalk from 'chalk';
import { getAliasManager } from '../utils/alias-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * 别名命令
 */
export const aliasCommand = new Command('alias')
  .description('管理命令别名')
  .action(() => {
    const aliasManager = getAliasManager();
    const aliases = aliasManager.list();

    console.log(chalk.cyan('\n命令别名 / Command Aliases\n'));

    if (Object.keys(aliases).length === 0) {
      console.log(chalk.gray('暂无别名 / No aliases configured\n'));
    } else {
      console.log(chalk.white('别名 -> 命令 / Alias -> Command\n'));
      Object.entries(aliases).forEach(([alias, command]) => {
        console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
      });
      console.log();
    }

    console.log(chalk.gray('使用方法 / Usage:'));
    console.log('  pnce alias add <alias> <command>  - 添加别名 / Add alias');
    console.log('  pnce alias remove <alias>         - 移除别名 / Remove alias');
    console.log('  pnce alias clear                 - 清空别名 / Clear all aliases');
    console.log('  pnce alias list                   - 列出别名 / List aliases');
  });

/**
 * 添加别名子命令
 */
export const addAliasCommand = new Command('add')
  .argument('<alias>', '别名名称')
  .argument('<command>', '原始命令（可用空格分隔参数）')
  .description('添加命令别名')
  .action((alias: string, command: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.add(alias, command);
      console.log(chalk.green(`✓ 别名已添加: ${alias} -> ${command}`));
      logger.info(`别名已添加: ${alias} -> ${command}`);
    } catch (error) {
      console.log(chalk.red(`添加别名失败: ${error}`));
      logger.error('添加别名失败', error instanceof Error ? error : new Error(String(error)));
    }
  });

/**
 * 移除别名子命令
 */
export const removeAliasCommand = new Command('remove')
  .argument('<alias>', '别名名称')
  .description('移除命令别名')
  .action((alias: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.remove(alias);
      console.log(chalk.green(`✓ 别名已移除: ${alias}`));
      logger.info(`别名已移除: ${alias}`, { alias });
    } catch (error) {
      console.log(chalk.red(`移除别名失败: ${error}`));
      logger.error('移除别名失败', { error });
    }
  });

/**
 * 列出别名子命令
 */
export const listAliasCommand = new Command('list')
  .description('列出所有别名')
  .action(() => {
    const aliasManager = getAliasManager();
    const aliases = aliasManager.list();

    console.log(chalk.cyan('\n别名列表 / Alias List:\n'));

    if (Object.keys(aliases).length === 0) {
      console.log(chalk.gray('暂无别名 / No aliases configured\n'));
    } else {
      Object.entries(aliases).forEach(([alias, command]) => {
        console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
      });
      console.log();
    }
  });

/**
 * 清空别名子命令
 */
export const clearAliasCommand = new Command('clear')
  .description('清空所有别名')
  .action(() => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.clear();
      console.log(chalk.green('✓ 所有别名已清空'));
      logger.info('所有别名已清空');
    } catch (error) {
      console.log(chalk.red(`清空别名失败: ${error}`));
      logger.error('清空别名失败', { error });
    }
  });

export function register(program: Command): void {
  const aliasCmd = program.addCommand(aliasCommand);
  aliasCmd.addCommand(addAliasCommand);
  aliasCmd.addCommand(removeAliasCommand);
  aliasCmd.addCommand(listAliasCommand);
  aliasCmd.addCommand(clearAliasCommand);
}
