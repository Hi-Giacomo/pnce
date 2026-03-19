#!/usr/bin/env node

import { Command } from 'commander';
import { registercommands } from './commands';
import { CLI_VERSION } from './config/default.config';
import { initLogger, getLogger } from './utils/logger';
import { ErrorHandler } from './utils/errors';
import { getAliasManager } from './utils/alias-manager';

// Initialize logging system
initLogger()
  .then(() => {
    const logger = getLogger();
    logger.info('Pnce CLI started', {
      version: CLI_VERSION,
      cwd: process.cwd(),
    });
  })
  .catch((error) => {
    console.warn('Failed to initialize logging system:', error.message);
  });

// Global error handling
process.on('uncaughtException', (error) => {
  ErrorHandler.handle(error);
});

process.on('unhandledRejection', (reason) => {
  ErrorHandler.handle(reason);
});

const program = new Command();

program
  .name('pnce')
  .description('PNCE CLI - Progressive NestJS CLI for Microservices Architecture')
  .version(CLI_VERSION, '-v, --version')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText(
    'before',
    `
╭───────────────────────────────────────────────────────────╮
│                                                  │
│  PNCE CLI - Progressive NestJS CLI              │
│  Version: ${CLI_VERSION}                           │
│                                                  │
│  A modular development tool for building           │
│  microservices architecture with automatic          │
│  dependency management, port mapping, and        │
│  auto-loading capabilities.                      │
│                                                  │
╰───────────────────────────────────────────────────╯

Usage: pnce [command] [options]

Examples:
  pnce init my-service                    Create a new service
  pnce init my-microservice -t ms          Create a new microservice
  pnce set lang en                        Set language preference
  pnce alias add ls="list -a"           Add command alias

For detailed help on any command, run:
  pnce [command] --help
`
  )
  .addHelpText(
    'after',
    `
╭───────────────────────────────────────────────────────────╮
│                                                  │
│  Command Groups                                  │
│                                                  │
│  Core Commands:                                  │
│  • init        - Initialize new services/microservices │
│  • install     - Install dependencies               │
│  • set         - Configuration management          │
│                                                  │
│  Management Commands:                             │
│  • lang        - Language settings                 │
│  • alias       - Command aliases                   │
│  • analytics   - Usage analytics                  │
│  • profile     - Configuration profiles            │
│  • plugin      - Plugin management                 │
│  • modules     - Module management                │
│  • port        - Port management                  │
│  • registry    - Module registry                  │
│                                                  │
│  Configuration:                                   │
│  • Config file: ~/.pnce/.pnce-config.json   │
│  • Environment: PNCE_ENV=development|production │
│                                                  │
╰───────────────────────────────────────────────────╯

Get started:
  1. Create your first service: pnce init my-app
  2. Navigate to directory: cd my-app
  3. Install dependencies: pnpm install
  4. Start development: pnpm run dev

Need help? Visit: https://github.com/your-org/pnce-cli
`
  );

// Set initial working directory environment variable
if (!process.env.INIT_CWD) {
  // Read from MODULE_INIT_CWD_FILE first (directory saved by cli-wrapper.js)
  if (process.env.MODULE_INIT_CWD_FILE) {
    try {
      const fs = require('fs-extra');
      if (fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        process.env.INIT_CWD = fs.readFileSync(process.env.MODULE_INIT_CWD_FILE, 'utf-8').trim();
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }
    } catch (error) {
      // Ignore error, use process.cwd() as fallback
    }
  }

  // If still no INIT_CWD, use process.cwd()
  if (!process.env.INIT_CWD) {
    process.env.INIT_CWD = process.cwd();
  }
}

// Parse command aliases
let argv = process.argv.slice();
const aliasManager = getAliasManager();

// Try to parse if the first argument is an alias
if (argv.length > 2) {
  const command = argv[2];
  if (command && aliasManager.isAlias(command)) {
    const resolvedArgs = aliasManager.resolve(argv.slice(2));
    if (resolvedArgs.length > 0) {
      argv = [argv[0], ...resolvedArgs] as string[];
    }
  }
}

// Register all commands asynchronously
registercommands(program)
  .then(() => {
    program.parse(argv);

    if (!argv.slice(2).length) {
      program.outputHelp();
    }
  })
  .catch((error) => {
    ErrorHandler.handle(error);
  });
