import { Command } from 'commander';
import { getLogger } from '../utils/logger';
import { ConfigReloadService } from '../services/config-reload.service';
import * as path from 'path';

/**
 * Register config reload commands
 */
export function registerConfigReloadCommands(program: Command): void {
  const logger = getLogger();

  program
    .command('config:reload')
    .alias('cr')
    .description('Configuration hot reload management')
    .option('-w, --watch', 'Start watching configuration files for hot reload')
    .option('-f, --files <files...>', 'Configuration files to watch (comma-separated)')
    .option('-r, --reload', 'Trigger configuration reload')
    .option('-s, --stats', 'Show reload statistics')
    .option('-j, --json', 'Output results in JSON format')
    .option('-d, --debounce <ms>', 'Debounce time in milliseconds', '500')
    .action(async (options) => {
      try {
        const reloadService = new ConfigReloadService();

        if (options.watch) {
          await startConfigWatching(reloadService, options);
        } else if (options.reload) {
          await triggerReload(reloadService);
        } else if (options.stats) {
          showReloadStats(reloadService, options);
        } else {
          showConfigReloadHelp();
        }
      } catch (error) {
        logger.error('Config reload operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('config:watch')
    .alias('cw')
    .description('Watch configuration files for changes')
    .option('-f, --files <files...>', 'Configuration files to watch (comma-separated)')
    .option('-d, --debounce <ms>', 'Debounce time in milliseconds', '500')
    .option('-v, --verbose', 'Show verbose output')
    .action(async (options) => {
      try {
        const reloadService = new ConfigReloadService();
        await startConfigWatching(reloadService, options);
      } catch (error) {
        logger.error('Config watch operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('config:reload-all')
    .alias('cra')
    .description('Reload all watched configuration files')
    .action(async () => {
      try {
        const reloadService = new ConfigReloadService();
        await triggerReload(reloadService);
      } catch (error) {
        logger.error('Config reload all operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

/**
 * Start configuration file watching
 */
async function startConfigWatching(
  reloadService: ConfigReloadService,
  options: any
): Promise<void> {
  let configFiles: string[];

  if (options.files) {
    configFiles = options.files.flat();
  } else {
    // Default configuration files to watch
    configFiles = [
      '.pnce-config.json',
      'module.config.json',
      '.pnce-port-cache.json',
      'package.json',
      '.env',
      'tsconfig.json',
      'nest-cli.json',
    ];
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Configuration Hot Reload             │
│                                              │
│  Watching Files:                           │
│  ${configFiles.map((f) => `  • ${f}`).join('\n')}          │
│                                              │
│  Debounce: ${options.debounce || 500}ms           │
│                                              │
│  Press Ctrl+C to stop watching               │
│                                              │
╰───────────────────────────────────────────────╯
  `);

  // Set up event listeners
  reloadService.on('file_added', (event) => {
    console.log(`📄 ${event.type.toUpperCase()}: ${event.filePath}`);
    if (options.verbose) {
      console.log(`   Content: ${JSON.stringify(event.content, null, 2)}`);
    }
  });

  reloadService.on('file_changed', (event) => {
    console.log(`🔄 ${event.type.toUpperCase()}: ${event.filePath}`);
    if (options.verbose) {
      console.log(`   Changes detected, hot reloading...`);
      if (event.oldContent && event.content) {
        console.log(`   Old: ${JSON.stringify(event.oldContent, null, 2)}`);
        console.log(`   New: ${JSON.stringify(event.content, null, 2)}`);
      }
    }
  });

  reloadService.on('file_removed', (event) => {
    console.log(`🗑️  ${event.type.toUpperCase()}: ${event.filePath}`);
  });

  reloadService.on('error', (event) => {
    console.error(`❌ ${event.type.toUpperCase()}: ${event.filePath}`);
    console.error(`   Error: ${event.error?.message || String(event.error)}`);
  });

  // Start watching
  await reloadService.startWatching(configFiles);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping configuration watching...');
    reloadService.stopWatching();
    process.exit(0);
  });

  // Keep process running
  return new Promise(() => {});
}

/**
 * Trigger configuration reload
 */
async function triggerReload(reloadService: ConfigReloadService): Promise<void> {
  console.log('🔄 Triggering configuration reload...');

  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeout = setTimeout(() => {
      reject(new Error('Reload timeout'));
    }, 10000);

    // Listen for reload completion
    let reloadCount = 0;
    const checkComplete = () => {
      reloadCount++;
      const stats = reloadService.getStats();

      if (stats.watchedFiles > 0 && reloadCount >= stats.watchedFiles) {
        clearTimeout(timeout);
        console.log('✅ Configuration reload completed');
        resolve();
      }
    };

    // Start watching and reload
    reloadService.startWatching(reloadService.getWatchedFiles().map((f) => f.path));
    reloadService.on('file_changed', checkComplete);
    reloadService.reloadAll();
  });
}

/**
 * Show reload statistics
 */
function showReloadStats(reloadService: ConfigReloadService, options: any): void {
  const stats = reloadService.getStats();
  const files = reloadService.getWatchedFiles();

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          stats,
          files: files.map((f) => ({
            path: f.path,
            lastModified: new Date(f.lastModified).toISOString(),
            checksum: f.checksum,
          })),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Configuration Reload Status           │
│                                              │
│  Statistics:                                │
│  • Watched Files: ${stats.watchedFiles}              │
│  • Active Watchers: ${stats.activeWatchers}         │
│  • Uptime: ${formatUptime(stats.uptime)}           │
│                                              │
│  Files:                                     │
│  ${
    files.length === 0
      ? '   No files being watched'
      : files
          .map(
            (f) =>
              `   📄 ${path.basename(f.path).padEnd(25)} ${new Date(f.lastModified).toLocaleString()}    │`
          )
          .join('')
  }                              │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Show configuration reload help
 */
function showConfigReloadHelp(): void {
  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Configuration Hot Reload             │
│                                              │
│  USAGE:                                      │
│  • pnce config:reload --watch                │
│      Start watching config files         │
│  • pnce config:reload --reload              │
│      Trigger configuration reload       │
│  • pnce config:reload --stats                │
│      Show reload statistics            │
│                                              │
│  OPTIONS:                                    │
│  • -w, --watch      Start file watching      │
│  • -f, --files      Files to watch (comma-separated) │
│  • -r, --reload     Trigger reload           │
│  • -s, --stats      Show statistics         │
│  • -d, --debounce   Debounce time (ms)     │
│  • -j, --json       JSON output            │
│  • -v, --verbose    Verbose output         │
│                                              │
│  EXAMPLES:                                   │
│  pnce config:reload --watch                   │
│  pnce config:reload --watch --files .env,package.json │
│  pnce config:reload --reload                   │
│  pnce config:reload --stats                     │
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
