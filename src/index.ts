#!/usr/bin/env node

import { Command } from "commander";
import { registerCommands } from "./commands";
import { CLI_VERSION } from "./config/default.config";
import { initLogger, getLogger } from "./utils/logger";
import { ErrorHandler } from "./utils/errors";
import { getAliasManager } from "./utils/alias-manager";

// 初始化日志系统
initLogger().then(() => {
  const logger = getLogger();
  logger.info('Pnce CLI启动', {
    version: CLI_VERSION,
    cwd: process.cwd(),
  });
}).catch(error => {
  console.warn('初始化日志系统失败:', error.message);
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  ErrorHandler.handle(error);
});

process.on('unhandledRejection', (reason) => {
  ErrorHandler.handle(reason);
});

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

// 解析命令别名
let argv = process.argv.slice();
const aliasManager = getAliasManager();

// 尝试解析第一个参数是否为别名
if (argv.length > 2) {
  const command = argv[2];
  if (aliasManager.isAlias(command)) {
    const resolvedArgs = aliasManager.resolve(argv.slice(2));
    if (resolvedArgs.length > 0) {
      argv = [argv[0], ...resolvedArgs];
    }
  }
}

// 异步注册所有命令
registerCommands(program).then(() => {
  program.parse(argv);

  if (!argv.slice(2).length) {
    program.outputHelp();
  }
}).catch(error => {
  ErrorHandler.handle(error);
});
