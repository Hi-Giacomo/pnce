import { command } from 'commander';
import chalk from 'chalk';
import { getI18n, setLanguage, Language } from '../utils/i18n';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Language command
 */
export const langcommand = new command('lang').description('Set or view language').action(() => {
  const currentLang = getI18n().getLanguage();
  const supportedLangs = getI18n().getSupportedLanguages();

  console.log(chalk.cyan('\nLanguage Settings\n'));
  console.log(chalk.gray('Current language:'), chalk.green(currentLang));
  console.log(chalk.gray('Supported languages:'), supportedLangs.join(', '));
  console.log('\n' + chalk.gray('Usage:'));
  console.log('  pnce lang set <lang>  - Set language');
  console.log('  pnce lang list        - List supported languages');
  console.log(
    '\n' + chalk.gray('Tip: You can also use pnce set or pnce list to call subcommands directly')
  );
});

/**
 * Set language subcommand
 */
export const setLangcommand = new command('set')
  .argument('<lang>', 'Language code (zh/en)')
  .description('Set interface language')
  .action((lang: string) => {
    try {
      const supportedLangs = getI18n().getSupportedLanguages();
      const language = lang as Language;

      if (!supportedLangs.includes(language)) {
        console.log(chalk.red(`Unsupported language: ${lang}`));
        console.log(chalk.gray(`Supported languages: ${supportedLangs.join(', ')}`));
        return;
      }

      setLanguage(language);
      console.log(chalk.green(`Language set to: ${lang}`));
      logger.info(`Language set to: ${lang}`);
    } catch (error) {
      console.log(chalk.red(`Failed to set language: ${error}`));
      logger.error('Failed to set language', { error });
    }
  });

/**
 * List languages subcommand
 */
export const listLangcommand = new command('list')
  .description('List all supported languages')
  .action(() => {
    const supportedLangs = getI18n().getSupportedLanguages();
    const currentLang = getI18n().getLanguage();

    console.log(chalk.cyan('\nSupported Languages:\n'));

    supportedLangs.forEach((lang) => {
      if (lang === currentLang) {
        console.log(chalk.green(`  ${lang} (current)`));
      } else {
        console.log(chalk.gray(`  ${lang}`));
      }
    });

    console.log();
  });

export function register(program: command): void {
  const langCmd = program.addcommand(langcommand);
  langCmd.addcommand(setLangcommand);
  langCmd.addcommand(listLangcommand);

  // Remove subcommands from program.commands to avoid duplicate display in top-level help
  // commander defaults to displaying subcommands as top-level commands, supporting both pnce set and pnce lang set access methods
  // We choose to hide top-level display in help, only access through parent command
}
