import { type Command } from 'commander';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import {
  DEVELOPMENT_APP_PORT,
  DEVELOPMENT_SERVICE_PORT,
  SERVICE_PORT,
} from '../contacts/global.config';

/**
 * Register start command
 * @param program - Commander program instance
 */
export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start the application')
    .option('-m, --mode <mode>', 'Start mode: admin:dev, start', 'admin:dev')
    .option('-p, --port <port>', 'Port number', '3000')
    .action((options) => {
      const distDir = path.dirname(path.dirname(__dirname));
      const appPath = path.join(distDir, 'src/app');
      const servicePath = path.join(distDir, 'src/service');

      if (!fs.existsSync(appPath)) {
        console.error(`❌ Application directory not found: ${appPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(servicePath)) {
        console.error(`❌ Application directory not found: ${servicePath}`);
        process.exit(1);
      }

      if (!fs.existsSync(path.join(appPath, 'package.json'))) {
        console.error(`❌ package.json not found in ${appPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(path.join(servicePath, 'package.json'))) {
        console.error(`❌ package.json not found in ${servicePath}`);
        process.exit(1);
      }

      if (options.mode === 'admin:dev') {
        console.log('🚀 Starting application in development mode...\n');
        try {
          const devAppProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'dev', '--', `PORT=${DEVELOPMENT_APP_PORT}`],
            {
              cwd: appPath,
              stdio: 'inherit',
              env: {
                ...process.env,
                PORT: options.port,
              },
            }
          );

          devAppProcess.on('error', (error) => {
            console.error('❌ Failed to start application:', error.message);
            process.exit(1);
          });

          const devServiceProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'dev', '--', `PORT=${DEVELOPMENT_SERVICE_PORT}`],
            {
              cwd: servicePath,
              stdio: 'inherit',
              env: {
                ...process.env,
                PORT: options.port,
              },
            }
          );

          devServiceProcess.on('error', (error) => {
            console.error('❌ Failed to start application:', error.message);
            process.exit(1);
          });

          devServiceProcess.on('exit', (code) => {
            if (code !== 0) {
              process.exit(code || 1);
            }
          });

          devAppProcess.on('exit', (code) => {
            if (code !== 0) {
              process.exit(code || 1);
            }
          });
        } catch (error) {
          console.error('❌ Failed to start application:', error);
          process.exit(1);
        }
      } else if (options.mode === 'start') {
        console.log('🚀 Starting application in production mode...\n');

        // Build first
        try {
          const buildProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'build'],
            {
              cwd: servicePath,
              stdio: 'inherit',
            }
          );

          buildProcess.on('error', (error) => {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
          });

          buildProcess.on('exit', (code) => {
            if (code !== 0) {
              console.error('❌ Build failed with exit code:', code);
              process.exit(code || 1);
            }

            // Start production server
            const prodProcess = spawn(
              process.platform === 'win32' ? 'npm.cmd' : 'npm',
              ['run', 'start:prod', '--', `PORT=${options.port}`],
              {
                cwd: servicePath,
                stdio: 'inherit',
                env: {
                  ...process.env,
                  PORT: options.port,
                },
              }
            );

            prodProcess.on('error', (error) => {
              console.error('❌ Failed to start production server:', error.message);
              process.exit(1);
            });

            prodProcess.on('exit', (code) => {
              process.exit(code || 1);
            });
          });
        } catch (error) {
          console.error('❌ Build failed:', error);
          process.exit(1);
        }
      } else {
        console.error(`❌ Unknown mode: ${options.mode}`);
        console.log('Available modes: dev, prod');
        process.exit(1);
      }
    });
}
