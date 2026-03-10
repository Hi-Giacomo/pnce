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
  app.enableCors();

  // Global
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Port
  lastKnownPort = process.env.PORT || '3000';
  lastKnownEnv = process.env.NODE_ENV || 'development';

  console.log(`🚀 microservice 服务已启动`);
  console.log(`📡 监听Port: ${port}`);
  console.log(`🌐 访问地址: http://localhost:${port}/api`);

  // Environment variablesFile
  startEnvWatcher();
}

//  bootstrap ，Global
(global as Record<string, unknown>).restartServer = restartServer;
console.log('✅ restartServer 函数已注册到 global');

function startEnvWatcher(): void {
  const envFilePath = path.join(process.cwd(), '.env');
  console.log('🔍 Start监听File:', envFilePath);

  if (envWatcher) {
    envWatcher.close();
  }

  envWatcher = chokidar.watch(envFilePath, {
    persistent: true,
    ignoreInitial: true, // 
    awaitWriteFinish: {
      stabilityThreshold: 200, // File 200ms 
      pollInterval: 100,
    },
  });

  envWatcher.on('change', () => {
    console.log('\n📄 检测到 .env File修改');
    handleEnvFileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error('监听 .env File出错:', error.message);
  });

  console.log('✅ Environment variablesFile监听已启动');
}

let lastKnownPort: string = '3000';
let lastKnownEnv: string = 'development';

function handleEnvFileChange(): void {
  try {
    // Environment variables
    const newEnvVars = loadEnvFile();

    // File
    const newPort = newEnvVars.PORT || '3000';
    const newEnv = newEnvVars.NODE_ENV || 'development';

    //  process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log(`🔄 Environment variables已更新`);

    // YesNo（）
    const portChanged = lastKnownPort !== newPort;
    const envChanged = lastKnownEnv !== newEnv;

    if (portChanged || envChanged) {
      if (portChanged) {
        console.log(`⚠️  Port从 ${lastKnownPort} 变更为 ${newPort}`);
      }
      if (envChanged) {
        console.log(`⚠️  运行环境从 ${lastKnownEnv} 变更为 ${newEnv}`);
      }

      // 
      lastKnownPort = newPort;
      lastKnownEnv = newEnv;

      // 
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ 配置已应用，无需重启服务');
    }
  } catch (error) {
    console.error(
      '处理 .env File变化Failed:',
      error instanceof Error ? error.message : String(error)
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

// 
(global as any).stopEnvWatcher = () => {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('Environment variables监听已停止');
  }
};

bootstrap().catch((error: Error) => {
  console.error('启动Failed:', error.message);
  process.exit(1);
});
