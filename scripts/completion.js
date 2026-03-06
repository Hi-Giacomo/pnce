#!/usr/bin/env node

/**
 * PNCE CLI 命令自动补全脚本
 *
 * 使用说明：
 * 1. 为当前 shell 生成补全脚本：
 *    pnce completion >> ~/.bashrc  # Bash
 *    pnce completion >> ~/.zshrc   # Zsh
 *    pnce completion >> ~/.config/fish/completions/pnce.fish  # Fish
 *
 * 2. 重新加载配置文件或重启终端
 *
 * 3. 输入 `pnce <Tab>` 即可触发自动补全
 */

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('pnce')
  .description('Pnce CLI Tool - 模块化快速开发命令行工具')
  .version(require('../package.json').version);

// 导入并注册所有命令
const commandsDir = path.join(__dirname, '../dist/commands');
const fs = require('fs');

if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const commandModule = require(path.join(commandsDir, file));
      if (commandModule.register && typeof commandModule.register === 'function') {
        commandModule.register(program);
      }
    } catch (error) {
      console.error(`加载命令失败 ${file}:`, error.message);
    }
  }
}

// 使用 Commander 的自动补全功能
if (process.argv[2] === 'completion') {
  program.enablePositionalOptions();
  program.showCompletionScript();
} else {
  program.parse(process.argv);
}
