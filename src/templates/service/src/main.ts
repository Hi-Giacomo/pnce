// @ts-ignore - YesTemplateFile，Dependencies
import { NestFactory } from '@nestjs/core';
import { Mainmodule } from './modules';
// @ts-ignore - YesTemplateFile，Dependencies
import { INestApplication } from '@nestjs/common';
// @ts-ignore - YesTemplateFile，Dependencies
import * as chokidar from 'chokidar';
import * as path from 'path';
// @ts-ignore - YesTemplateFile，Dependencies
import { loadEnvFile } from './config/env.config';

let app: INestApplication | null = null;
let envWatcher: chokidar.FSWatcher | null = null;

async function bootstrap() {
  app = await NestFactory.create(Mainmodule);

  //  CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,authorization',
  });

  // Global
  app.setGlobalPrefix('api');

  // Environment variablesGet configuration
  const port = process.env.PORT || 3000;
  const appName = process.env.APP_NAME || 'service';
  const nodeEnv = process.env.NODE_ENV || 'development';

  await app.listen(port);

  // 
  lastKnownConfig = {
    port: process.env.PORT || '3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.APP_HOST || '0.0.0.0',
  };

  console.log(`\n🚀 ${appName} 服务已启动`);
  console.log(`📡 监听Port: ${port}`);
  console.log(`🌐 运行环境: ${nodeEnv}`);
  console.log(`📍 访问地址: http://localhost:${port}/api\n`);

  // Environment variablesFile
  startEnvWatcher();
}

//  bootstrap ，Global
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
  console.log('🔍 Start监听File:', envFilePath);

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
    console.log('\n📄 检测到 .env File修改');
    handleEnvFileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error('❌ 监听 .env File出错:', error);
  });

  console.log('✅ Environment variablesFile监听已启动\n');
}

function handleEnvFileChange(): void {
  try {
    // Environment variables
    const newEnvVars = loadEnvFile();

    // File
    const newConfig = {
      port: newEnvVars.PORT || '3000',
      nodeEnv: newEnvVars.NODE_ENV || 'development',
      host: newEnvVars.APP_HOST || '0.0.0.0',
    };

    //  process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log('🔄 Environment variables已更新');

    // YesNo
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
      changedKeys.forEach((change) => console.log(`   - ${change}`));

      // 
      lastKnownConfig = newConfig;

      // 
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ 配置已应用，无需重启服务\n');
    }
  } catch (error) {
    console.error(
      '❌ 处理 .env File变化Failed:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function restartServer() {
  console.log('\n⚠️  准备重启服务...\n');

  try {
    // ，
    if (envWatcher) {
      await envWatcher.close();
      envWatcher = null;
    }

    if (app) {
      // 
      await app.close();
      console.log('✅ 旧服务器已关闭');
    }

    // 
    await bootstrap();
    console.log('✅ 服务重启Success\n');
  } catch (error) {
    console.error('❌ 重启服务Failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function stopEnvWatcher(): void {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('Environment variables监听已停止');
  }
}

// 
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
  console.error('❌ 启动Failed:', error.message);
  process.exit(1);
});
