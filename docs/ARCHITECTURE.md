# PNCE CLI Architecture Design Document

This document describes the overall architecture, design principles, and core components of PNCE CLI.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Project Structure](#project-structure)
4. [Core Modules](#core-modules)
5. [Data Flow](#data-flow)
6. [Configuration Management](#configuration-management)
7. [Security Mechanisms](#security-mechanisms)
8. [Extension Mechanisms](#extension-mechanisms)

---

## Overview

PNCE CLI is a TypeScript-based modular command line tool for managing and distributing code modules. It provides a complete set of module lifecycle management features, including upload, download, installation, search, etc.

### Key Features

- 🚦 Modular architecture, easy to extend
- 🔐 OAuth2 authentication mechanism
- 📦 Module version management
- 💾 Offline cache support
- 🔧 Highly configurable
- 📝 Complete logging system

---

## Design Principles

### 1. Separation of Concerns

- **Commands**: Handle user interaction and command line arguments
- **Services**: Implement business logic
- **Utils**: Provide common utility functions
- **Config**: Manage configuration

### 2. Dependency Injection

Services receive dependencies through constructors, making them easy to test and replace.

```typescript
class ApiService {
  constructor(private logger: Logger) {}
}
```

### 3. Single Responsibility

Each class/module is responsible for only one functional area.

### 4. Error Handling

Unified error handling mechanism with friendly user prompts.

### 5. Extensibility

Support feature extensions through plugins and hooks.

---

## Project Structure

```
pnce-cli/
├── src/
│   ├── commands/           # Command definitions
│   │   ├── auth.commands.ts
│   │   ├── module.commands.ts
│   │   ├── install.commands.ts
│   │   ├── init.commands.ts
│   │   └── index.ts
│   ├── services/           # Business services
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── module.service.ts
│   │   ├── module-upload.service.ts
│   │   └── module-download.service.ts
│   ├── config/             # Configuration management
│   │   ├── manager.ts
│   │   └── default.config.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── performance.ts
│   │   ├── version-lock.ts
│   │   ├── version-check.ts
│   │   └── offline-cache.ts
│   ├── templates/          # Template files
│   └── index.ts            # Entry file
├── tests/                  # Test files
├── scripts/                # Build scripts
├── dist/                   # Build output
└── docs/                   # Documentation
```

---

## Core Modules

### 1. Commands Module

**Responsibility**: Handle command line input, parse arguments, call corresponding services.

**Example**:

```typescript
export function registerModuleCommands(
  program: Command,
  uploadService: ModuleUploadService,
  downloadService: ModuleDownloadService
): void {
  program
    .command('upload')
    .option('-d, --directory <dir>', 'Module directory')
    .action(async (options) => {
      await uploadService.upload(options.directory);
    });
}
```

### 2. Services Module

#### ApiService

**Responsibility**: Handle all HTTP requests, wrap axios instance.

**Features**:
- Unified error handling
- Request retry mechanism
- Timeout control
- Proxy support

```typescript
class ApiService {
  constructor(private logger: Logger) {
    this.axiosInstance = axios.create({
      baseURL: config.apiServer,
      timeout: 30000,
    });

    // Configure retry
    axiosRetry(this.axiosInstance, { retries: 3 });
  }
}
```

#### AuthService

**Responsibility**: Handle user authentication, token management.

**Features**:
- OAuth2 flow
- Token refresh
- Login status check

#### ModuleService

**Responsibility**: Module information query, module list management.

#### ModuleUploadService

**Responsibility**: Module upload, packaging, compression.

#### ModuleDownloadService

**Responsibility**: Module download, extraction, installation.

### 3. Config Module

#### ConfigManager

**Responsibility**: Manage configuration loading, saving, merging.

**Configuration Priority**:
```
Environment Variables > Project Config > User Config > Default Config
```

**Features**:
- Multi-layer configuration merging
- Environment variable support
- Configuration profile switching
- Configuration validation

### 4. Utils Module

#### Logger

**Responsibility**: Unified logging output.

**Log Levels**:
- DEBUG: Debug information
- INFO: General information
- WARN: Warning information
- ERROR: Error information

**Features**:
- File logging
- Console output
- Log level separation
- Log rotation

#### ErrorHandler

**Responsibility**: Unified error handling.

**Features**:
- Error codes
- Friendly prompts
- Error logging
- Stack traces

#### PerformanceMonitor

**Responsibility**: Performance monitoring, metrics collection.

**Features**:
- Duration statistics
- Slow operation detection
- Performance reports

#### VersionLockManager

**Responsibility**: Module version locking.

**Features**:
- Single version locking
- Batch version locking
- Version dependency management

#### VersionChecker

**Responsibility**: Version checking and update notifications.

**Features**:
- Check latest version
- Version comparison
- Changelog

#### OfflineCacheManager

**Responsibility**: Offline cache management.

**Features**:
- Cache storage
- Cache expiration
- Cache cleanup
- Cache statistics

---

## Data Flow

### Install Module Flow

```
User command
  → Commands parse arguments
  → ModuleDownloadService.download()
  → ApiService.getModuleInfo()
  → Check cache
  → Download module files
  → Extract to target directory
  → Update version lock
  → Record performance metrics
  → Output result
```

### Upload Module Flow

```
User command
  → Commands parse arguments
  → Read module.config.json
  → ModuleUploadService.upload()
  → Package module files
  → ApiService.uploadModule()
  → Server validation
  → Save module information
  → Record performance metrics
  → Output result
```

### Login Flow

```
User command
  → AuthService.login()
  → Start local OAuth server
  → Wait for callback
  → Receive authorization_code
  → ApiService.getToken()
  → Save token to configuration
  → Output success message
```

---

## Configuration Management

### Configuration Structure

```typescript
interface PnceConfig {
  // API configuration
  apiServer: string;
  oauthEndpoint: string;
  oauthPort: number;

  // Authentication
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;

  // Output
  outputDir: string;

  // Network configuration
  useProxy: boolean;
  proxyUrl?: string;
  downloadTimeout: number;
  uploadTimeout: number;
  maxConcurrentDownloads: number;

  // Cache
  enableCache: boolean;
  cacheDir: string;
  cacheExpireTime: number;

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  verbose: boolean;
}
```

### Configuration File Locations

- **User config**: `~/.pnce/config.json`
- **Project config**: `./.pnce/config.json`
- **Configuration profiles**: `~/.pnce/profiles/*.json`

### Environment Variables

```bash
PNCE_API_SERVER         # API server address
PNCE_OAUTH_ENDPOINT     # OAuth authorization endpoint
PNCE_OAUTH_PORT         # OAuth callback port
PNCE_TOKEN              # Authentication token
PNCE_OUTPUT_DIR         # Output directory
PNCE_PROXY_URL          # Proxy address
PNCE_LOG_LEVEL          # Log level
PNCE_VERBOSE            # Verbose output
PNCE_NO_CACHE           # Disable cache
```

---

## Security Mechanisms

### 1. Authentication

- **OAuth2**: Use standard OAuth2 authorization flow
- **Token Management**: Tokens are encrypted and stored in local configuration file
- **Token Refresh**: Automatically refresh expired tokens
- **Token Expiration**: 5-minute expiration protection

### 2. Data Security

- **HTTPS**: All communication uses HTTPS encryption
- **Proxy Support**: Support secure proxy configuration
- **Sensitive Data Filtering**: Do not output tokens and other sensitive information in logs

### 3. Input Validation

- **Parameter Validation**: All user inputs are validated
- **Path Validation**: Prevent directory traversal attacks
- **Command Injection**: Prevent command injection attacks

---

## Extension Mechanisms

### 1. Plugin System (Planned)

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

### 2. Hooks System (Planned)

```typescript
interface Hooks {
  beforeUpload?: (moduleInfo: ModuleInfo) => Promise<void>;
  afterUpload?: (moduleInfo: ModuleInfo) => Promise<void>;
  beforeDownload?: (moduleName: string) => Promise<void>;
  afterDownload?: (moduleName: string, path: string) => Promise<void>;
}
```

### 3. Custom Commands (Planned)

```typescript
program
  .registerCommand('custom', CustomCommand)
  .addOption('--custom-opt');
```

---

## Performance Optimization

### 1. Cache Strategy

- **Module Cache**: Locally cache downloaded modules
- **Metadata Cache**: Cache metadata like module lists
- **Cache Expiration**: 7-day default expiration time
- **Cache Cleanup**: Periodically clean expired cache

### 2. Concurrency Control

- **Parallel Downloads**: Support concurrent download of multiple modules
- **Concurrency Limit**: Maximum 3 concurrent by default
- **Configurable**: Configure via `maxConcurrentDownloads`

### 3. Retry Mechanism

- **Network Retry**: Automatically retry failed requests
- **Exponential Backoff**: Retry intervals grow exponentially
- **Retry Count**: Maximum 3 retries by default

---

## Error Handling

### Error Codes

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

### Error Handling Flow

```
Exception occurs
  → ErrorHandler.handle()
  → Log error
  → Generate friendly prompt
  → Show solution
  → Exit program or continue execution
```

---

## Testing Strategy

### 1. Unit Tests

- **Vitest**: Use Vitest framework
- **Coverage**: Target > 80%
- **Mock**: Use mocks to isolate external dependencies

### 2. Integration Tests

- **API Tests**: Test real API calls
- **End-to-End Tests**: Test complete workflows

### 3. CI/CD

- **Auto Testing**: Automatically run tests on every commit
- **Code Checking**: ESLint + Prettier
- **Security Scanning**: npm audit

---

## Future Plans

### Short-term

- [ ] Improve plugin system
- [ ] Add hooks system
- [ ] Support custom commands
- [ ] Enhance error prompts

### Medium-term

- [ ] Implement module dependency management
- [ ] Add module signature verification
- [ ] Support module rating system
- [ ] Implement module marketplace

### Long-term

- [ ] Multi-language support
- [ ] Graphical interface
- [ ] Web version
- [ ] Cloud build

---

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Quick Start](./QUICKSTART.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Documentation](./SECURITY.md)
