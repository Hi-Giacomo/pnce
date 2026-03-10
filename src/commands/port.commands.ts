import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ErrorHandler } from '../utils/errors';

/**
 * Register port management commands
 * @param program - Commander program instance
 */
export function registerPortCommands(program: Command): void {
  // Port managementcommand
  program
    .command('ports')
    .description('Port management (view or clear port cache)')
    .option('-c, --clear', 'Clear port cache')
    .option('-s, --show', 'Show port allocation info')
    .action(async (options) => {
      try {
        const portCachePath = path.join(
          process.env.INIT_CWD || process.cwd(),
          '.module-port-cache.json'
        );

        // Clear port cache
        if (options.clear) {
          if (fs.existsSync(portCachePath)) {
            fs.removeSync(portCachePath);
            console.log('✓ Port cache cleared');
          } else {
            console.log('Port cache file does not exist');
          }
          return;
        }

        // Show port allocation info (default)
        if (fs.existsSync(portCachePath)) {
          const portCache = fs.readJsonSync(portCachePath);
          console.log('\n📊 Port allocation info:');
          console.log('─'.repeat(40));

          Object.entries(portCache).forEach(([name, port]: [string, any]) => {
            console.log(`  ${name.padEnd(20)} -> ${port}`);
          });

          console.log('─'.repeat(40));
          console.log(`  Cache file: ${portCachePath}\n`);
        } else {
          console.log('Port cache file does not exist');
          console.log('Hint: Run `npm run dev` to automatically create the cache file');
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    });
}
