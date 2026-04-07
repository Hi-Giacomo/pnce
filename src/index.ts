#!/usr/bin/env node

import { Command } from 'commander';
import { registerStartCommand } from './command/start';

const program = new Command();

program.name('pnce').description('Pnce CLI - Modular Rapid Development CLI Tool').version('0.0.9');

// Register commands
registerStartCommand(program);

// Parse arguments
program.parse(process.argv);
