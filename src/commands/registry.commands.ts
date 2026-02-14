import { Command } from 'commander';
import { ConfigService } from '../services/config.service';

/**
 * 注册镜像源配置相关命令
 */
export function registerRegistryCommands(program: Command): void {
  const registryCmd = program
    .command('registry')
    .description('管理注册中心镜像源');

  // 设置注册中心地址
  registryCmd
    .command('set <url>')
    .description('设置模块服务下载地址')
    .action((url) => {
      try {
        const config = ConfigService.updateConfig({ registry: url });
        console.log('✓ 模块服务下载地址已更新');
        console.log(`  地址: ${config.registry}`);
      } catch (error: any) {
        console.error('设置失败:', error.message);
        process.exit(1);
      }
    });

  // 查看当前配置
  registryCmd
    .command('get')
    .description('查看当前模块服务下载地址')
    .action(() => {
      try {
        const config = ConfigService.getConfig();
        console.log('当前模块服务下载地址:');
        console.log(`  地址: ${config.registry}`);
        console.log(`  认证令牌: ${config.authToken ? '已设置' : '未设置'}`);
      } catch (error: any) {
        console.error('读取配置失败:', error.message);
        process.exit(1);
      }
    });

  // 验证连接
  registryCmd
    .command('ping')
    .description('验证模块服务连接')
    .action(async () => {
      try {
        const config = ConfigService.getConfig();
        console.log(`正在连接 ${config.registry}...`);

        const axios = require('axios');
        await axios.get(`${config.registry}/health`, { timeout: 5000 }).catch(() => {
          // health 端点不存在，尝试根路径
          return axios.get(config.registry, { timeout: 5000 });
        });

        console.log('✓ 连接成功');
        console.log(`  地址: ${config.registry}`);
      } catch (error: any) {
        console.error('✗ 连接失败:', error.message);
        if (error.code === 'ECONNREFUSED') {
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
        const { DEFAULT_REGISTRY_URL, ENV_KEYS } = require('../config/default.config');
        const config = ConfigService.updateConfig({
          registry: process.env[ENV_KEYS.MODULE_REGISTRY] || DEFAULT_REGISTRY_URL
        });
        console.log('✓ 已重置为默认配置');
        console.log(`  地址: ${config.registry}`);
      } catch (error: any) {
        console.error('重置失败:', error.message);
        process.exit(1);
      }
    });
}
