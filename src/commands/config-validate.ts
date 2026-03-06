import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { createConfigSuggester, ConfigIssue } from '../utils/config-suggester';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * 配置验证命令
 */
export const configValidateCommand = new Command('validate')
  .description('验证配置文件并提供智能建议')
  .option('--fix', '自动修复可修复的问题')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      console.log(chalk.cyan('\n🔍 配置验证 / Configuration Validation\n'));

      // 验证配置
      const issues: ConfigIssue[] = suggester.validate(config);

      // 输出问题
      console.log(suggester.formatIssues(issues));

      // 自动修复
      if (options.fix && issues.length > 0) {
        const fixableIssues = issues.filter(i => i.suggestion !== undefined);
        if (fixableIssues.length > 0) {
          console.log(chalk.yellow('\n🔧 自动修复 / Auto-fixing...'));

          const fixedConfig = suggester.autoFix(config, issues);
          configManager.setUserConfig(fixedConfig as Partial<ReturnType<typeof configManager.getConfig>>);

          console.log(chalk.green(`✓ 已修复 ${fixableIssues.length} 个问题\n`));
          logger.info(`自动修复配置: ${fixableIssues.length} 个问题`);
        } else {
          console.log(chalk.gray('\n没有可自动修复的问题\n'));
        }
      }

      // 显示配置文件路径
      console.log(chalk.gray('配置文件位置:'));
      console.log(chalk.gray(`  ${configManager.getUserConfigPath()}\n`));

      if (issues.some(i => i.type === 'error')) {
        process.exit(1);
      }
    } catch (error: unknown) {
      console.log(chalk.red(`\n❌ 配置验证失败: ${error}\n`));
      logger.error('配置验证失败', { error });
      process.exit(1);
    }
  });

/**
 * 配置检查命令（简化版）
 */
export const configCheckCommand = new Command('check')
  .description('快速检查配置是否有效')
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      const suggester = createConfigSuggester();

      const issues = suggester.validate(config);
      const errors = issues.filter(i => i.type === 'error');

      if (errors.length === 0) {
        console.log(chalk.green('✓ 配置有效\n'));
        process.exit(0);
      } else {
        console.log(chalk.red(`✗ 配置无效: ${errors.length} 个错误\n`));
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red(`✗ 检查失败: ${error}\n`));
      process.exit(1);
    }
  });

export function register(program: Command): void {
  const configCmd = program.commands.find(cmd => cmd.name() === 'config');
  if (configCmd) {
    configCmd.addCommand(configValidateCommand);
    configCmd.addCommand(configCheckCommand);
  } else {
    // 如果 config 命令不存在，注册这两个命令到 program
    program.addCommand(configValidateCommand);
    program.addCommand(configCheckCommand);
  }
}
