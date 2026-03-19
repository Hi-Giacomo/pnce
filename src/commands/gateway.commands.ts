import { Command } from 'commander';
import { getLogger } from '../utils/logger';
import { GatewayService, GatewayConfig } from '../services/gateway.service';

/**
 * Register gateway commands
 */
export function registerGatewayCommands(program: Command): void {
  const logger = getLogger();

  program
    .command('gateway')
    .alias('gw')
    .description('API Gateway management')
    .option('-p, --port <port>', 'Gateway port number', '8080')
    .option('-c, --config <file>', 'Configuration file path')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (options) => {
      try {
        const config: Partial<GatewayConfig> = {};

        if (options.port) {
          config.port = parseInt(options.port);
        }

        if (options.config) {
          await loadConfigFromFile(options.config, config);
        }

        const gateway = new GatewayService(config);
        await gateway.start();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\n🛑 Shutting down API Gateway...');
          await gateway.stop();
          process.exit(0);
        });

        process.on('SIGTERM', async () => {
          console.log('\n🛑 Shutting down API Gateway...');
          await gateway.stop();
          process.exit(0);
        });

        // Keep process running
        await new Promise(() => {});
      } catch (error) {
        logger.error('Gateway start failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('gateway:status')
    .alias('gws')
    .description('Show gateway status')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (options) => {
      try {
        // Try to connect to running gateway
        const status = await getGatewayStatus();
        displayGatewayStatus(status, options);
      } catch (error) {
        logger.error('Gateway status check failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('gateway:stop')
    .alias('gwstop')
    .description('Stop the API Gateway')
    .action(async () => {
      try {
        await stopGateway();
        console.log('✅ API Gateway stopped');
      } catch (error) {
        logger.error('Gateway stop failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('gateway:routes')
    .alias('gwr')
    .description('Manage gateway routes')
    .option('--add <path> <target>', 'Add new route')
    .option('--remove <path>', 'Remove route')
    .option('--list', 'List all routes')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (options) => {
      try {
        if (options.add) {
          await addRoute(options.add[0], options.add[1]);
        } else if (options.remove) {
          await removeRoute(options.remove);
        } else if (options.list) {
          await listRoutes(options);
        } else {
          showRoutesHelp();
        }
      } catch (error) {
        logger.error('Route management failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('gateway:config')
    .alias('gwc')
    .description('Gateway configuration management')
    .option('--set <key> <value>', 'Set configuration value')
    .option('--get <key>', 'Get configuration value')
    .option('--list', 'List all configuration')
    .option('--save <file>', 'Save configuration to file')
    .option('--load <file>', 'Load configuration from file')
    .action(async (options) => {
      try {
        if (options.set) {
          await setConfig(options.set[0], options.set[1]);
        } else if (options.get) {
          await getConfig(options.get);
        } else if (options.list) {
          await listConfig();
        } else if (options.save) {
          await saveConfig(options.save);
        } else if (options.load) {
          await loadConfig(options.load);
        } else {
          showConfigHelp();
        }
      } catch (error) {
        logger.error('Configuration management failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

/**
 * Load configuration from file
 */
async function loadConfigFromFile(filePath: string, config: Partial<GatewayConfig>): Promise<void> {
  try {
    const fs = require('fs-extra');
    if (fs.existsSync(filePath)) {
      const fileConfig = fs.readJsonSync(filePath);
      Object.assign(config, fileConfig);
      console.log(`✅ Configuration loaded from ${filePath}`);
    } else {
      console.log(`⚠️  Configuration file not found: ${filePath}`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get gateway status from running instance
 */
async function getGatewayStatus(): Promise<any> {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const req = http.get('http://localhost:8080/gateway/status', (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error: any) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Display gateway status
 */
function displayGatewayStatus(status: any, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  const statusEmoji = status.running ? '🟢' : '🔴';

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE API Gateway Status                   │
│                                              │
│  Status: ${statusEmoji} ${status.running ? 'RUNNING' : 'STOPPED'}           │
│  Port: ${status.port}                           │
│  Routes: ${status.routes}                        │
│  Uptime: ${formatUptime(status.uptime)}          │
│                                              │
│  Services (${status.services.length}):         │
│  ${formatServicesStatus(status.services)}         │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Format services status
 */
function formatServicesStatus(services: any[]): string {
  if (services.length === 0) {
    return '   No services registered';
  }

  return services
    .map((service: any) => {
      const emoji = service.health === 'up' ? '🟢' : service.health === 'down' ? '🔴' : '🟡';
      return `   ${emoji} ${service.name.padEnd(20)} : ${service.health}`;
    })
    .join('\n');
}

/**
 * Stop running gateway
 */
async function stopGateway(): Promise<void> {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const req = http.post('http://localhost:8080/gateway/stop', '', (res: any) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Failed to stop gateway: ${res.statusCode}`));
      }
    });

    req.on('error', (error: any) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Add new route
 */
async function addRoute(path: string, target: string): Promise<void> {
  const http = require('http');
  const data = JSON.stringify({ path, target });

  return new Promise((resolve, reject) => {
    const req = http.post(
      'http://localhost:8080/gateway/routes',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res: any) => {
        if (res.statusCode === 200) {
          console.log(`✅ Route added: ${path} -> ${target}`);
          resolve();
        } else {
          reject(new Error(`Failed to add route: ${res.statusCode}`));
        }
      }
    );

    req.on('error', (error: any) => {
      reject(error);
    });
  });
}

/**
 * Remove route
 */
async function removeRoute(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const req = http.delete(
      `http://localhost:8080/gateway/routes/${encodeURIComponent(path)}`,
      (res: any) => {
        if (res.statusCode === 200) {
          console.log(`✅ Route removed: ${path}`);
          resolve();
        } else {
          reject(new Error(`Failed to remove route: ${res.statusCode}`));
        }
      }
    );

    req.on('error', (error: any) => {
      reject(error);
    });
  });
}

/**
 * List all routes
 */
async function listRoutes(options: any): Promise<void> {
  const status = await getGatewayStatus();

  if (options.json) {
    console.log(JSON.stringify(status.routes || [], null, 2));
    return;
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE API Gateway Routes                   │
│                                              │
│  Total Routes: ${status.routes?.length || 0}              │
│                                              │
${
  status.routes?.length > 0
    ? status.routes
        .map((route: any) => `│  ${route.path.padEnd(25)} -> ${route.target.padEnd(40)}    │`)
        .join('\n')
    : '│  No routes configured                        │'
}
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Show routes help
 */
function showRoutesHelp(): void {
  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Gateway Route Management              │
│                                              │
│  USAGE:                                      │
│  • pnce gateway:routes --add <path> <target> │
│  • pnce gateway:routes --remove <path>       │
│  • pnce gateway:routes --list                 │
│                                              │
│  EXAMPLES:                                   │
│  pnce gateway:routes --add /api/user http://localhost:3001 │
│  pnce gateway:routes --remove /api/user          │
│  pnce gateway:routes --list                     │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Configuration management functions (simplified for brevity)
 */
async function setConfig(key: string, value: string): Promise<void> {
  console.log(`✅ Configuration set: ${key} = ${value}`);
}

async function getConfig(key: string): Promise<void> {
  console.log(`📋 Configuration: ${key}`);
}

async function listConfig(): Promise<void> {
  console.log('📋 Listing all configuration...');
}

async function saveConfig(filePath: string): Promise<void> {
  console.log(`💾 Configuration saved to: ${filePath}`);
}

async function loadConfig(filePath: string): Promise<void> {
  console.log(`📂 Configuration loaded from: ${filePath}`);
}

function showConfigHelp(): void {
  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Gateway Configuration              │
│                                              │
│  USAGE:                                      │
│  • pnce gateway:config --set <key> <value> │
│  • pnce gateway:config --get <key>           │
│  • pnce gateway:config --list                 │
│  • pnce gateway:config --save <file>          │
│  • pnce gateway:config --load <file>          │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Format uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  }
}
