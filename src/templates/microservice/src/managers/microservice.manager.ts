import * as fs from 'fs-extra';
import * as path from 'path';
import { exec, ChildProcess } from 'child_process';
import * as net from 'net';

export interface MicroserviceInfo {
  name: string;
  path: string;
  port: number;
  process?: ChildProcess;
  pid?: number;
  watchers?: Map<string, any>;
}

/**
 * Microservice Manager
 * Responsible for managing nested microservices lifecycle
 */
export class MicroserviceManager {
  private static instance: MicroserviceManager;
  private microservices: Map<string, MicroserviceInfo> = new Map();
  private localModulesDir: string;
  private localModulesWatcher?: any;

  private constructor() {
    this.localModulesDir = path.join(process.cwd(), 'src', 'local_modules');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MicroserviceManager {
    if (!MicroserviceManager.instance) {
      MicroserviceManager.instance = new MicroserviceManager();
    }
    return MicroserviceManager.instance;
  }

  /**
   * Scan and start all nested microservices
   */
  async startAll(): Promise<void> {
    console.log('\n🔍 Scanning for microservices...\n');

    // Check main service port occupancy
    await this.checkMainServicePort();

    // Clean up port mappings (simplified version)
    await this.cleanupLocalPortMappings();

    if (!fs.existsSync(this.localModulesDir)) {
      console.log('⚠️  No local modules directory found');
      return;
    }

    const modules = await this.scanMicroservices(this.localModulesDir);

    if (modules.length === 0) {
      console.log('⚠️  No microservices found\n');
      return;
    }

    console.log(`📦 Found ${modules.length} microservice(s)\n`);

    for (const module of modules) {
      await this.startMicroservice(module);
    }

    console.log('\n✅ All microservices started\n');

    // Set up file watcher to detect new microservices
    this.setupLocalModulesWatcher();
  }

  /**
   * Recursively scan microservices
   */
  private async scanMicroservices(dir: string, depth: number = 0): Promise<MicroserviceInfo[]> {
    const modules: MicroserviceInfo[] = [];

    if (!fs.existsSync(dir)) {
      return modules;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const moduleConfigPath = path.join(itemPath, 'module.config.json');

      // Check if it's a microservice or service
      if (fs.existsSync(moduleConfigPath)) {
        try {
          const config = fs.readJsonSync(moduleConfigPath);

          if (config.type === 'microservice' || config.type === 'service') {
            // If it's a main service (type: 'service'), only scan its child microservices
            if (config.type === 'service' && depth > 0) {
              // Skip nested main services
              continue;
            }

            // If it has port configuration, add to list
            if (config.port) {
              modules.push({
                name: config.name,
                path: itemPath,
                port: config.port,
              });
            }

            // Recursively scan nested microservices
            const nestedModulesPath = path.join(itemPath, 'src', 'local_modules');
            if (fs.existsSync(nestedModulesPath)) {
              const nestedModules = await this.scanMicroservices(nestedModulesPath, depth + 1);
              modules.push(...nestedModules);
            }
          }
        } catch (error) {
          console.error(`❌ Error reading module config: ${moduleConfigPath}`);
        }
      } else if (fs.statSync(itemPath).isDirectory()) {
        // If it's a directory, recursively check
        const nestedModulesPath = path.join(itemPath, 'src', 'local_modules');
        if (fs.existsSync(nestedModulesPath)) {
          const nestedModules = await this.scanMicroservices(nestedModulesPath, depth + 1);
          modules.push(...nestedModules);
        }
      }
    }

    return modules;
  }

  /**
   * Check if port is in use
   */
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', () => {
        server.close();
        resolve(true);
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port, '0.0.0.0');
    });
  }

  /**
   * Start a single microservice
   */
  private async startMicroservice(module: MicroserviceInfo): Promise<void> {
    try {
      // Check if already started
      if (this.microservices.has(module.name)) {
        const existingProcess = this.microservices.get(module.name)?.process;
        if (existingProcess && !existingProcess.killed) {
          console.log(`⏭️  ${module.name} is already running`);
          return;
        } else {
          // Clean up invalid process reference
          this.microservices.delete(module.name);
        }
      }

      // Check if port is already in use
      const portInUse = await this.isPortInUse(module.port);
      if (portInUse) {
        console.log(`⚠️  Port ${module.port} is already in use, skipping ${module.name} startup`);
        return;
      }

      let command: string;
      if (this.isDevelopmentMode()) {
        // Development mode: use npx nest start --watch for hot reload
        // Add --watch-poll flag to reduce file watcher sensitivity
        command = 'npx nest start --watch --watch-poll=1000';
        console.log(`🔄 Starting ${module.name} in development mode...`);
      } else {
        // Production mode: check if dist directory exists
        const distPath = path.join(module.path, 'dist');
        if (!fs.existsSync(distPath)) {
          console.log(`⚠️  ${module.name} is not built (dist directory not found)`);
          console.log(`   Run: cd ${module.path} && npm run build\n`);
          return;
        }
        command = `node ${distPath}/main.js`;
        console.log(`🚀 Starting ${module.name} in production mode...`);
      }

      // Start microservice
      const serviceEnv = {
        ...process.env,
        PORT: module.port.toString(),
        APP_NAME: module.name,
      };

      const childProcess = exec(command, {
        cwd: module.path,
        env: serviceEnv as any,
      });

      // Handle output
      childProcess.stdout?.on('data', (data: Buffer) => {
        console.log(`[${module.name}] ${data.toString().trim()}`);
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`[${module.name}] ${data.toString().trim()}`);
      });

      childProcess.on('close', (code: number) => {
        console.log(`\n❌ ${module.name} stopped with code ${code}`);
        this.microservices.delete(module.name);
      });

      // Save process reference
      this.microservices.set(module.name, {
        ...module,
        process: childProcess,
        pid: childProcess.pid,
        watchers: new Map<string, any>(),
      });

      // Set up file watchers (only in development mode)
      if (childProcess.stdout) {
        this.setupFileWatchers(module, module.path);
      }

      // Wait for some time to let the service start
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(`✅ ${module.name} started on port ${module.port}`);
    } catch (error) {
      console.error(
        `❌ Failed to start ${module.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Set up file watchers (for detecting code changes and restarting microservices)
   */
  private setupFileWatchers(module: MicroserviceInfo, servicePath: string): void {
    const srcPath = path.join(servicePath, 'src');
    const distPath = path.join(servicePath, 'dist');

    // Watch TypeScript file changes in src directory
    const srcWatcher = this.watchDir(srcPath, `**/*.ts`, (event: string, filename: string) => {
      if (module.process && !module.process.killed) {
        console.log(`\n📄 [${module.name}] TypeScript file changed: ${filename} (${event})`);
        this.restartMicroservice(module);
      }
    });

    module.watchers?.set('src', srcWatcher);

    // Watch JavaScript file changes in dist directory (after compilation)
    const distWatcher = this.watchDir(distPath, `**/*.js`, (event: string, filename: string) => {
      if (module.process && !module.process.killed && filename.endsWith('main.js')) {
        console.log(`\n📦 [${module.name}] Compiled: ${filename}`);
        this.restartMicroservice(module);
      }
    });

    module.watchers?.set('dist', distWatcher);
  }

  /**
   * Individual file watcher
   */
  private watchDir(
    dir: string,
    pattern: string,
    callback: (event: string, filename: string) => void
  ): any {
    try {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(dir, {
        ignored: /node_modules|\.git/,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      watcher.on('all', (event: string, filename: string) => {
        if (filename) {
          // Convert glob pattern to file extension check
          const ext = pattern.includes('*.ts') ? '.ts' : '.js';
          if (filename.endsWith(ext)) {
            callback(event, filename);
          }
        }
      });

      return watcher;
    } catch (error) {
      console.error(
        `❌ Error watching ${dir}:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Restart microservice
   */
  private async restartMicroservice(module: MicroserviceInfo): Promise<void> {
    try {
      console.log(`🔄 [${module.name}] Restarting...`);

      // Stop file watchers
      if (module.watchers) {
        for (const [key, watcher] of module.watchers) {
          if (watcher && watcher.close) {
            watcher.close();
            console.log(`  ✓ Stopped watcher: ${key}`);
          }
        }
      }

      // Wait for existing process to completely stop
      if (module.process && !module.process.killed) {
        await this.waitForProcessExit(module.process);
      }

      // Wait before restarting
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create new watchers and start
      const isDevMode = process.env.NODE_ENV === 'development';
      if (isDevMode) {
        this.setupFileWatchers(module, module.path);
      }

      // Restart service
      await this.startService(module);

      console.log(`✅ [${module.name}] Restarted successfully`);
    } catch (error) {
      console.error(
        `❌ [${module.name}] Restart failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Start service
   */
  private async startService(module: MicroserviceInfo): Promise<void> {
    const distPath = path.join(module.path, 'dist');
    const serviceEnv = {
      ...process.env,
      PORT: module.port.toString(),
      APP_NAME: module.name,
    };

    let command: string;

    if (this.isDevelopmentMode()) {
      command = 'npx nest start --watch --watch-poll=1000';
    } else {
      command = `node ${distPath}/main.js`;
    }

    const childProcess = exec(command, {
      cwd: module.path,
      env: serviceEnv as any,
    });

    // Update process reference
    this.microservices.set(module.name, {
      ...module,
      process: childProcess,
      pid: childProcess.pid,
      watchers: module.watchers,
    });

    // Handle output
    childProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`[${module.name}] ${data.toString().trim()}`);
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[${module.name}] ${data.toString().trim()}`);
    });

    childProcess.on('close', (code: number) => {
      console.log(`\n❌ ${module.name} stopped with code ${code}`);
      this.microservices.delete(module.name);
    });
  }

  /**
   * Wait for process exit
   */
  private async waitForProcessExit(process: ChildProcess): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!process.killed) {
          console.log('⚡ Force killing process...');
          process.kill('SIGKILL');
        }
        resolve();
      }, 5000); // 5 second timeout

      process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Stop all microservices
   */
  async stopAll(): Promise<void> {
    console.log('\n🛑 Stopping all microservices...\n');

    // First try to gracefully stop all microservices
    for (const [name, info] of this.microservices) {
      await this.stopMicroservice(name, info);
    }

    // Stop file watchers
    if (this.localModulesWatcher) {
      this.localModulesWatcher.close();
      console.log('✓ Stopped watching for new microservices');
    }

    // Wait 5 seconds to ensure all processes are stopped
    console.log('⏳ Waiting for processes to stop...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Force cleanup any remaining nest processes
    this.cleanupOrphanProcesses();

    console.log('\n✅ All microservices stopped\n');
  }

  /**
   * Cleanup orphan processes
   */
  private cleanupOrphanProcesses(): void {
    try {
      // Find and kill any remaining nest processes
      const { exec } = require('child_process');
      exec('pkill -f "nest start" 2>/dev/null || true', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  Warning: Could not cleanup orphan processes:', error.message);
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Stop single microservice
   */
  private async stopMicroservice(name: string, info: MicroserviceInfo): Promise<void> {
    try {
      if (info.process) {
        console.log(`🛑 Stopping ${name} (PID: ${info.pid})...`);

        // Mark as killed
        (info.process as any).killed = true;

        // Stop all file watchers
        if (info.watchers) {
          for (const [key, watcher] of info.watchers) {
            if (watcher && watcher.close) {
              watcher.close();
              console.log(`  ✓ Stopped watcher: ${key}`);
            }
          }
        }

        // Wait for process to completely exit
        await this.waitForProcessExit(info.process);

        console.log(`✅ ${name} stopped`);
        this.microservices.delete(name);
      }
    } catch (error) {
      console.error(
        `❌ Error stopping ${name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Set up local modules directory watcher to detect new microservices
   */
  private setupLocalModulesWatcher(): void {
    try {
      const chokidar = require('chokidar');

      // Watch local modules directory
      this.localModulesWatcher = chokidar.watch(this.localModulesDir, {
        ignored: /node_modules|\.git/,
        persistent: true,
        ignoreInitial: true,
        depth: 2, // Watch nested microservice directories
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100,
        },
      });

      this.localModulesWatcher.on('addDir', (dirPath: string) => {
        // Check if it's a new microservice directory
        this.handleNewMicroservice(dirPath);
      });

      console.log('👁️  Started watching for new microservices...');
    } catch (error) {
      console.error(
        '❌ Error setting up local modules watcher:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle newly created microservice
   */
  private async handleNewMicroservice(dirPath: string): Promise<void> {
    const moduleName = path.basename(dirPath);
    const moduleConfigPath = path.join(dirPath, 'module.config.json');

    // Wait for file to be completely written
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if it's a valid microservice
    if (fs.existsSync(moduleConfigPath)) {
      try {
        const config = await fs.readJson(moduleConfigPath);

        if (config.type === 'microservice' && config.port) {
          console.log(`\n🆕 New microservice detected: ${moduleName}`);

          // Check if already started
          if (this.microservices.has(moduleName)) {
            console.log(`⏭️  ${moduleName} is already running`);
            return;
          }

          // Start new microservice
          const moduleInfo: MicroserviceInfo = {
            name: moduleName,
            path: dirPath,
            port: config.port,
          };

          await this.startMicroservice(moduleInfo);
          console.log(`✅ Auto-started new microservice: ${moduleName} on port ${config.port}\n`);
        }
      } catch (error) {
        console.error(
          `❌ Error reading module config for ${moduleName}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * Check if in development mode
   */
  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check main service port occupancy and auto-terminate if occupied
   */
  private async checkMainServicePort(): Promise<void> {
    const mainPort = parseInt(process.env.PORT || '3000');
    const currentPid = process.pid;

    if (await this.isPortActuallyInUse(mainPort)) {
      // Get process ID list occupying the port
      const pids = await this.getProcessesUsingPort(mainPort);

      // Filter out current process
      const otherPids = pids.filter((pid) => pid !== currentPid);

      if (otherPids.length > 0) {
        console.log(
          `⚠️  Main service port ${mainPort} is occupied by other processes, auto-cleaning...`
        );
        console.log(`🔍 Found ${otherPids.length} other processes occupying port ${mainPort}:`);

        for (const pid of otherPids) {
          console.log(`   - Process PID: ${pid}`);
          try {
            // Try graceful termination first
            process.kill(pid, 'SIGTERM');
            console.log(`✓ Sent SIGTERM signal to process ${pid}`);

            // Wait 2 seconds, force terminate if still running
            await new Promise((resolve) => setTimeout(resolve, 2000));

            if (await this.isProcessRunning(pid)) {
              process.kill(pid, 'SIGKILL');
              console.log(`⚡ Force terminated process ${pid}`);
            }
          } catch (error) {
            console.log(`❌ Unable to terminate process ${pid}: ${error}`);
          }
        }

        // Check if port is released again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (await this.isPortActuallyInUse(mainPort)) {
          console.log(`❌ Port ${mainPort} is still occupied, please check manually`);
        } else {
          console.log(`✅ Port ${mainPort} successfully released`);
        }
      } else {
        // Only current process occupies port, this is normal
        console.log(
          `✅ Main service port ${mainPort} is occupied by current process (PID: ${currentPid})`
        );
      }
    } else {
      console.log(`✅ Main service port ${mainPort} is available`);
    }
  }

  /**
   * Get process ID list occupying specified port
   */
  private async getProcessesUsingPort(port: number): Promise<number[]> {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`lsof -t -i :${port}`, (error: any, stdout: string, stderr: string) => {
        if (error || !stdout) {
          resolve([]);
          return;
        }

        const pids = stdout
          .trim()
          .split('\n')
          .map((line) => parseInt(line.trim()))
          .filter((pid) => !isNaN(pid));

        resolve(pids);
      });
    });
  }

  /**
   * Check if process is still running
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`kill -0 ${pid}`, (error: any) => {
        resolve(!error);
      });
    });
  }

  /**
   * Clean up local port mappings (simplified version)
   */
  private async cleanupLocalPortMappings(): Promise<void> {
    const portCachePath = path.join(process.cwd(), '.pnce-port-cache.json');

    if (!fs.existsSync(portCachePath)) {
      return;
    }

    try {
      const allocatedPorts = await fs.readJson(portCachePath);
      const validPorts: Record<string, number> = {};
      let cleanedCount = 0;

      console.log('\n🧹 Cleaning up port mappings...');

      for (const [moduleName, port] of Object.entries(allocatedPorts)) {
        // Check if port is occupied
        const portNum = port as number;
        if (await this.isPortActuallyInUse(portNum)) {
          // Port is occupied, check if corresponding microservice exists
          const modulePath = path.join(process.cwd(), 'src', 'local_modules', moduleName);
          const moduleConfigPath = path.join(modulePath, 'module.config.json');

          if (fs.existsSync(moduleConfigPath)) {
            try {
              const config = await fs.readJson(moduleConfigPath);
              if (config.type === 'microservice' && config.port === portNum) {
                // Microservice exists and port matches, keep
                validPorts[moduleName] = portNum;
                console.log(`✓ Kept port mapping: ${moduleName} -> ${portNum}`);
              } else {
                // Microservice config doesn't match, clean up
                cleanedCount++;
                console.log(
                  `🗑️  Cleaned invalid port mapping: ${moduleName} -> ${portNum} (config mismatch)`
                );
              }
            } catch (error) {
              // Unable to read config, clean up
              cleanedCount++;
              console.log(
                `🗑️  Cleaned invalid port mapping: ${moduleName} -> ${portNum} (config read failed)`
              );
            }
          } else {
            // Microservice doesn't exist, clean up
            cleanedCount++;
            console.log(
              `🗑️  Cleaned invalid port mapping: ${moduleName} -> ${portNum} (microservice not found)`
            );
          }
        } else {
          // Port is not occupied, clean up
          cleanedCount++;
          console.log(
            `🗑️  Cleaned invalid port mapping: ${moduleName} -> ${portNum} (port not occupied)`
          );
        }
      }

      // Update port cache file
      if (cleanedCount > 0) {
        await fs.writeJson(portCachePath, validPorts, { spaces: 2 });
        console.log(`✅ Port mapping cleanup completed, cleaned ${cleanedCount} invalid mappings`);
      } else {
        console.log('✅ Port mapping cleanup not needed');
      }
    } catch (error) {
      console.error(
        '❌ Port mapping cleanup failed:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Check if port is actually occupied
   */
  private async isPortActuallyInUse(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const server = net.createServer();

      server.once('error', () => {
        server.close();
        resolve(true); // Port is occupied
      });

      server.once('listening', () => {
        server.close();
        resolve(false); // Port is available
      });

      server.listen(port, '0.0.0.0');
    });
  }
}
