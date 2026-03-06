import { Command } from 'commander';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../types';
import { ErrorHandler } from '../utils/errors';
import { getConfigManager } from '../config/manager';

/**
 * 注册认证相关命令
 * @param program - Commander程序实例
 * @param authService - 认证服务实例
 */
export function registerAuthCommands(program: Command, authService: AuthService): void {
  // 注册命令
  program
    .command('register')
    .description('注册新用户')
    .option('-u, --username <username>', '用户名')
    .option('-e, --email <email>', '邮箱')
    .option('-p, --password <password>', '密码')
    .action(async (options) => {
      try {
        const response = await authService.register(options);
        // Token已由AuthService自动保存到配置
        console.log(`✓ 注册成功! 用户: ${response.user.username || response.user.email}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 登录命令
  program
    .command('login')
    .description('登录到注册中心（自动打开浏览器进行授权）')
    .option('-e, --email <email>', '邮箱（可选，用于传统登录方式）')
    .option('-p, --password <password>', '密码（可选，用于传统登录方式）')
    .action(async (options) => {
      try {
        let response: AuthResponse;

        // 如果提供了邮箱和密码，使用传统登录方式
        if (options.email && options.password) {
          response = await authService.login(options);
        } else {
          // 默认使用网页授权登录
          response = await authService.webLogin();
        }

        // Token已由AuthService自动保存到配置
        console.log(`✓ 登录成功! 用户: ${response.user.username || response.user.email}`);
        console.log('');
        console.log('💡 提示: 您现在可以上传模块了，使用命令: pnce upload');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 查看用户信息命令
  program
    .command('me')
    .description('查看当前用户信息')
    .action(async () => {
      try {
        const configManager = getConfigManager();

        if (!configManager.getToken()) {
          console.log('未登录');
          console.log('请使用以下命令登录:');
          console.log('  pnce login');
          return;
        }

        const user = await authService.me();
        console.log('当前用户信息:');
        console.log(`  用户名: ${user.username || 'N/A'}`);
        console.log(`  邮箱: ${user.email || 'N/A'}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 登出命令
  program
    .command('logout')
    .description('登出')
    .action(() => {
      try {
        const configManager = getConfigManager();
        configManager.clearAuth();
        console.log('✓ 已登出');
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
