import { Command } from 'commander';
import chalk from 'chalk';
import { getAliasManager } from '../utils/alias-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Alias command
 */
export const aliasCommand = new Command('alias')
  .description('Manage command aliases')
  .action(() => {
    const aliasManager = getAliasManager();
    const aliases = aliasManager.list();

    console.log(chalk.cyan('\nCommand Aliases\n'));

    if (Object.keys(aliases).length === 0) {
      console.log(chalk.gray('No aliases configured\n'));
    } else {
      console.log(chalk.white('Alias -> Command\n'));
      Object.entries(aliases).forEach(([alias, command]) => {
        console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
      });
      console.log();
    }

    console.log(chalk.gray('Usage:'));
    console.log('  pnce alias add <alias> <command>  - Add alias');
    console.log('  pnce alias remove <alias>         - Remove alias');
    console.log('  pnce alias clear                 - Clear all aliases');
    console.log('  pnce alias list                   - List aliases');
  });

/**
 * Add alias subcommand
 */
export const addAliasCommand = new Command('add')
  .argument('<alias>', 'Alias name')
  .argument('<command>', 'Original command (arguments can be separated by spaces)')
  .description('Add command alias')
  .action((alias: string, command: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.add(alias, command);
      console.log(chalk.green(`✓ Alias added: ${alias} -> ${command}`));
      logger.info(`Alias added: ${alias} -> ${command}`);
    } catch (error) {
      console.log(chalk.red(`Failed to add alias: ${error}`));
      logger.error(
        'Failed to add alias',
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
    }
  });

/**
 * Remove alias subcommand
 */
export const removeAliasCommand = new Command('remove')
  .argument('<alias>', 'Alias name')
  .description('Remove command alias')
  .action((alias: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.remove(alias);
      console.log(chalk.green(`✓ Alias removed: ${alias}`));
      logger.info(`Alias removed: ${alias}`, { alias });
    } catch (error) {
      console.log(chalk.red(`Failed to remove alias: ${error}`));
      logger.error('Failed to remove alias', { error });
    }
  });

/**
 * List aliases subcommand
 */
export const listAliasCommand = new Command('list').description('List all aliases').action(() => {
  const aliasManager = getAliasManager();
  const aliases = aliasManager.list();

  console.log(chalk.cyan('\nAlias List:\n'));

  if (Object.keys(aliases).length === 0) {
    console.log(chalk.gray('No aliases configured\n'));
  } else {
    Object.entries(aliases).forEach(([alias, command]) => {
      console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
    });
    console.log();
  }
});

/**
 * Clear aliases subcommand
 */
export const clearAliasCommand = new Command('clear')
  .description('Clear all aliases')
  .action(() => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.clear();
      console.log(chalk.green('✓ All aliases cleared'));
      logger.info('All aliases cleared');
    } catch (error) {
      console.log(chalk.red(`Failed to clear aliases: ${error}`));
      logger.error('Failed to clear aliases', { error });
    }
  });

export function register(program: Command): void {
  const aliasCmd = program.addCommand(aliasCommand);
  aliasCmd.addCommand(addAliasCommand);
  aliasCmd.addCommand(removeAliasCommand);
  aliasCmd.addCommand(listAliasCommand);
  aliasCmd.addCommand(clearAliasCommand);
}
