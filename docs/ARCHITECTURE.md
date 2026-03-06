# PNCE CLI 架构设计文档

本文档描述了 PNCE CLI 的整体架构、设计原则和核心组件。

## 目录

1. [概述](#概述)
2. [设计原则](#设计原则)
3. [项目结构](#项目结构)
4. [核心模块](#核心模块)
5. [数据流](#数据流)
6. [配置管理](#配置管理)
7. [安全机制](#安全机制)
8. [扩展机制](#扩展机制)

---

## 概述

PNCE CLI 是一个基于 TypeScript 的模块化命令行工具，用于管理和分发代码模块。它提供了一套完整的模块生命周期管理功能，包括上传、下载、安装、搜索等。

### 主要特性

- 🚦 模块化架构，易于扩展
- 🔐 OAuth2 认证机制
- 📦 模块版本管理
- 💾 离线缓存支持
- 🔧 可配置性强
- 📝 完整的日志系统

---

## 设计原则

### 1. 关注点分离

- **Commands**: 处理用户交互和命令行参数
- **Services**: 实现业务逻辑
- **Utils**: 提供通用工具函数
- **Config**: 管理配置

### 2. 依赖注入

服务通过构造函数接收依赖，便于测试和替换。

```typescript
class ApiService {
  constructor(private logger: Logger) {}
}
```

### 3. 单一职责

每个类/模块只负责一个功能领域。

### 4. 错误处理

统一的错误处理机制，友好的用户提示。

### 5. 可扩展性

通过插件和钩子机制支持功能扩展。

---

## 项目结构

```
pnce-cli/
├── src/
│   ├── commands/           # 命令定义
│   │   ├── auth.commands.ts
│   │   ├── module.commands.ts
│   │   ├── install.commands.ts
│   │   ├── init.commands.ts
│   │   └── index.ts
│   ├── services/           # 业务服务
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── module.service.ts
│   │   ├── module-upload.service.ts
│   │   └── module-download.service.ts
│   ├── config/             # 配置管理
│   │   ├── manager.ts
│   │   └── default.config.ts
│   ├── utils/              # 工具函数
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── performance.ts
│   │   ├── version-lock.ts
│   │   ├── version-check.ts
│   │   └── offline-cache.ts
│   ├── templates/          # 模板文件
│   └── index.ts            # 入口文件
├── tests/                  # 测试文件
├── scripts/                # 构建脚本
├── dist/                   # 编译输出
└── docs/                   # 文档
```

---

## 核心模块

### 1. Commands 模块

**职责**: 处理命令行输入，参数解析，调用相应服务。

**示例**:

```typescript
export function registerModuleCommands(
  program: Command,
  uploadService: ModuleUploadService,
  downloadService: ModuleDownloadService
): void {
  program
    .command('upload')
    .option('-d, --directory <dir>', '模块目录')
    .action(async (options) => {
      await uploadService.upload(options.directory);
    });
}
```

### 2. Services 模块

#### ApiService

**职责**: 处理所有 HTTP 请求，封装 axios 实例。

**特性**:
- 统一的错误处理
- 请求重试机制
- 超时控制
- 代理支持

```typescript
class ApiService {
  constructor(private logger: Logger) {
    this.axiosInstance = axios.create({
      baseURL: config.apiServer,
      timeout: 30000,
    });

    // 配置重试
    axiosRetry(this.axiosInstance, { retries: 3 });
  }
}
```

#### AuthService

**职责**: 处理用户认证，Token 管理。

**特性**:
- OAuth2 流程
- Token 刷新
- 登录状态检查

#### ModuleService

**职责**: 模块信息查询，模块列表管理。

#### ModuleUploadService

**职责**: 模块上传，打包，压缩。

#### ModuleDownloadService

**职责**: 模块下载，解压，安装。

### 3. Config 模块

#### ConfigManager

**职责**: 管理配置加载、保存、合并。

**配置优先级**:
```
环境变量 > 项目配置 > 用户配置 > 默认配置
```

**特性**:
- 多层配置合并
- 环境变量支持
- 配置档案切换
- 配置验证

### 4. Utils 模块

#### Logger

**职责**: 统一日志输出。

**日志级别**:
- DEBUG: 调试信息
- INFO: 一般信息
- WARN: 警告信息
- ERROR: 错误信息

**特性**:
- 文件日志
- 控制台输出
- 日志分级
- 日志轮转

#### ErrorHandler

**职责**: 统一错误处理。

**特性**:
- 错误代码
- 友好提示
- 错误日志
- 堆栈追踪

#### PerformanceMonitor

**职责**: 性能监控，指标收集。

**特性**:
- 耗时统计
- 慢操作检测
- 性能报告

#### VersionLockManager

**职责**: 模块版本锁定。

**特性**:
- 单个版本锁定
- 批量版本锁定
- 版本依赖管理

#### VersionChecker

**职责**: 版本检查和更新通知。

**特性**:
- 检查最新版本
- 版本对比
- 变更日志

#### OfflineCacheManager

**职责**: 离线缓存管理。

**特性**:
- 缓存存储
- 缓存过期
- 缓存清理
- 缓存统计

---

## 数据流

### 安装模块流程

```
用户命令
  → Commands 解析参数
  → ModuleDownloadService.download()
  → ApiService.getModuleInfo()
  → 检查缓存
  → 下载模块文件
  → 解压到目标目录
  → 更新版本锁定
  → 记录性能指标
  → 输出结果
```

### 上传模块流程

```
用户命令
  → Commands 解析参数
  → 读取 module.config.json
  → ModuleUploadService.upload()
  → 打包模块文件
  → ApiService.uploadModule()
  → 服务器验证
  → 保存模块信息
  → 记录性能指标
  → 输出结果
```

### 登录流程

```
用户命令
  → AuthService.login()
  → 启动本地 OAuth 服务器
  → 等待回调
  → 接收 authorization_code
  → ApiService.getToken()
  → 保存 Token 到配置
  → 输出成功信息
```

---

## 配置管理

### 配置结构

```typescript
interface PnceConfig {
  // API 配置
  apiServer: string;
  oauthEndpoint: string;
  oauthPort: number;

  // 认证
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;

  // 输出
  outputDir: string;

  // 网络配置
  useProxy: boolean;
  proxyUrl?: string;
  downloadTimeout: number;
  uploadTimeout: number;
  maxConcurrentDownloads: number;

  // 缓存
  enableCache: boolean;
  cacheDir: string;
  cacheExpireTime: number;

  // 日志
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  verbose: boolean;
}
```

### 配置文件位置

- **用户配置**: `~/.pnce/config.json`
- **项目配置**: `./.pnce/config.json`
- **配置档案**: `~/.pnce/profiles/*.json`

### 环境变量

```bash
PNCE_API_SERVER         # API 服务器地址
PNCE_OAUTH_ENDPOINT     # OAuth 授权端点
PNCE_OAUTH_PORT         # OAuth 回调端口
PNCE_TOKEN              # 认证 Token
PNCE_OUTPUT_DIR         # 输出目录
PNCE_PROXY_URL          # 代理地址
PNCE_LOG_LEVEL          # 日志级别
PNCE_VERBOSE            # 详细输出
PNCE_NO_CACHE           # 禁用缓存
```

---

## 安全机制

### 1. 认证机制

- **OAuth2**: 使用标准的 OAuth2 授权流程
- **Token 管理**: Token 加密存储在本地配置文件
- **Token 刷新**: 自动刷新过期的 Token
- **Token 过期**: 5 分钟过期保护

### 2. 数据安全

- **HTTPS**: 所有通信使用 HTTPS 加密
- **代理支持**: 支持安全代理配置
- **敏感信息过滤**: 日志中不输出 Token 等敏感信息

### 3. 输入验证

- **参数验证**: 所有用户输入都经过验证
- **路径验证**: 防止目录遍历攻击
- **命令注入**: 防止命令注入攻击

---

## 扩展机制

### 1. 插件系统（计划中）

```typescript
interface Plugin {
  name: string;
  version: string;
  install(ctx: PluginContext): void;
  uninstall(): void;
}

class PluginManager {
  install(plugin: Plugin): void;
  uninstall(name: string): void;
  list(): Plugin[];
}
```

### 2. 钩子系统（计划中）

```typescript
interface Hooks {
  beforeUpload?: (moduleInfo: ModuleInfo) => Promise<void>;
  afterUpload?: (moduleInfo: ModuleInfo) => Promise<void>;
  beforeDownload?: (moduleName: string) => Promise<void>;
  afterDownload?: (moduleName: string, path: string) => Promise<void>;
}
```

### 3. 自定义命令（计划中）

```typescript
program
  .registerCommand('custom', CustomCommand)
  .addOption('--custom-opt');
```

---

## 性能优化

### 1. 缓存策略

- **模块缓存**: 已下载的模块本地缓存
- **元数据缓存**: 模块列表等元数据缓存
- **缓存过期**: 7 天默认过期时间
- **缓存清理**: 定期清理过期缓存

### 2. 并发控制

- **并发下载**: 支持并发下载多个模块
- **并发限制**: 默认最多 3 个并发
- **可配置**: 通过 `maxConcurrentDownloads` 配置

### 3. 重试机制

- **网络重试**: 失败请求自动重试
- **指数退避**: 重试间隔指数增长
- **重试次数**: 默认最多 3 次

---

## 错误处理

### 错误代码

```typescript
enum ErrorCode {
  AUTH_ERROR = 'E001',
  NETWORK_ERROR = 'E002',
  CONFIG_ERROR = 'E003',
  MODULE_ERROR = 'E004',
  FILE_ERROR = 'E005',
  VALIDATION_ERROR = 'E006',
  UNKNOWN_ERROR = 'E999',
}
```

### 错误处理流程

```
异常发生
  → ErrorHandler.handle()
  → 记录错误日志
  → 生成友好提示
  → 显示解决方案
  → 退出程序或继续执行
```

---

## 测试策略

### 1. 单元测试

- **Vitest**: 使用 Vitest 框架
- **覆盖率**: 目标 > 80%
- **Mock**: 使用 mock 隔离外部依赖

### 2. 集成测试

- **API 测试**: 测试真实的 API 调用
- **端到端测试**: 测试完整的工作流程

### 3. CI/CD

- **自动测试**: 每次提交自动运行测试
- **代码检查**: ESLint + Prettier
- **安全扫描**: npm audit

---

## 未来规划

### 短期

- [ ] 完善插件系统
- [ ] 添加钩子系统
- [ ] 支持自定义命令
- [ ] 增强错误提示

### 中期

- [ ] 实现模块依赖管理
- [ ] 添加模块签名验证
- [ ] 支持模块评分系统
- [ ] 实现模块市场

### 长期

- [ ] 多语言支持
- [ ] 图形化界面
- [ ] Web 版本
- [ ] 云端构建

---

## 相关文档

- [API 文档](./API_DOCUMENTATION.md)
- [快速开始](./QUICKSTART.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全文档](./SECURITY.md)
