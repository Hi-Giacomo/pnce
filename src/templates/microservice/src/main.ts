// @ts-ignore - YesTemplatefile，dependencies
import { NestFactory } from '@nestjs/core';
import { Mainmodule } from './modules';
// @ts-ignore - YesTemplatefile，dependencies
import { INestApplication } from '@nestjs/common';
// @ts-ignore - YesTemplatefile，dependencies
import * as chokidar from 'chokidar';
import * as path from 'path';
// @ts-ignore - YesTemplatefile，dependencies
import { loadEnvfile } from './config/env.config';

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

  console.log(`🚀 microservice serviceStart`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌐 URL: http://localhost:${port}/api`);

  // Environment variablesfile
  startEnvWatcher();
}

//  bootstrap ，Global
(global as Record<string, unknown>).restartServer = restartServer;
console.log('✅ restartServer FunctionRegister global');

function startEnvWatcher(): void {
  const envfilePath = path.join(process.cwd(), '.env');
  console.log('🔍 Startfile:', envfilePath);

  if (envWatcher) {
    envWatcher.close();
  }

  envWatcher = chokidar.watch(envfilePath, {
    persistent: true,
    ignoreInitial: true, //
    awaitWriteFinish: {
      stabilityThreshold: 200, // file 200ms
      pollInterval: 100,
    },
  });

  envWatcher.on('change', () => {
    console.log('\n📄  .env file');
    handleEnvfileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error(' .env file:', error.message);
  });

  console.log('✅ Environment variablesfileStart');
}

let lastKnownPort: string = '3000';
let lastKnownEnv: string = 'development';

function handleEnvfileChange(): void {
  try {
    // Environment variables
    const newEnvVars = loadEnvfile();

    // file
    const newPort = newEnvVars.PORT || '3000';
    const newEnv = newEnvVars.NODE_ENV || 'development';

    //  process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log(`🔄 Environment variablesUpdate`);

    // Yes/No（）
    const portChanged = lastKnownPort !== newPort;
    const envChanged = lastKnownEnv !== newEnv;

    if (portChanged || envChanged) {
      if (portChanged) {
        console.log(`⚠️  Port ${lastKnownPort}  ${newPort}`);
      }
      if (envChanged) {
        console.log(`⚠️  Run ${lastKnownEnv}  ${newEnv}`);
      }

      //
      lastKnownPort = newPort;
      lastKnownEnv = newEnv;

      //
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ ConfigureApplication，Restartservice');
    }
  } catch (error) {
    console.error(
      'Handle .env filefailed:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function restartServer() {
  console.log('\n⚠️  Restartservice...\n');

  try {
    // ，
    if (envWatcher) {
      await envWatcher.close();
      envWatcher = null;
    }

    if (app) {
      //
      await app.close();
      console.log('✅ serviceClose');
    }

    //
    await bootstrap();
    console.log('✅ serviceRestartSuccess\n');
  } catch (error) {
    console.error(
      '❌ Restartservicefailed:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

//
(global as any).stopEnvWatcher = () => {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('Environment variablesStop');
  }
};

bootstrap().catch((error: Error) => {
  console.error('Startfailed:', error.message);
  process.exit(1);
});
