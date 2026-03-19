import { Command } from 'commander';
import { getLogger } from '../utils/logger';
import { LoggingService, LogConfig } from '../services/logging.service';

/**
 * Register logging commands
 */
export function registerLoggingCommands(program: Command): void {
  const logger = getLogger();

  program
    .command('logs')
    .alias('lg')
    .description('Log management and aggregation')
    .option('-l, --level <level>', 'Log level (debug, info, warn, error)', 'info')
    .option('-s, --service <service>', 'Filter by service name')
    .option('-n, --limit <number>', 'Limit number of logs', '100')
    .option('-f, --format <format>', 'Output format (json, text, combined)', 'combined')
    .option('-o, --output <output>', 'Output destination (console, file, both)', 'both')
    .option('--file <path>', 'Log file path')
    .option('--search <query>', 'Search logs by message content')
    .option('--errors-only', 'Show only error logs')
    .option('--stats', 'Show logging statistics')
    .option('--export <path>', 'Export logs to file')
    .option('--clear', 'Clear log buffer')
    .action(async (options) => {
      try {
        const loggingService = new LoggingService({
          level: options.level as any,
          format: options.format as any,
          output: options.output as any,
          filePath: options.file,
        });

        await loggingService.initialize();

        if (options.clear) {
          loggingService.clearLogs();
          console.log('✅ Log buffer cleared');
          return;
        }

        if (options.stats) {
          showLogStats(loggingService);
          return;
        }

        if (options.export) {
          await loggingService.exportLogs(options.export, 'json');
          return;
        }

        // Display logs
        const logs = getFilteredLogs(loggingService, options);
        displayLogs(logs, options);
      } catch (error) {
        logger.error('Log operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('logs:tail')
    .alias('lt')
    .description('Tail logs in real-time')
    .option('-l, --level <level>', 'Log level filter', 'info')
    .option('-s, --service <service>', 'Filter by service name')
    .option('-f, --format <format>', 'Output format', 'combined')
    .option('--file <path>', 'Log file path')
    .option('--no-follow', 'Do not follow new logs')
    .action(async (options) => {
      try {
        await tailLogs(options);
      } catch (error) {
        logger.error('Log tail operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('logs:search')
    .alias('ls')
    .description('Search logs by content')
    .argument('<query>', 'Search query')
    .option('-s, --service <service>', 'Filter by service name')
    .option('-l, --level <level>', 'Filter by log level')
    .option('-n, --limit <number>', 'Limit results', '50')
    .option('--highlight', 'Highlight matching terms')
    .action(async (query, options) => {
      try {
        const loggingService = new LoggingService();
        await loggingService.initialize();

        const logs = loggingService.searchLogs(query, {
          service: options.service,
          level: options.level as any,
          limit: parseInt(options.limit) || 50,
        });

        displaySearchResults(logs, query, options);
      } catch (error) {
        logger.error('Log search operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('logs:stats')
    .alias('lgs')
    .description('Show logging statistics')
    .option('-j, --json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const loggingService = new LoggingService();
        await loggingService.initialize();

        const stats = loggingService.getStats();
        displayStats(stats, options);
      } catch (error) {
        logger.error('Log stats operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

  program
    .command('logs:export')
    .alias('lex')
    .description('Export logs to file')
    .argument('<path>', 'Export file path')
    .option('-f, --format <format>', 'Export format (json, csv)', 'json')
    .option('-s, --service <service>', 'Filter by service')
    .option('-l, --level <level>', 'Filter by log level')
    .action(async (filePath, options) => {
      try {
        const loggingService = new LoggingService();
        await loggingService.initialize();

        await loggingService.exportLogs(filePath, options.format as 'json' | 'csv');
        console.log(`✅ Logs exported to: ${filePath}`);
      } catch (error) {
        logger.error('Log export operation failed:', error);
        console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

/**
 * Get filtered logs based on options
 */
function getFilteredLogs(loggingService: LoggingService, options: any): any[] {
  const filter: any = {};

  if (options.level) {
    filter.level = options.level;
  }

  if (options.service) {
    filter.service = options.service;
  }

  if (options.limit) {
    filter.limit = parseInt(options.limit);
  }

  if (options.errorsOnly) {
    filter.level = 'error';
  }

  if (options.search) {
    return loggingService.searchLogs(options.search, {
      service: options.service,
      level: options.level,
      limit: options.limit,
    });
  }

  return loggingService.getLogs(filter);
}

/**
 * Display logs in formatted output
 */
function displayLogs(logs: any[], options: any): void {
  if (logs.length === 0) {
    console.log('📭 No logs found');
    return;
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Logs (${logs.length} entries)           │
│                                              │
${logs
  .slice(0, options.limit || logs.length)
  .map((log: any, index: number) => `│  ${formatLogEntry(log, index + 1, options)}    │`)
  .join('')}
${logs.length > (options.limit || logs.length) ? `│  ... and ${logs.length - (options.limit || logs.length)} more entries    │` : ''}
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Display search results
 */
function displaySearchResults(logs: any[], query: string, options: any): void {
  if (logs.length === 0) {
    console.log(`🔍 No logs found for query: "${query}"`);
    return;
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  Search Results: "${query}" (${logs.length})    │
│                                              │
${logs
  .map((log: any, index: number) => {
    let formatted = formatLogEntry(log, index + 1, {
      format: options.highlight ? 'text' : 'combined',
    });

    if (options.highlight) {
      // Simple highlighting - wrap matches in asterisks
      const regex = new RegExp(`(${query})`, 'gi');
      formatted = formatted.replace(regex, '*$1*');
    }

    return `│  ${formatted}    │`;
  })
  .join('')}
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Display log statistics
 */
function displayStats(stats: any, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Logging Statistics                   │
│                                              │
│  Total Logs: ${stats.totalLogs}                   │
│  Error Rate: ${stats.errorRate.toFixed(2)}%             │
│  Avg Logs/Min: ${stats.avgLogsPerMinute.toFixed(2)}        │
│  Time Range: ${stats.oldestLog ? new Date(stats.oldestLog).toLocaleString() : 'N/A'} - ${stats.newestLog ? new Date(stats.newestLog).toLocaleString() : 'N/A'}    │
│                                              │
│  Logs by Level:                           │
│  • Debug: ${stats.logsByLevel.debug}                    │
│  • Info: ${stats.logsByLevel.info}                     │
│  • Warn: ${stats.logsByLevel.warn}                    │
│  • Error: ${stats.logsByLevel.error}                   │
│                                              │
│  Logs by Service:                          │
│  ${
    Object.entries(stats.logsByService).length === 0
      ? '   No services logged'
      : Object.entries(stats.logsByService)
          .slice(0, 10)
          .map(([service, count]) => `   • ${service.padEnd(20)}: ${count}`)
          .join('\n')
  }                                              │
│                                              │
╰───────────────────────────────────────────────╯
  `);
}

/**
 * Show log statistics (simplified)
 */
function showLogStats(loggingService: LoggingService): void {
  const stats = loggingService.getStats();
  displayStats(stats, {});
}

/**
 * Format log entry for display
 */
function formatLogEntry(log: any, index: number, options: any): string {
  const timestamp = new Date(log.timestamp).toLocaleString();
  const level = log.level.toUpperCase().padEnd(5);
  const service = log.service.padEnd(15);
  const message = log.message.substring(0, 80) + (log.message.length > 80 ? '...' : '');

  return `${index.toString().padStart(3)}. [${timestamp}] [${level}] [${service}] ${message}`;
}

/**
 * Tail logs in real-time
 */
async function tailLogs(options: any): Promise<void> {
  console.log(`
╭───────────────────────────────────────────────────╮
│                                              │
│  PNCE Log Tailer                          │
│                                              │
│  Following logs... Press Ctrl+C to stop     │
│                                              │
│  Level: ${options.level || 'info'}                    │
│  Service: ${options.service || 'all'}                │
│  Format: ${options.format || 'combined'}              │
│                                              │
╰───────────────────────────────────────────────╯
  `);

  const loggingService = new LoggingService({
    level: options.level as any,
    format: options.format as any,
    filePath: options.file,
  });

  await loggingService.initialize();

  // Set up log listener
  loggingService.on('log', (logEntry) => {
    const shouldDisplay = !options.service || logEntry.service === options.service;

    if (shouldDisplay) {
      const formatted = formatLogEntry(logEntry, 0, options);
      console.log(formatted);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping log tailer...');
    process.exit(0);
  });

  // Keep process running
  return new Promise(() => {});
}
