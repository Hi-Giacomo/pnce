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
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 从环境变量获取配置
  const port = process.env.PORT || 3000;
  const appName = process.env.APP_NAME || 'service';
  const nodeEnv = process.env.NODE_ENV || 'development';

  await app.listen(port);

  // 初始化已知的配置值
  lastKnownConfig = {
    port: process.env.PORT || '3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.APP_HOST || '0.0.0.0',
  };

  console.log(`\n🚀 ${appName} 服务已启动`);
  console.log(`📡 监听端口: ${port}`);
  console.log(`🌐 运行环境: ${nodeEnv}`);
  console.log(`📍 访问地址: http://localhost:${port}/api\n`);

  // 启动环境变量文件监听
  startEnvWatcher();
}

// 在 bootstrap 之前就导出函数，确保全局可访问
(global as Record<string, unknown>).restartServer = restartServer;
(global as Record<string, unknown>).stopEnvWatcher = stopEnvWatcher;

interface ConfigState {
  port: string;
  nodeEnv: string;
  host: string;
}

let lastKnownConfig: ConfigState = {
  port: '3000',
  nodeEnv: 'development',
  host: '0.0.0.0',
};

function startEnvWatcher(): void {
  const envFilePath = path.join(process.cwd(), '.env');
  console.log('🔍 开始监听文件:', envFilePath);

  if (envWatcher) {
    envWatcher.close();
  }

  envWatcher = chokidar.watch(envFilePath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  envWatcher.on('change', () => {
    console.log('\n📄 检测到 .env 文件修改');
    handleEnvFileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error('❌ 监听 .env 文件出错:', error);
  });

  console.log('✅ 环境变量文件监听已启动\n');
}

function handleEnvFileChange(): void {
  try {
    // 读取新的环境变量
    const newEnvVars = loadEnvFile();

    // 从文件中读取新值
    const newConfig = {
      port: newEnvVars.PORT || '3000',
      nodeEnv: newEnvVars.NODE_ENV || 'development',
      host: newEnvVars.APP_HOST || '0.0.0.0',
    };

    // 更新 process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log('🔄 环境变量已更新');

    // 检查是否需要重启
    const changedKeys: string[] = [];
    if (lastKnownConfig.port !== newConfig.port) {
      changedKeys.push(`PORT: ${lastKnownConfig.port} → ${newConfig.port}`);
    }
    if (lastKnownConfig.nodeEnv !== newConfig.nodeEnv) {
      changedKeys.push(`NODE_ENV: ${lastKnownConfig.nodeEnv} → ${newConfig.nodeEnv}`);
    }
    if (lastKnownConfig.host !== newConfig.host) {
      changedKeys.push(`APP_HOST: ${lastKnownConfig.host} → ${newConfig.host}`);
    }

    if (changedKeys.length > 0) {
      console.log('⚠️  配置变更需要重启服务:');
      changedKeys.forEach(change => console.log(`   - ${change}`));

      // 更新已知的值
      lastKnownConfig = newConfig;

      // 异步重启服务
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ 配置已应用，无需重启服务\n');
    }
  } catch (error) {
    console.error('❌ 处理 .env 文件变化失败:', error instanceof Error ? error.message : String(error));
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

function stopEnvWatcher(): void {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('环境变量监听已停止');
  }
}

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('\n收到 SIGTERM 信号，正在关闭服务...');
  stopEnvWatcher();
  if (app) {
    app.close().then(() => {
      console.log('✅ 服务已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务...');
  stopEnvWatcher();
  if (app) {
    app.close().then(() => {
      console.log('✅ 服务已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

bootstrap().catch((error: Error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});
