import { command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { createConfigSuggester, ConfigIssue } from '../utils/config-suggester';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Validationcommand
 */
export const configValidatecommand = new command('validate')
  .description('Validation配置File并提供智能建议')
  .option('--fix', '自动修复可修复的问题')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      console.log(chalk.cyan('\n🔍 配置Validation / Configuration Validation\n'));

      // Validation
      const issues: ConfigIssue[] = suggester.validate(config);

      // 
      console.log(suggester.formatIssues(issues));

      // 
      if (options.fix && issues.length > 0) {
        const fixableIssues = issues.filter((i) => i.suggestion !== undefined);
        if (fixableIssues.length > 0) {
          console.log(chalk.yellow('\n🔧 自动修复 / Auto-fixing...'));

          const fixedConfig = suggester.autoFix(config, issues);
          configManager.setUserConfig(
            fixedConfig as Partial<ReturnType<typeof configManager.getConfig>>
          );

          console.log(chalk.green(`✓ 已修复 ${fixableIssues.length} 个问题\n`));
          logger.info(`自动修复配置: ${fixableIssues.length} 个问题`);
        } else {
          console.log(chalk.gray('\n没有可自动修复的问题\n'));
        }
      }

      // File
      console.log(chalk.gray('配置File位置:'));
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}\n`));

      if (issues.some((i) => i.type === 'error')) {
        process.exit(1);
      }
    } catch (error: unknown) {
      console.log(chalk.red(`\n❌ 配置ValidationFailed: ${error}\n`));
      logger.error('配置ValidationFailed', { error });
      process.exit(1);
    }
  });

/**
 * command（）
 */
export const configCheckcommand = new command('check')
  .description('快速检查配置YesNo有效')
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      const issues = suggester.validate(config);
      const errors = issues.filter((i) => i.type === 'error');

      if (errors.length === 0) {
        console.log(chalk.green('✓ 配置有效\n'));
        process.exit(0);
      } else {
        console.log(chalk.red(`✗ 配置无效: ${errors.length} 个Error\n`));
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red(`✗ 检查Failed: ${error}\n`));
      process.exit(1);
    }
  });

export function register(program: command): void {
  const configCmd = program.commands.find((cmd) => cmd.name() === 'config');
  if (configCmd) {
    configCmd.addcommand(configValidatecommand);
    configCmd.addcommand(configCheckcommand);
  } else {
    //  config commanddoes not exist，command program
    program.addcommand(configValidatecommand);
    program.addcommand(configCheckcommand);
  }
}
