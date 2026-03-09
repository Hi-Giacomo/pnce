// @ts-ignore - 这是模板文件，依赖项在实际项目中安装
import { NestFactory } from '@nestjs/core';
import { MainModule } from './modules';
// @ts-ignore - 这是模板文件，依赖项在实际项目中安装
import { INestApplication } from '@nestjs/common';
// @ts-ignore - 这是模板文件，依赖项在实际项目中安装
import * as chokidar from 'chokidar';
import * as path from 'path';
// @ts-ignore - 这是模板文件，依赖项在实际项目中安装
import { loadEnvFile } from './config/env.config';

let app: INestApplication | null = null;
let envWatcher: chokidar.FSWatcher | null = null;

async function bootstrap() {
  app = await NestFactory.create(MainModule);

  // 启用 CORS
  app.enableCors();

  // 设置全局前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // 初始化已知的端口和环境值
  lastKnownPort = process.env.PORT || '3000';
  lastKnownEnv = process.env.NODE_ENV || 'development';

  console.log(`🚀 microservice 服务已启动`);
  console.log(`📡 监听端口: ${port}`);
  console.log(`🌐 访问地址: http://localhost:${port}/api`);

  // 启动环境变量文件监听
  startEnvWatcher();
}

// 在 bootstrap 之前就导出函数，确保全局可访问
(global as Record<string, unknown>).restartServer = restartServer;
console.log('✅ restartServer 函数已注册到 global');

function startEnvWatcher(): void {
  const envFilePath = path.join(process.cwd(), '.env');
  console.log('🔍 开始监听文件:', envFilePath);

  if (envWatcher) {
    envWatcher.close();
  }

  envWatcher = chokidar.watch(envFilePath, {
    persistent: true,
    ignoreInitial: true, // 忽略初始添加事件
    awaitWriteFinish: {
      stabilityThreshold: 200, // 文件稳定 200ms 后触发
      pollInterval: 100,
    },
  });

  envWatcher.on('change', () => {
    console.log('\n📄 检测到 .env 文件修改');
    handleEnvFileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error('监听 .env 文件出错:', error.message);
  });

  console.log('✅ 环境变量文件监听已启动');
}

let lastKnownPort: string = '3000';
let lastKnownEnv: string = 'development';

function handleEnvFileChange(): void {
  try {
    // 读取新的环境变量
    const newEnvVars = loadEnvFile();

    // 从文件中读取新值
    const newPort = newEnvVars.PORT || '3000';
    const newEnv = newEnvVars.NODE_ENV || 'development';

    // 更新 process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log(`🔄 环境变量已更新`);

    // 检查是否需要重启（对比上次的已知值）
    const portChanged = lastKnownPort !== newPort;
    const envChanged = lastKnownEnv !== newEnv;

    if (portChanged || envChanged) {
      if (portChanged) {
        console.log(`⚠️  端口从 ${lastKnownPort} 变更为 ${newPort}`);
      }
      if (envChanged) {
        console.log(`⚠️  运行环境从 ${lastKnownEnv} 变更为 ${newEnv}`);
      }

      // 更新已知的值
      lastKnownPort = newPort;
      lastKnownEnv = newEnv;

      // 异步重启服务
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ 配置已应用，无需重启服务');
    }
  } catch (error) {
    console.error(
      '处理 .env 文件变化失败:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function restartServer() {
  console.log('\n⚠️  准备重启服务...\n');

  try {
    // 先停止监听，避免重启时触发重复事件
    if (envWatcher) {
      await envWatcher.close();
      envWatcher = null;
    }

    if (app) {
      // 关闭现有服务器
      await app.close();
      console.log('✅ 旧服务器已关闭');
    }

    // 启动新服务器
    await bootstrap();
    console.log('✅ 服务重启成功\n');
  } catch (error) {
    console.error('❌ 重启服务失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 导出停止监听函数
(global as any).stopEnvWatcher = () => {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('环境变量监听已停止');
  }
};

bootstrap().catch((error: Error) => {
  console.error('启动失败:', error.message);
  process.exit(1);
});
