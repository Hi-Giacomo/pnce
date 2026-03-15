#!/usr/bin/env node

/**
 * PNCE CLI 
 *
 * UseInstructions：
 * 1. Current shell ：
 *    pnce completion >> ~/.bashrc  # Bash
 *    pnce completion >> ~/.zshrc   # Zsh
 *    pnce completion >> ~/.config/fish/completions/pnce.fish  # Fish
 *
 * 2. LoadConfigurefileRestart
 *
 * 3. Input `pnce <Tab>` 
 */

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('pnce')
  .description('Pnce CLI Tool - moduleUtility')
  .version(require('../package.json').version);

// ImportRegister
const commandsDir = path.join(__dirname, '../dist/commands');
const fs = require('fs');

if (fs.existsSync(commandsDir)) {
  const commandfiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

  for (const file of commandfiles) {
    try {
      const commandModule = require(path.join(commandsDir, file));
      if (commandModule.register && typeof commandModule.register === 'function') {
        commandModule.register(program);
      }
    } catch (error) {
      console.error(`LoadFailure ${file}:`, error.message);
    }
  }
}

// Use Commander Feature
if (process.argv[2] === 'completion') {
  program.enablePositionalOptions();
  program.showCompletionScript();
} else {
  program.parse(process.argv);
}
