import { Command } from 'commander';
import { getLogger } from '../utils/logger';
import { HealthCheckService, HealthCheckResult } from '../services/health-check.service';

/**
 * Register health check commands
 */
export function registerHealthCommands(program: Command): void {
  const logger = getLogger();

  program
    .command('health')
    .alias('h')
    .description('Check health status of services')
    .option('-w, --watch', 'Enable continuous health monitoring')
    .option('-i, --interval <seconds>', 'Health check interval in seconds', '30')
    .option('-j, --json', 'Output results in JSON format')
    .option('-v, --verbose', 'Show detailed health information')
    .action(async (options) => {
      try {
        const healthService = new HealthCheckService();

        if (options.watch) {
          await startHealthMonitoring(healthService, options);
        } else {
          const result = await healthService.performHealthCheck();
          displayHealthResult(result, options);
        }
      } catch (error) {
        logger.error('Health check failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('health:check [service]')
    .alias('hc')
    .description('Check health of specific service')
    .option('-p, --port <port>', 'Service port number')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (serviceName, options) => {
      try {
        const healthService = new HealthCheckService();

        if (!serviceName || !options.port) {
          console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Health Check Command                    │
│                                              │
│  USAGE:                                      │
│  • pnce health:check <service> --port <port> │
│  • pnce hc <service> --port <port>         │
│                                              │
│  EXAMPLES:                                   │
│  pnce health:check user-service --port 3001   │
│  pnce hc api-service --port 3000 --json     │
│                                              │
│  OPTIONS:                                    │
│  • -p, --port     Service port number         │
│  • -j, --json     Output in JSON format       │
│                                              │
╰───────────────────────────────────────────────╯
          `);
          return;
        }

        const health = await healthService.checkServiceHealth(serviceName, parseInt(options.port));
        displayServiceHealth(health, options);
      } catch (error) {
        logger.error('Service health check failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('health:stats')
    .alias('hs')
    .description('Show health statistics')
    .option('-j, --json', 'Output results in JSON format')
    .action(async (options) => {
      try {
        const healthService = new HealthCheckService();
        const stats = healthService.getHealthStats();
        displayHealthStats(stats, options);
      } catch (error) {
        logger.error('Health stats failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('health:monitor')
    .alias('hm')
    .description('Start continuous health monitoring')
    .option('-i, --interval <seconds>', 'Health check interval in seconds', '30')
    .option('-o, --output <file>', 'Save health logs to file')
    .action(async (options) => {
      try {
        const healthService = new HealthCheckService();
        await startHealthMonitoring(healthService, options);
      } catch (error) {
        logger.error('Health monitoring failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

/**
 * Start continuous health monitoring
 */
async function startHealthMonitoring(
  healthService: HealthCheckService,
  options: any
): Promise<void> {
  const interval = parseInt(options.interval) * 1000;

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Health Monitoring Started                 │
│                                              │
│  Configuration:                               │
│  • Check Interval: ${options.interval} seconds    │
│  • Output Format: ${options.json ? 'JSON' : 'Table'}    │
│  ${options.output ? `• Log File: ${options.output}` : ''}    │
│                                              │
│  Press Ctrl+C to stop monitoring               │
│                                              │
╰───────────────────────────────────────────────╯
  `);

  // Set up signal handlers for graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping health monitoring...');
    healthService.stopHealthMonitoring();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Stopping health monitoring...');
    healthService.stopHealthMonitoring();
    process.exit(0);
  });

  // Start monitoring
  healthService.startHealthMonitoring();

  // Perform periodic checks
  const checkInterval = setInterval(async () => {
    try {
      const result = await healthService.performHealthCheck();
      displayHealthResult(result, options);

      if (options.output) {
        await saveHealthToFile(result, options.output);
      }
    } catch (error) {
      console.error(
        `❌ Health check error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, interval);

  // Keep the process running
  return new Promise(() => {});
}

/**
 * Display health check result
 */
function displayHealthResult(result: HealthCheckResult, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const statusEmoji: { [key: string]: string } = {
    healthy: '🟢',
    unhealthy: '🔴',
    degraded: '🟡',
  };

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Health Status                          │
│                                              │
│  Overall Status: ${statusEmoji[result.status]} ${result.status.toUpperCase()}     │
│  Last Check: ${result.timestamp}                │
│  Uptime: ${formatUptime(result.uptime)}         │
│                                              │
│  Memory Usage:                               │
│  • RSS: ${formatBytes(result.memory.rss)}        │
│  • Heap Used: ${formatBytes(result.memory.heapUsed)}    │
│  • Heap Total: ${formatBytes(result.memory.heapTotal)}  │
│  • Usage: ${((result.memory.heapUsed / result.memory.heapTotal) * 100).toFixed(1)}%      │
│                                              │
│  System Info:                                │
│  • Platform: ${result.system.platform}          │
│  • Node.js: ${result.system.nodeVersion}        │
│  • Arch: ${result.system.arch}                 │
│  • Load Avg: ${result.system.loadAverage[0].toFixed(2)}    │
│                                              │
│  Services (${result.services.length}):             │
│  ${formatServicesTable(result.services, options.verbose)}
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Display service health
 */
function displayServiceHealth(health: any, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  const statusEmoji: { [key: string]: string } = {
    up: '🟢',
    down: '🔴',
    unknown: '🟡',
  };

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  Service Health: ${health.name}                 │
│                                              │
│  Status: ${statusEmoji[health.status]} ${health.status.toUpperCase()}            │
│  Port: ${health.port}                           │
│  Last Check: ${health.lastCheck}              │
│  ${health.responseTime ? `Response Time: ${health.responseTime}ms` : ''}      │
│  ${health.error ? `Error: ${health.error}` : ''}                │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Display health statistics
 */
function displayHealthStats(stats: any, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  const healthPercentage =
    stats.totalServices > 0
      ? ((stats.healthyServices / stats.totalServices) * 100).toFixed(1)
      : '0.0';

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Health Statistics                      │
│                                              │
│  Total Services: ${stats.totalServices}             │
│  Healthy: 🟢 ${stats.healthyServices}                  │
│  Unhealthy: 🔴 ${stats.unhealthyServices}                │
│  Health Rate: ${healthPercentage}%                   │
│  System Uptime: ${formatUptime(stats.uptime)}      │
│  Last Check: ${stats.lastCheck}                │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Format services table
 */
function formatServicesTable(services: any[], verbose: boolean = false): string {
  if (services.length === 0) {
    return '   No services registered';
  }

  const statusEmoji: { [key: string]: string } = {
    up: '🟢',
    down: '🔴',
    unknown: '🟡',
  };

  let table = '';
  services.forEach((service) => {
    table += `   ${statusEmoji[service.status]} ${service.name.padEnd(20)} :${service.port.toString().padEnd(5)}`;
    if (verbose) {
      table += ` (${service.responseTime ? service.responseTime + 'ms' : 'N/A'})`;
    }
    if (service.error) {
      table += ` - ${service.error}`;
    }
    table += '\n';
  });

  return table.trim();
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

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${size} ${sizes[i]}`;
}

/**
 * Save health result to file
 */
async function saveHealthToFile(result: HealthCheckResult, filename: string): Promise<void> {
  try {
    const fs = require('fs-extra');
    const logEntry = {
      timestamp: result.timestamp,
      status: result.status,
      services: result.services,
      memory: result.memory,
      system: result.system,
    };

    let logs = [];
    if (fs.existsSync(filename)) {
      logs = fs.readJsonSync(filename);
    }

    logs.push(logEntry);

    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    await fs.writeJson(filename, logs, { spaces: 2 });
  } catch (error) {
    console.error(
      `❌ Failed to save health log: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
