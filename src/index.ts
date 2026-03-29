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
  .description('Lightweight CLI for NestJS microservices development')
  .version(CLI_VERSION, '-v, --version')
  .helpOption('-h, --help', 'Display help for command');

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
