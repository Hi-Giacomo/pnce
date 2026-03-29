import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { createConfigSuggester, ConfigIssue } from '../utils/config-suggester';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Validate command
 */
export const configValidatecommand = new Command('validate')
  .description('ValidationConfigurefilesuggestion')
  .option('--fix', 'FixFixIssue')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      logger.info('Starting configuration validation...');
      console.log(chalk.cyan('\n🔍 ConfigureValidation / Config Validation\n'));

      // Validation
      const issues: ConfigIssue[] = suggester.validate(config);

      //
      console.log(suggester.formatIssues(issues));

      //
      if (options.fix && issues.length > 0) {
        const fixableIssues = issues.filter((i) => i.suggestion !== undefined);
        if (fixableIssues.length > 0) {
          logger.info('Auto-fixing configuration issues...');
          console.log(chalk.yellow('\n🔧 Fix / Auto-fixing...'));

          const fixedConfig = suggester.autoFix(config, issues);
          configManager.setUserConfig(
            fixedConfig as Partial<ReturnType<typeof configManager.getConfig>>
          );

          logger.info(`Fixed ${fixableIssues.length} issues.`);
          console.log(chalk.green(`✓ Fix ${fixableIssues.length} Issue\n`));
          logger.info(`FixConfigure: ${fixableIssues.length} Issue`);
        } else {
          logger.info('No fixable issues found.');
          console.log(chalk.gray('\nFixIssue\n'));
        }
      }

      // file
      logger.info('Configuration file path:');
      console.log(chalk.gray('Configurefile:'));
      logger.info(`  ${configManager.getUserConfigPath()}`);
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}\n`));

      if (issues.some((i) => i.type === 'error')) {
        process.exit(1);
      }
    } catch (error: unknown) {
      logger.error(
        `Configuration validation failed: ${error}`,
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
      console.log(chalk.red(`\n❌ ConfigureValidationfailed: ${error}\n`));
      logger.error('ConfigureValidationfailed', { error });
      process.exit(1);
    }
  });

/**
 * command（）
 */
export const configcheckCommand = new Command('check')
  .description('checkConfigureYes/Novalid')
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      const issues = suggester.validate(config);
      const errors = issues.filter((i) => i.type === 'error');

      if (errors.length === 0) {
        logger.info('Configuration is valid.');
        console.log(chalk.green('✓ Configurevalid\n'));
        process.exit(0);
      } else {
        logger.error(`Configuration is invalid: ${errors.length} errors.`);
        console.log(chalk.red(`✗ Configureinvalid: ${errors.length} Error\n`));
        process.exit(1);
      }
    } catch (error: unknown) {
      logger.error(
        `Configuration check failed: ${error}`,
        error instanceof Error ? { error } : { error: new Error(String(error)) }
      );
      console.log(chalk.red(`✗ checkfailed: ${error}\n`));
      process.exit(1);
    }
  });

export function register(program: Command): void {
  const configCmd = program.commands.find((cmd) => cmd.name() === 'config');
  if (configCmd) {
    configCmd.addCommand(configValidatecommand);
    configCmd.addCommand(configcheckCommand);
  } else {
    //  config commanddoes not exist，command program
    program.addCommand(configValidatecommand);
    program.addCommand(configcheckCommand);
  }
}
