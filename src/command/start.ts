import { Command } from 'commander';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Register start command
 * @param program - Commander program instance
 */
export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start the application')
    .option('-m, --mode <mode>', 'Start mode: dev, prod', 'dev')
    .option('-p, --port <port>', 'Port number', '3000')
    .action((options) => {
      // Get project root (parent of dist directory)
      const distDir = path.dirname(path.dirname(__dirname));
      const appPath = path.join(distDir, 'src/app');

      // Check if app directory exists
      const fs = require('fs');
      if (!fs.existsSync(appPath)) {
        console.error(`❌ Application directory not found: ${appPath}`);
        process.exit(1);
      }

      // Check if package.json exists
      if (!fs.existsSync(path.join(appPath, 'package.json'))) {
        console.error(`❌ package.json not found in ${appPath}`);
        process.exit(1);
      }

      if (options.mode === 'dev') {
        console.log('🚀 Starting application in development mode...\n');

        try {
          const devProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'dev'],
            {
              cwd: appPath,
              stdio: 'inherit',
              env: {
                ...process.env,
                PORT: options.port,
              },
            }
          );

          devProcess.on('error', (error) => {
            console.error('❌ Failed to start application:', error.message);
            process.exit(1);
          });

          devProcess.on('exit', (code) => {
            if (code !== 0) {
              process.exit(code || 1);
            }
          });
        } catch (error) {
          console.error('❌ Failed to start application:', error);
          process.exit(1);
        }
      } else if (options.mode === 'prod') {
        console.log('🚀 Starting application in production mode...\n');

        // Build first
        try {
          const buildProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'build'],
            {
              cwd: appPath,
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
              ['run', 'start:prod'],
              {
                cwd: appPath,
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
