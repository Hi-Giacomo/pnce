import { Command } from 'commander';
import { getConfigManager } from '../config/manager';
import { ErrorHandler } from '../utils/errors';

/**
 * 注册镜像源配置相关命令
 * @param program - Commander程序实例
 */
export function registerRegistryCommands(program: Command): void {
  const registryCmd = program.command('registry').description('管理注册中心镜像源');

  // 设置注册中心地址
  registryCmd
    .command('set <url>')
    .description('设置模块服务下载地址')
    .action((url) => {
      try {
        const configManager = getConfigManager();
        configManager.setUserConfig({ apiServer: url });
        const config = configManager.getConfig();
        console.log('✓ 模块服务下载地址已更新');
        console.log(`  地址: ${config.apiServer}`);
      } catch (error: unknown) {
        console.error('设置失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 查看当前配置
  registryCmd
    .command('get')
    .description('查看当前模块服务下载地址')
    .action(() => {
      try {
        const config = getConfigManager().getConfig();
        console.log('当前模块服务下载地址:');
        console.log(`  地址: ${config.apiServer}`);
        console.log(`  认证令牌: ${config.token ? '已设置' : '未设置'}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });

  // 验证连接
  registryCmd
    .command('ping')
    .description('验证模块服务连接')
    .action(async () => {
      try {
        const config = getConfigManager().getConfig();
        console.log(`正在连接 ${config.apiServer}...`);

        const axios = require('axios');
        await axios.get(`${config.apiServer}/health`, { timeout: 5000 }).catch(() => {
          // health 端点不存在，尝试根路径
          return axios.get(config.apiServer, { timeout: 5000 });
        });

        console.log('✓ 连接成功');
        console.log(`  地址: ${config.apiServer}`);
      } catch (error: unknown) {
        console.error('✗ 连接失败:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && 'code' in error && error.code === 'ECONNREFUSED') {
          console.error('  请确认模块服务是否已启动');
        }
        process.exit(1);
      }
    });

  // 重置为默认值
  registryCmd
    .command('reset')
    .description('重置为默认模块服务地址')
    .action(() => {
      try {
        const configManager = getConfigManager();
        configManager.setUserConfig({ apiServer: 'http://62.234.36.178:3000' });
        const config = configManager.getConfig();
        console.log('✓ 已重置为默认配置');
        console.log(`  地址: ${config.apiServer}`);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
