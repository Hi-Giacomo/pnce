#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');

// 尝试从多个来源获取初始目录
// 1. npm/yarn 设置的 INIT_CWD
// 2. 某些 shell 设置的 PWD
// 3. 当前工作目录
let initialCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();

// 如果用户使用相对路径调用此脚本（如 node ../command-line-tools/cli-wrapper.js），
// 那么 process.cwd() 就是调用目录，我们可以直接使用
// 但是如果工作目录被改变了（通过 cd 命令），我们就无法确定原始调用目录

// 保存到临时文件
const tempDir = path.join(require('os').homedir(), '.module-temp');
fs.ensureDirSync(tempDir);
const tempFile = path.join(tempDir, '.init-cwd-' + Date.now());
fs.writeFileSync(tempFile, initialCwd);

// 传递文件名给 CLI
process.env.MODULE_INIT_CWD_FILE = tempFile;

// 获取 dist 目录的绝对路径
const distPath = path.join(__dirname, 'dist', 'index.js');

// 执行 CLI
require(distPath);



