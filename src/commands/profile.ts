import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { getProfileManager } from '../utils/profile-manager';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * 配置档案命令
 */
export const profileCommand = new Command('profile')
  .description('管理配置档案（多配置切换）')
  .action(() => {
    const profileManager = getProfileManager();
    const profiles = profileManager.list();
    const currentProfile = profileManager.getCurrent();

    console.log(chalk.cyan('\n📁 配置档案 / Configuration Profiles\n'));

    if (profiles.length === 0) {
      console.log(chalk.gray('暂无配置档案 / No profiles configured\n'));
    } else {
      profiles.forEach(profile => {
        const isCurrent = profile.name === currentProfile;
        const status = isCurrent ? chalk.green('(当前 / Current)') : '';
        const updatedAt = new Date(profile.updatedAt).toLocaleString('zh-CN');

        console.log(`${isCurrent ? chalk.green('●') : chalk.gray('○')} ${chalk.white(profile.name)} ${status}`);
        console.log(chalk.gray(`  更新于 / Updated: ${updatedAt}\n`));
      });
    }

    console.log(chalk.gray('使用方法 / Usage:'));
    console.log('  pnce profile save <name>   - 保存当前配置为档案 / Save current config');
    console.log('  pnce profile load <name>   - 加载配置档案 / Load profile');
    console.log('  pnce profile use <name>    - 切换到指定档案 / Switch to profile');
    console.log('  pnce profile list          - 列出所有档案 / List all profiles');
    console.log('  pnce profile delete <name> - 删除配置档案 / Delete profile');
    console.log('  pnce profile rename <old> <new> - 重命名档案 / Rename profile');
  });

/**
 * 保存档案子命令
 */
export const saveProfileCommand = new Command('save')
  .argument('<name>', '档案名称')
  .description('保存当前配置为档案')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = configManager.getConfig();
      profileManager.save(name, config);

      console.log(chalk.green(`✓ 配置档案已保存: ${name}\n`));
      logger.info(`配置档案已保存: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`保存档案失败: ${error}\n`));
      logger.error('保存配置档案失败', { error });
    }
  });

/**
 * 加载档案子命令
 */
export const loadProfileCommand = new Command('load')
  .argument('<name>', '档案名称')
  .description('加载配置档案（不切换当前档案）')
  .action(async (name: string) => {
    try {
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ 配置档案不存在: ${name}\n`));
        return;
      }

      console.log(chalk.cyan(`📄 档案内容 / Profile Content: ${name}\n`));
      console.log(chalk.white(JSON.stringify(config, null, 2)));
      console.log(chalk.gray('\n提示 / Tip: 使用 "pnce profile use <name>" 切换到此档案\n'));
      logger.info(`查看配置档案: ${name}`);
    } catch (error: unknown) {
      console.log(chalk.red(`加载档案失败: ${error}\n`));
      logger.error('加载配置档案失败', { error });
    }
  });

/**
 * 使用档案子命令
 */
export const useProfileCommand = new Command('use')
  .argument('<name>', '档案名称')
  .description('切换到指定配置档案')
  .action(async (name: string) => {
    try {
      const configManager = new ConfigManager();
      const profileManager = getProfileManager();

      const config = profileManager.load(name);

      if (!config) {
        console.log(chalk.red(`✗ 配置档案不存在: ${name}\n`));
        return;
      }

      // 更新配置文件
      configManager.setUserConfig(config);

      // 设置为当前档案
      profileManager.setCurrent(name);

      console.log(chalk.green(`✓ 已切换到配置档案: ${name}\n`));
      logger.info(`已切换到配置档案: ${name}`, { name });
    } catch (error) {
      console.log(chalk.red(`切换档案失败: ${error}\n`));
      logger.error('切换配置档案失败', { error });
    }
  });

/**
 * 列出档案子命令
 */
export const listProfileCommand = new Command('list')
  .description('列出所有配置档案')
  .action(() => {
    const profileManager = getProfileManager();
    const profiles = profileManager.list();
    const currentProfile = profileManager.getCurrent();

    console.log(chalk.cyan('\n📁 配置档案列表 / Profile List\n'));

    if (profiles.length === 0) {
      console.log(chalk.gray('暂无配置档案 / No profiles configured\n'));
    } else {
      profiles.forEach(profile => {
        const isCurrent = profile.name === currentProfile;
        const status = isCurrent ? chalk.green('(当前 / Current)') : '';
        const updatedAt = new Date(profile.updatedAt).toLocaleString('zh-CN');

        console.log(`${isCurrent ? chalk.green('●') : chalk.gray('○')} ${chalk.white(profile.name)} ${status}`);
        console.log(chalk.gray(`  更新于 / Updated: ${updatedAt}\n`));
      });
    }
  });

/**
 * 删除档案子命令
 */
export const deleteProfileCommand = new Command('delete')
  .argument('<name>', '档案名称')
  .description('删除配置档案')
  .action((name: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.delete(name);

      console.log(chalk.green(`✓ 配置档案已删除: ${name}\n`));
      logger.info(`配置档案已删除: ${name}`);
    } catch (error) {
      console.log(chalk.red(`删除档案失败: ${error}\n`));
      logger.error('删除配置档案失败', error instanceof Error ? error : new Error(String(error)));
    }
  });

/**
 * 重命名档案子命令
 */
export const renameProfileCommand = new Command('rename')
  .argument('<oldName>', '旧档案名称')
  .argument('<newName>', '新档案名称')
  .description('重命名配置档案')
  .action((oldName: string, newName: string) => {
    try {
      const profileManager = getProfileManager();
      profileManager.rename(oldName, newName);

      console.log(chalk.green(`✓ 配置档案已重命名: ${oldName} -> ${newName}\n`));
      logger.info(`配置档案已重命名: ${oldName} -> ${newName}`);
    } catch (error) {
      console.log(chalk.red(`重命名档案失败: ${error}\n`));
      logger.error('重命名配置档案失败', error instanceof Error ? error : new Error(String(error)));
    }
  });

export function register(program: Command): void {
  const profileCmd = program.addCommand(profileCommand);
  profileCmd.addCommand(saveProfileCommand);
  profileCmd.addCommand(loadProfileCommand);
  profileCmd.addCommand(useProfileCommand);
  profileCmd.addCommand(listProfileCommand);
  profileCmd.addCommand(deleteProfileCommand);
  profileCmd.addCommand(renameProfileCommand);
}
