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

  console.log(`\n🚀 ${appName} serviceStart`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌐 Run: ${nodeEnv}`);
  console.log(`📍 URL: http://localhost:${port}/api\n`);

  // Environment variablesfile
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
  const envfilePath = path.join(process.cwd(), '.env');
  console.log('🔍 Startfile:', envfilePath);

  if (envWatcher) {
    envWatcher.close();
  }

  envWatcher = chokidar.watch(envfilePath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  envWatcher.on('change', () => {
    console.log('\n📄  .env file');
    handleEnvfileChange();
  });

  envWatcher.on('error', (error: Error) => {
    console.error('❌  .env file:', error);
  });

  console.log('✅ Environment variablesfileStart\n');
}

function handleEnvfileChange(): void {
  try {
    // Environment variables
    const newEnvVars = loadEnvfile();

    // file
    const newConfig = {
      port: newEnvVars.PORT || '3000',
      nodeEnv: newEnvVars.NODE_ENV || 'development',
      host: newEnvVars.APP_HOST || '0.0.0.0',
    };

    //  process.env
    Object.entries(newEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log('🔄 Environment variablesUpdate');

    // Yes/No
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
      console.log('⚠️  ConfigureRestartservice:');
      changedKeys.forEach((change) => console.log(`   - ${change}`));

      //
      lastKnownConfig = newConfig;

      //
      setImmediate(() => {
        restartServer();
      });
    } else {
      console.log('✅ ConfigureApplication，Restartservice\n');
    }
  } catch (error) {
    console.error(
      '❌ Handle .env filefailed:',
      error instanceof Error ? error.message : String(error),
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
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

function stopEnvWatcher(): void {
  if (envWatcher) {
    envWatcher.close();
    envWatcher = null;
    console.log('Environment variablesStop');
  }
}

//
process.on('SIGTERM', () => {
  console.log('\n SIGTERM ，ProcessingCloseservice...');
  stopEnvWatcher();
  if (app) {
    app.close().then(() => {
      console.log('✅ serviceClose');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('\n SIGINT ，ProcessingCloseservice...');
  stopEnvWatcher();
  if (app) {
    app.close().then(() => {
      console.log('✅ serviceClose');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

bootstrap().catch((error: Error) => {
  console.error('❌ Startfailed:', error.message);
  process.exit(1);
});
