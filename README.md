# Pnce CLI

<div align="center">

**Pnce CLI Tool** - NestJS 模块化快速开发命令行工具

[![npm version](https://img.shields.io/npm/v/pnce.svg)](https://www.npmjs.com/package/pnce)
[![downloads](https://img.shields.io/npm/dm/pnce.svg)](https://www.npmjs.com/package/pnce)
[![license](https://img.shields.io/npm/l/pnce.svg)](LICENSE)

专为 NestJS 设计的模块化开发工具，帮助开发者快速创建、管理、发布和部署 NestJS 服务与微服务模块。

</div>

## ✨ 核心特性

- 🚀 **快速创建** - 一键生成服务/微服务脚手架
- 📦 **模块管理** - 统一的模块发布和安装流程
- 🔗 **依赖管理** - 自动处理模块间的依赖关系
- 📥 **并行下载** - 支持3倍速度的批量模块安装
- 📊 **进度显示** - 实时显示下载和安装进度
- 🔐 **安全认证** - 支持 OAuth2 和邮箱密码登录
- 🛠️ **自动部署** - 一键部署到 Linux 服务器
- ⚙️ **灵活配置** - 支持环境变量和多级配置
- 📝 **完整日志** - 详细的操作日志和错误追踪

## 📋 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [功能列表](#功能列表)
- [详细使用指南](#详细使用指南)
- [命令参考](#命令参考)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 📚 文档

更多详细文档请查看：
- [快速开始](docs/QUICKSTART.md) - 快速上手指南
- [API 文档](docs/API_DOCUMENTATION.md) - API 参考文档
- [架构文档](docs/ARCHITECTURE.md) - 项目架构说明
- [常见问题](docs/FAQ.md) - 常见问题解答
- [故障排除](docs/TROUBLESHOOTING.md) - 问题排查指南
- [变更日志](docs/CHANGELOG.md) - 版本变更记录
- [贡献指南](docs/CONTRIBUTING.md) - 如何参与贡献
- [安全策略](docs/SECURITY.md) - 安全相关政策

## 🚀 安装

### 全局安装

```bash
npm install -g pnce
```

### 验证安装

```bash
pnce --version
pnce --help
```

## 🎯 快速开始

### 1. 登录账户（仅上传模块时需要）

> ⚠️ **注意**：只有在**上传模块到云端**、**删除云端模块**、**更新云端模块版本**时才需要登录。
>
> 安装模块、搜索模块、查看模块信息等操作**不需要登录**。

```bash
# OAuth2 浏览器登录
pnce login

# 邮箱密码登录
pnce login -e your@email.com -p your-password

# 注册新账户
pnce register

# 查看当前登录状态
pnce me

# 登出
pnce logout
```

### 2. 创建服务（无需登录）

```bash
# 创建一个服务
pnce init service my-app

# 创建一个微服务
pnce init microservice my-service
```

### 3. 安装模块（无需登录）

```bash
# 安装单个模块
pnce install user-module

# 安装指定版本
pnce install user-module@1.0.0

# 批量安装（并行，无需登录）
pnce install-batch auth-module user-module payment-module
```

### 4. 发布模块（需要登录）

```bash
# 先登录
pnce login

# 在模块目录中上传
pnce upload

# 或者从指定目录上传
pnce upload -d ./modules/my-module
```

## 🎨 功能列表

### 模块管理

| 功能 | 命令 | 说明 | 需要登录 |
|------|------|------|----------|
| 安装模块 | `pnce install <module>` | 安装单个模块到项目 | ❌ 否 |
| 批量安装 | `pnce install-batch <modules...>` | 并行安装多个模块（3倍速度） | ❌ 否 |
| 上传模块 | `pnce upload` | 发布模块到注册中心 | ✅ 是 |
| 搜索模块 | `pnce search <keyword>` | 搜索可用模块 | ❌ 否 |
| 查看信息 | `pnce info <name>` | 查看模块详细信息 | ❌ 否 |
| 查看列表 | `pnce list` | 列出所有可用模块 | ❌ 否 |
| 查看热门 | `pnce trending` | 查看热门模块 | ❌ 否 |
| 查看统计 | `pnce stats` | 查看全局统计信息 | ❌ 否 |

### 依赖管理

| 功能 | 命令 | 说明 |
|------|------|------|
| 添加依赖 | `pnce modules add <name>` | 添加模块到依赖配置 |
| 移除依赖 | `pnce modules remove <name>` | 从依赖配置中移除 |
| 安装依赖 | `pnce modules install` | 安装配置中的所有依赖 |
| 更新依赖 | `pnce modules update` | 更新所有依赖 |
| 查看依赖 | `pnce modules list` | 查看当前依赖配置 |

### 端口管理

| 功能 | 命令 | 说明 |
|------|------|------|
| 分配端口 | `pnce port assign <name>` | 为模块分配端口 |
| 释放端口 | `pnce port release <name>` | 释放模块端口 |
| 查看端口 | `pnce port list` | 查看端口分配情况 |

### 部署管理

| 功能 | 命令 | 说明 |
|------|------|------|
| 查看配置 | `pnce registry` | 查看注册中心配置 |

### 认证管理

> 💡 **提示**：认证仅在**上传模块到云端**、**删除云端模块**、**更新云端模块版本**时需要。
>
> **不需要登录的操作**：安装模块、搜索模块、查看信息、创建服务等。

| 功能 | 命令 | 说明 |
|------|------|------|
| 登录 | `pnce login` | 登录账户（上传模块前需要） |
| 注册 | `pnce register` | 注册新账户 |
| 查看用户 | `pnce me` | 查看当前用户信息 |
| 登出 | `pnce logout` | 登出账户 |

## 📖 详细使用指南

### 模块安装

#### 基础安装

```bash
# 安装最新版本
pnce install user-module

# 安装指定版本
pnce install user-module@1.2.0

# 显示详细日志
pnce install user-module --verbose
```

#### 安装模式

```bash
# 外部依赖模式（添加到 modules.json）
pnce install user-module --link

# 本地集成模式（添加到 package.json）
pnce install user-module --save

# 临时安装（不加入依赖管理）
pnce install user-module
```

#### 批量安装（推荐）

```bash
# 批量安装（默认并发数3）
pnce install-batch auth-module user-module payment-module

# 自定义并发数（最多5个）
pnce install-batch auth-module user-module --concurrency 5

# 批量安装并添加到依赖
pnce install-batch auth-module user-module --save
```

### 模块发布（需要登录）

> ⚠️ **上传模块到云端需要登录**

#### 准备模块

确保你的模块目录包含以下文件：

```
my-module/
├── package.json          # 必需：模块名称、版本
├── module.config.json    # 必需：模块配置
├── src/                  # 源代码
└── README.md             # 可选：文档
```

#### package.json 示例

```json
{
  "name": "user-module",
  "version": "1.0.0",
  "description": "用户管理模块",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  }
}
```

#### module.config.json 示例

```json
{
  "name": "user-module",
  "description": "用户管理模块",
  "author": "your-username",
  "version": "1.0.0",
  "type": "service",
  "appId": "",
  "teamId": ""
}
```

#### 发布流程

```bash
# 1. 登录（如果未登录）
pnce login

# 2. 在模块目录中执行
cd my-module

# 3. 上传模块
pnce upload

# 4. 发布成功！
```

### 依赖管理

#### modules.json 配置

```json
{
  "modules": {
    "auth-module": "^1.0.0",
    "user-module": "^2.0.0",
    "payment-module": "^1.5.0"
  }
}
```

#### 常用命令

```bash
# 添加依赖
pnce modules add auth-module

# 安装所有依赖
pnce modules install

# 查看依赖列表
pnce modules list

# 移除依赖
pnce modules remove auth-module

# 更新所有依赖
pnce modules update
```

### 端口管理

```bash
# 为模块分配端口
pnce port assign user-module

# 指定端口
pnce port assign user-module -p 3001

# 释放端口
pnce port release user-module

# 查看端口分配
pnce port list
```

### 创建服务

```bash
# 创建服务
pnce init service my-app

# 创建微服务
pnce init microservice my-service

# 进入目录
cd my-app

# 安装依赖
npm install

# 运行
npm run start:dev
```

生成的项目结构：

```
my-app/
├── src/
│   ├── main.ts
│   └── app.module.ts
├── test/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## 📚 命令参考

### 全局选项

```bash
--version, -v    # 显示版本号
--help, -h       # 显示帮助信息
--verbose        # 显示详细日志
```

### 安装命令选项

```bash
pnce install <module> [options]

选项:
  -p, --port <port>        # 指定端口
  --link                   # 添加到 modules.json（外部依赖）
  --save                   # 添加到 package.json（本地集成）
  --parallel               # 启用并行下载（默认）
  --no-parallel            # 禁用并行下载
  --concurrency <num>      # 并发下载数量（默认3）
```

### 批量安装选项

```bash
pnce install-batch <modules...> [options]

选项:
  --concurrency <num>      # 并发下载数量（默认3）
  --link                   # 添加到 modules.json
  --save                   # 添加到 package.json
```

### 上传命令选项

```bash
pnce upload [options]

选项:
  -d, --directory <dir>    # 模块目录路径（默认：.）
```

### 搜索命令选项

```bash
pnce search <keyword> [options]

选项:
  --limit <num>            # 限制结果数量（默认20）
  --author <name>          # 按作者搜索
```

### 登录命令选项

```bash
pnce login [options]

选项:
  -e, --email <email>      # 邮箱地址
  -p, --password <pwd>     # 密码
```

## ⚙️ 配置说明

### 环境变量配置

支持通过环境变量配置 CLI 行为：

```bash
# API 服务器地址
export PNCE_API_SERVER="http://localhost:3000"

# OAuth2 端点
export PNCE_OAUTH_ENDPOINT="http://localhost:5173/authorize"

# OAuth2 回调端口
export PNCE_OAUTH_PORT=3001

# 访问 Token（可选，用于 CI/CD）
export PNCE_TOKEN="your-access-token"

# 日志级别
export PNCE_LOG_LEVEL="debug"  # error, warn, info, debug

# 代理设置
export PNCE_PROXY_URL="http://proxy:8080"

# 禁用缓存
export PNCE_NO_CACHE="true"

# 详细输出
export PNCE_VERBOSE="true"
```

### 用户配置文件

配置文件位置：`~/.pnce/config.json`

```json
{
  "apiServer": "http://localhost:3000",
  "oauthEndpoint": "http://localhost:5173/authorize",
  "oauthPort": 3001,
  "outputDir": "/home/user/projects",
  "useProxy": false,
  "proxyUrl": "",
  "downloadTimeout": 300000,
  "uploadTimeout": 600000,
  "maxConcurrentDownloads": 3,
  "enableCache": true,
  "cacheDir": "/home/user/.pnce/cache",
  "cacheExpireTime": 604800000,
  "logLevel": "info",
  "verbose": false
}
```

### 项目配置文件

配置文件位置：`.pnce/config.json`

```json
{
  "maxConcurrentDownloads": 5,
  "logLevel": "debug",
  "outputDir": "./modules"
}
```

### 配置优先级

1. 环境变量（最高优先级）
2. 项目配置（`.pnce/config.json`）
3. 用户配置（`~/.pnce/config.json`）
4. 默认配置（最低优先级）

### 日志文件

日志文件位置：`~/.pnce/logs/`

```
~/.pnce/logs/
├── error.log      # 错误日志
└── combined.log   # 所有日志
```

## 🔍 高级用法

### 1. 批量安装优化

```bash
# 根据网络情况调整并发数
# 网络快：增加并发数
pnce install-batch m1 m2 m3 m4 m5 --concurrency 5

# 网络慢：减少并发数
pnce install-batch m1 m2 m3 --concurrency 2
```

### 2. 调试模式

```bash
# 启用详细日志
export PNCE_LOG_LEVEL="debug"
pnce install module-name

# 查看详细日志文件
cat ~/.pnce/logs/combined.log

# 只查看错误
cat ~/.pnce/logs/error.log
```

### 3. 清理缓存

```bash
# 清理模块缓存
rm -rf ~/.pnce/cache

# 清理日志
rm -rf ~/.pnce/logs

# 清理所有配置
rm -rf ~/.pnce
```

### 4. 临时下载目录

下载时会在 `~/.module-temp/` 创建临时文件：

```
~/.module-temp/
├── module-name-1.0.0.tgz
├── module-name-2.0.0.tgz
└── ...
```

### 5. 自动重试

CLI 会自动重试失败的请求（最多3次），无需手动处理。

## 📊 性能优化

### 并行下载

批量安装时，CLI 会使用并行下载大幅提升速度：

| 模块数量 | 串行下载 | 并行下载（3） | 提升 |
|----------|----------|--------------|------|
| 3 个     | 6 秒     | 2 秒         | 3x   |
| 9 个     | 18 秒    | 6 秒         | 3x   |
| 15 个    | 30 秒    | 10 秒        | 3x   |

### 缓存机制

已下载的模块会缓存 7 天，避免重复下载。

## ❓ 常见问题

### Q1: 登录失败怎么办？

**A:** 检查以下几点：

1. 网络连接是否正常
2. API 服务器是否可访问
3. 账户密码是否正确
4. 检查错误日志：`cat ~/.pnce/logs/error.log`

### Q2: Token 过期了怎么办？

**A:** Token 过期后，CLI 会自动提示重新登录：

```bash
pnce login
```

### Q3: 如何更改 API 服务器？

**A:** 通过环境变量或配置文件：

```bash
# 环境变量
export PNCE_API_SERVER="http://localhost:3000"

# 或修改配置文件
# ~/.pnce/config.json
```

### Q4: 安装模块失败？

**A:** 可能的原因：

1. 模块不存在：使用 `pnce search` 搜索
2. 网络问题：检查网络连接
3. 权限问题：检查写入权限
4. 查看详细日志：`export PNCE_LOG_LEVEL="debug"`

### Q5: 如何查看已安装的模块？

**A:** 查看项目配置文件：

```bash
# modules.json
cat modules.json

# package.json 的 localModules
cat package.json | grep localModules

# .pnce/modules.json
cat .pnce/modules.json
```

### Q6: 批量安装时遇到错误？

**A:** CLI 会继续安装其他模块，错误信息会显示在最后。可以单独重试失败的模块：

```bash
pnce install failed-module-name
```

### Q7: 如何卸载模块？

**A:** 手动删除模块目录和配置：

```bash
# 删除模块目录
rm -rf src/external_modules/module-name
rm -rf src/local_modules/module-name

# 从配置中移除
# 编辑 modules.json 或 package.json
```

### Q8: 如何更新 CLI？

**A:** 使用 npm 更新：

```bash
npm update -g pnce
```

### Q9: 支持 CI/CD 吗？

**A:** 支持！使用环境变量配置 Token：

```yaml
# GitHub Actions 示例
env:
  PNCE_API_SERVER: "https://api.example.com"
  PNCE_TOKEN: ${{ secrets.PNCE_TOKEN }}

steps:
  - run: pnce install user-module
```

### Q10: 模块安装在哪里？

**A:** 取决于安装模式：

- **外部依赖**（`--link`）：`src/external_modules/`
- **本地集成**（`--save`）：`src/local_modules/`
- **临时安装**：`src/external_modules/`

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## ⚠️ 重要说明

### 登录要求

**需要登录的操作**（仅限云端操作）：
- ✅ 上传模块到云端（`pnce upload`）
- ✅ 删除云端模块
- ✅ 更新云端模块版本

**不需要登录的操作**（本地操作和公开访问）：
- ❌ 安装模块（`pnce install`）
- ❌ 批量安装（`pnce install-batch`）
- ❌ 搜索模块（`pnce search`）
- ❌ 查看模块信息（`pnce info`）
- ❌ 查看模块列表（`pnce list`）
- ❌ 创建服务（`pnce init`）
- ❌ 依赖管理（`pnce modules`）
- ❌ 端口管理（`pnce port`）

**示例**：

```bash
# ❌ 安装模块 - 无需登录，直接使用
pnce install user-module

# ✅ 上传模块 - 需要登录
pnce login           # 先登录
pnce upload          # 再上传
```

## 📄 许可证

[MIT](LICENSE)

## 🔗 相关链接

- [npm 包](https://www.npmjs.com/package/pnce)
- [GitHub 仓库](https://github.com/hi-giacomo/pnce)
- [问题反馈](https://github.com/hi-giacomo/pnce/issues)

---

**让 NestJS 开发更简单、更高效！** 🚀
