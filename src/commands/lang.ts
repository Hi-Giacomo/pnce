import { Command } from 'commander';
import chalk from 'chalk';
import { getI18n, setLanguage, Language } from '../utils/i18n';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * 语言命令
 */
export const langCommand = new Command('lang')
  .description('设置或查看语言')
  .action(() => {
    const currentLang = getI18n().getLanguage();
    const supportedLangs = getI18n().getSupportedLanguages();

    console.log(chalk.cyan('\n语言设置 / Language Settings\n'));
    console.log(chalk.gray('当前语言 / Current language:'), chalk.green(currentLang));
    console.log(chalk.gray('支持的语言 / Supported languages:'), supportedLangs.join(', '));
    console.log('\n' + chalk.gray('使用方法 / Usage:'));
    console.log('  pnce lang set <lang>  - 设置语言 / Set language');
    console.log('  pnce lang list        - 列出支持的语言 / List supported languages');
  });

/**
 * 设置语言子命令
 */
export const setLangCommand = new Command('set')
  .argument('<lang>', '语言代码 (zh/en)')
  .description('设置界面语言')
  .action((lang: string) => {
    try {
      const supportedLangs = getI18n().getSupportedLanguages();
      const language = lang as Language;

      if (!supportedLangs.includes(language)) {
        console.log(chalk.red(`不支持的语言: ${lang}`));
        console.log(chalk.gray(`支持的语言: ${supportedLangs.join(', ')}`));
        return;
      }

      setLanguage(language);
      console.log(chalk.green(`语言已设置为: ${lang}`));
      logger.info(`语言已设置为: ${lang}`);
    } catch (error) {
      console.log(chalk.red(`设置语言失败: ${error}`));
      logger.error('设置语言失败', { error });
    }
  });

/**
 * 列出语言子命令
 */
export const listLangCommand = new Command('list')
  .description('列出所有支持的语言')
  .action(() => {
    const supportedLangs = getI18n().getSupportedLanguages();
    const currentLang = getI18n().getLanguage();

    console.log(chalk.cyan('\n支持的语言 / Supported Languages:\n'));

    supportedLangs.forEach(lang => {
      if (lang === currentLang) {
        console.log(chalk.green(`  ${lang} (当前 / Current)`));
      } else {
        console.log(chalk.gray(`  ${lang}`));
      }
    });

    console.log();
  });

export function register(program: Command): void {
  const langCmd = program.addCommand(langCommand);
  langCmd.addCommand(setLangCommand);
  langCmd.addCommand(listLangCommand);
}
