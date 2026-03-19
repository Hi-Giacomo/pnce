// @ts-ignore - YesTemplatefile，dependencies
import { NestFactory } from '@nestjs/core';
import { MainModule } from './modules';
// @ts-ignore - YesTemplatefile，dependencies
import { INestApplication } from '@nestjs/common';
// @ts-ignore - YesTemplatefile，dependencies
import * as chokidar from 'chokidar';
import * as path from 'path';
// @ts-ignore - YesTemplatefile，dependencies
import { loadEnvfile } from './config/env.config';
import { MicroserviceManager } from './managers';

let app: INestApplication | null = null;
let envWatcher: chokidar.FSWatcher | null = null;
let microserviceManager: MicroserviceManager | null = null;

async function bootstrap() {
  app = await NestFactory.create(MainModule);

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

  // Start microservices
  await startMicroservices();

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

/**
 * Start microservices
 */
async function startMicroservices(): Promise<void> {
  try {
    microserviceManager = MicroserviceManager.getInstance();
    await microserviceManager.startAll();
  } catch (error) {
    console.log('⚠️  Microservice manager error, skipping microservice startup');
  }
}

/**
 * Stop microservices
 */
async function stopMicroservices(): Promise<void> {
  try {
    if (microserviceManager) {
      await microserviceManager.stopAll();
    }
  } catch (error) {
    console.error(
      '❌ Error stopping microservices:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

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
process.on('SIGTERM', async () => {
  console.log('\n SIGTERM ，ProcessingCloseservice...');
  const stopEnvWatcher = (global as any).stopEnvWatcher;
  if (stopEnvWatcher) {
    stopEnvWatcher();
  }
  await stopMicroservices();
  if (app) {
    app.close().then(() => {
      console.log('✅ serviceClose');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('\n SIGINT ，ProcessingCloseservice...');
  const stopEnvWatcher = (global as any).stopEnvWatcher;
  if (stopEnvWatcher) {
    stopEnvWatcher();
  }
  await stopMicroservices();
  if (app) {
    app.close().then(() => {
      console.log('✅ serviceClose');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

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
