#!/usr/bin/env node

import { Command } from "commander";
import { registerCommands } from "./commands";
import { CLI_VERSION } from "./config/default.config";

const program = new Command();

program
  .name("pnce")
  .description("Pnce CLI Tool - 模块化快速开发命令行工具")
  .version(CLI_VERSION, "-v, --version");

// 设置初始工作目录环境变量
if (!process.env.INIT_CWD) {
  // 优先从 MODULE_INIT_CWD_FILE 读取（cli-wrapper.js 保存的调用目录）
  if (process.env.MODULE_INIT_CWD_FILE) {
    try {
      const fs = require("fs-extra");
      if (fs.existsSync(process.env.MODULE_INIT_CWD_FILE)) {
        process.env.INIT_CWD = fs
          .readFileSync(process.env.MODULE_INIT_CWD_FILE, "utf-8")
          .trim();
        fs.removeSync(process.env.MODULE_INIT_CWD_FILE);
      }
    } catch (error) {
      // 忽略错误，使用 process.cwd() 作为后备
    }
  }

  // 如果仍然没有 INIT_CWD，使用 process.cwd()
  if (!process.env.INIT_CWD) {
    process.env.INIT_CWD = process.cwd();
  }
}

// 注册所有命令
registerCommands(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
