import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ManageService {
  private readonly logger = new Logger('ManageService');

  constructor() {}

  async start() {
    this.logger.log('Starting microservice discovery...');

    // 使用绝对路径
    const baseDir = process.cwd();
    const modulesDir = path.join(baseDir, 'src', 'local_modules');

    this.logger.log(`Scanning directory: ${modulesDir}`);

    if (!fs.existsSync(modulesDir)) {
      this.logger.warn('local_modules directory not found!');
      return;
    }

    let files = fs.readdirSync(modulesDir, { withFileTypes: true });
    const list = files
      .filter((microservice) => {
        const isDirectory = microservice.isDirectory();
        if (isDirectory) {
          this.logger.debug(`Found directory: ${microservice.name}`);
          return true;
        }
        return false;
      })
      .map((microservice) => ({
        path: path.join(modulesDir, microservice.name),
        name: microservice.name,
      }))
      .filter((microservice) => {
        const moduleConfigPath = path.join(microservice.path, 'module.config.json');
        if (fs.existsSync(moduleConfigPath)) {
          try {
            const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigPath, 'utf-8'));
            if (moduleConfig?.type === 'microservice') {
              this.logger.log(`✓ Found microservice: ${microservice.name}`);
              return true;
            } else {
              this.logger.debug(
                `Skipping non-microservice: ${microservice.name} (type: ${moduleConfig?.type})`
              );
            }
          } catch (error) {
            this.logger.error(`Failed to parse module.config.json for ${microservice.name}`);
          }
        } else {
          this.logger.debug(`No module.config.json in ${microservice.name}`);
        }
        return false;
      });

    this.logger.log(`Found ${list.length} microservice(s) to start`);

    // 串行启动每个微服务
    for (const microservice of list) {
      await this.startMicroservice(microservice);
    }

    this.logger.log('All microservices startup complete');
  }

  private async startMicroservice(microservice: { name: string; path: string }) {
    return new Promise<void>((resolve) => {
      this.logger.log(`🚀 Starting microservice: ${microservice.name}`);
      this.logger.log(`   Directory: ${microservice.path}`);

      const child = spawn('npx', ['nest', 'start', '--no-clear'], {
        cwd: microservice.path,
        shell: true,
        stdio: 'inherit',
      });

      child.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            this.logger.log(`[${microservice.name}] ${line.trim()}`);
          }
        });
      });

      child.stderr?.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            this.logger.error(`[${microservice.name}] ${line.trim()}`);
          }
        });
      });

      child.on('close', (code) => {
        if (code === 0 || code === null) {
          this.logger.log(`✓ Microservice ${microservice.name} started successfully`);
        } else {
          this.logger.error(`✗ Microservice ${microservice.name} exited with code ${code}`);
        }
        resolve();
      });

      child.on('error', (error) => {
        this.logger.error(`Failed to start ${microservice.name}: ${error.message}`);
        resolve();
      });
    });
  }
}
