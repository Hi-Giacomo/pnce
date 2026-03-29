import { Command } from 'commander';
import chalk from 'chalk';
import { getAliasManager } from '../utils/alias-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Alias command
 */
export const aliascommand = new Command('alias')
  .description('Manage command aliases')
  .action(() => {
    const aliasManager = getAliasManager();
    const aliases = aliasManager.list();

    logger.info('Listing command aliases');
    console.log(chalk.cyan('\ncommand Aliases\n'));

    if (Object.keys(aliases).length === 0) {
      logger.info('No aliases configured');
      console.log(chalk.gray('No aliases configured\n'));
    } else {
      logger.info('Alias -> command mapping:');
      console.log(chalk.white('Alias -> command\n'));
      Object.entries(aliases).forEach(([alias, command]) => {
        logger.debug(`  ${alias} -> ${command}`);
        console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
      });
      console.log();
    }

    logger.info('Alias command usage instructions:');
    console.log(chalk.gray('Usage:'));
    console.log('  pnce alias add <alias> <command>  - Add alias');
    console.log('  pnce alias remove <alias>         - Remove alias');
    console.log('  pnce alias clear                 - Clear all aliases');
    console.log('  pnce alias list                   - List aliases');
  });

/**
 * Add alias subcommand
 */
export const addAliascommand = new Command('add')
  .argument('<alias>', 'Alias name')
  .argument('<command>', 'Original command (arguments can be separated by spaces)')
  .description('Add command alias')
  .action((alias: string, command: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.add(alias, command);
      logger.info(`✓ Alias added: ${alias} -> ${command}`);
    } catch (error) {
      logger.error(
        `failed to add alias: ${error}`,
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
      console.log(chalk.red(`❌ failed to add alias: ${error}`));
    }
  });

/**
 * Remove alias subcommand
 */
export const removeAliascommand = new Command('remove')
  .argument('<alias>', 'Alias name')
  .description('Remove command alias')
  .action((alias: string) => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.remove(alias);
      logger.info(`✓ Alias removed: ${alias}`);
    } catch (error) {
      logger.error(
        `failed to remove alias: ${error}`,
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
      console.log(chalk.red(`❌ failed to remove alias: ${error}`));
    }
  });

/**
 * List aliases subcommand
 */
export const listAliascommand = new Command('list').description('List all aliases').action(() => {
  const aliasManager = getAliasManager();
  const aliases = aliasManager.list();

  logger.info('Listing all aliases');
  console.log(chalk.cyan('\nAlias List:\n'));

  if (Object.keys(aliases).length === 0) {
    logger.info('No aliases configured');
    console.log(chalk.gray('No aliases configured\n'));
  } else {
    Object.entries(aliases).forEach(([alias, command]) => {
      logger.debug(`  ${alias} -> ${command}`);
      console.log(chalk.green(`  ${alias}`) + chalk.gray(' -> ') + chalk.white(command));
    });
    console.log();
  }
});

/**
 * Clear aliases subcommand
 */
export const clearAliascommand = new Command('clear')
  .description('Clear all aliases')
  .action(() => {
    try {
      const aliasManager = getAliasManager();
      aliasManager.clear();
      logger.info('✓ All aliases cleared');
    } catch (error) {
      logger.error(
        `failed to clear aliases: ${error}`,
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
      console.log(chalk.red(`❌ failed to clear aliases: ${error}`));
    }
  });

export function register(program: Command): void {
  const aliasCmd = program.addCommand(aliascommand);
  aliasCmd.addCommand(addAliascommand);
  aliasCmd.addCommand(removeAliascommand);
  aliasCmd.addCommand(listAliascommand);
  aliasCmd.addCommand(clearAliascommand);
}
