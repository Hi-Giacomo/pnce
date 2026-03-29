# Pnce CLI

<div align="center">

**Pnce CLI Tool** - Lightweight CLI for NestJS microservices development

[![npm version](https://img.shields.io/npm/v/pnce.svg)](https://www.npmjs.com/package/pnce)
[![downloads](https://img.shields.io/npm/dm/pnce.svg)](https://www.npmjs.com/package/pnce)
[![license](https://img.shields.io/npm/l/pnce.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/pnce.svg)](https://nodejs.org/)

A lightweight command-line tool designed for NestJS microservices development, helping developers quickly create, manage, and install modules.

[English](./README.md)

</div>

## ✨ Core Features

- 🚀 **Quick Setup** - Generate service/microservice scaffolding instantly
- 📦 **Module Management** - Simple module publishing and installation
- 🔗 **Dependency Management** - Automatic handling of module dependencies
- 📥 **Fast Downloads** - Efficient module download and installation
- 🔐 **Secure Authentication** - OAuth2 support for cloud operations
- ⚙️ **Flexible Configuration** - Environment variables and configuration files
- 🌍 **i18n Support** - Multi-language support (English/Chinese)

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [FAQ](#faq)

## 📚 Documentation

- [Quick Start](docs/QUICKSTART.md) - Quick start guide
- [API Documentation](docs/API_DOCUMENTATION.md) - API reference
- [Architecture](docs/ARCHITECTURE.md) - Architecture overview
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Troubleshooting guide
- [Changelog](docs/CHANGELOG.md) - Version history

## 🚀 Installation

### Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0
- OS: macOS, Linux, Windows

### Global Installation

```bash
npm install -g pnce
```

### Verify Installation

```bash
pnce --version
pnce --help
```

### Standalone Binary

Pre-built binaries are available in the [releases](https://github.com/hi-giacomo/pnce/releases) page for macOS, Linux, and Windows.

## 🎯 Quick Start

### 1. Login (Only required when uploading modules)

> ⚠️ **Note**: Login is **only required when uploading modules to cloud**, **deleting cloud modules**, or **updating cloud module versions**.
>
> Operations like installing modules, searching modules, and viewing module info **do not require login**.

```bash
# OAuth2 browser login
pnce login

# Email/password login
pnce login -e your@email.com -p your-password

# Register new account
pnce register

# View current login status
pnce me

# Logout
pnce logout
```

### 2. Create Service (No login required)

```bash
# Create a service
pnce init service my-app

# Create a microservice
pnce init microservice my-service
```

### 3. Configure Registry (Optional)

```bash
# Set module registry URL
pnce registry set http://your-registry.com

# View current registry
pnce registry get

# Test registry connection
pnce registry ping

# Reset to default registry
pnce registry reset
```

### 4. Install Modules (No login required)

```bash
# Install a single module
pnce install user-module

# Install specific version
pnce install user-module@1.0.0

# Install as external dependency (adds to modules.json)
pnce install user-module --link

# Install as local integration (adds to package.json)
pnce install user-module --save

# Batch install (parallel, no login required)
pnce install-batch auth-module user-module payment-module
```

### 5. Publish Module (Login required)

```bash
# Login first
pnce login

# Upload from module directory
pnce upload

# Or upload from specified directory
pnce upload -d ./modules/my-module
```

## 📖 Command Reference

### Global Options

```bash
--version, -v    # Display version
--help, -h       # Display help information
```

### Module Commands

| Command | Description | Login Required |
|---------|-------------|----------------|
| `pnce install <module>` | Install a single module | ❌ No |
| `pnce install-batch <modules...>` | Parallel install multiple modules | ❌ No |
| `pnce upload` | Publish module to registry | ✅ Yes |
| `pnce fix-imports <module>` | Fix import paths | ❌ No |

### Install Command Options

```bash
pnce install <module> [options]

Options:
  -p, --port <port>        # Specify port
  --link                   # Add to modules.json (external dependency)
  --save                   # Add to package.json (local integration)
  --parallel               # Enable parallel download (default)
  --no-parallel            # Disable parallel download
  --concurrency <num>      # Concurrent download count (default 3)
```

### Batch Install Options

```bash
pnce install-batch <modules...> [options]

Options:
  --concurrency <num>      # Concurrent download count (default 3)
  --link                   # Add to modules.json
  --save                   # Add to package.json
```

### Module Dependency Management

| Command | Description |
|---------|-------------|
| `pnce modules-init` | Initialize modules.json configuration |
| `pnce modules-add <module> [version]` | Add module to modules.json |
| `pnce modules-remove <module>` | Remove module from modules.json |
| `pnce modules-install` | Install all modules from modules.json |
| `pnce modules-list` | List all module dependencies |
| `pnce modules-prune` | Remove unused modules |

### Project Initialization

| Command | Description |
|---------|-------------|
| `pnce init [name]` | Initialize service or microservice project |
| `pnce init service <name>` | Create a service project |
| `pnce init microservice <name>` | Create a microservice project |

### Authentication Commands

| Command | Description |
|---------|-------------|
| `pnce login` | Login to registry (OAuth2 or email/password) |
| `pnce register` | Register new account |
| `pnce me` | View current user info |
| `pnce logout` | Logout from account |

### Registry Commands

| Command | Description |
|---------|-------------|
| `pnce registry set <url>` | Set module registry URL |
| `pnce registry get` | View current registry configuration |
| `pnce registry ping` | Test registry connection |
| `pnce registry reset` | Reset to default registry |

### Port Management

| Command | Description |
|---------|-------------|
| `pnce ports` | View port allocation |
| `pnce ports -c, --clear` | Clear port cache |
| `pnce ports -s, --show` | Show port allocation information |

### Language Settings

| Command | Description |
|---------|-------------|
| `pnce lang` | View or set language |
| `pnce lang set <lang>` | Set interface language (zh/en) |
| `pnce lang list` | List supported languages |

### Command Aliases

| Command | Description |
|---------|-------------|
| `pnce alias` | Manage command aliases |
| `pnce alias add <alias> <command>` | Add command alias |
| `pnce alias remove <alias>` | Remove alias |
| `pnce alias list` | List all aliases |
| `pnce alias clear` | Clear all aliases |

### Configuration Profiles

| Command | Description |
|---------|-------------|
| `pnce profile` | Manage configuration profiles |
| `pnce profile save <name>` | Save current config as profile |
| `pnce profile load <name>` | Load profile (without switching) |
| `pnce profile use <name>` | Switch to profile |
| `pnce profile list` | List all profiles |
| `pnce profile delete <name>` | Delete profile |
| `pnce profile rename <old> <new>` | Rename profile |

### Analytics (Optional)

| Command | Description |
|---------|-------------|
| `pnce analytics` | Manage usage analytics |
| `pnce analytics enable [endpoint]` | Enable analytics |
| `pnce analytics disable` | Disable analytics |
| `pnce analytics clear` | Clear local events |
| `pnce analytics status` | Show analytics status |

### Plugin System

| Command | Description |
|---------|-------------|
| `pnce plugin` | Manage plugin system |
| `pnce plugin list` | List all installed plugins |
| `pnce plugin info` | Show plugin system information |

### Configuration Validation

| Command | Description |
|---------|-------------|
| `pnce config validate` | Validate configuration file with suggestions |
| `pnce config validate --fix` | Auto-fix configuration issues |
| `pnce config check` | Quick configuration check |

## ⚙️ Configuration Guide

### Environment Variable Configuration

Support configuring CLI behavior through environment variables:

```bash
# API server address
export PNCE_API_SERVER="http://localhost:3000"

# OAuth2 endpoint
export PNCE_OAUTH_ENDPOINT="http://localhost:5173/authorize"

# OAuth2 callback port
export PNCE_OAUTH_PORT=3001

# Access token (optional, for CI/CD)
export PNCE_TOKEN="your-access-token"

# Log level
export PNCE_LOG_LEVEL="debug"  # error, warn, info, debug

# Proxy settings
export PNCE_PROXY_URL="http://proxy:8080"

# Disable cache
export PNCE_NO_CACHE="true"

# Verbose output
export PNCE_VERBOSE="true"
```

### User Configuration File

Configuration file location: `~/.pnce/config.json`

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
  "verbose": false,
  "language": "en"
}
```

### Project Configuration File

Configuration file location: `.pnce/config.json`

```json
{
  "maxConcurrentDownloads": 5,
  "logLevel": "debug",
  "outputDir": "./modules"
}
```

### Configuration Priority

1. Environment variables (highest priority)
2. Project config (`.pnce/config.json`)
3. User config (`~/.pnce/config.json`)
4. Default config (lowest priority)

### Log Files

Log file location: `~/.pnce/logs/`

```
~/.pnce/logs/
├── error.log      # Error logs
└── combined.log   # All logs
```

## 🔍 Advanced Features

### 1. Module Installation Modes

```bash
# External dependency mode (adds to modules.json)
pnce install user-module --link
# Installs to: src/external_modules/
# Added to: modules.json

# Local integration mode (adds to package.json)
pnce install user-module --save
# Installs to: src/local_modules/
# Added to: package.json -> localModules

# Temporary install (not tracked)
pnce install user-module
# Installs to: src/external_modules/
# No configuration changes
```

### 2. Dependency Management with modules.json

```bash
# Initialize modules.json
pnce modules-init

# Add dependency
pnce modules-add user-module ^1.0.0

# Add dependency without installing
pnce modules-add user-module --no-install

# Install all dependencies
pnce modules-install

# Force reinstall all modules
pnce modules-install --force

# List dependencies
pnce modules-list

# Remove dependency
pnce modules-remove user-module

# Clean up unused modules
pnce modules-prune
```

### 3. Profile Management

```bash
# Save current configuration as a profile
pnce profile save production

# Switch to a profile
pnce profile use production

# List all profiles
pnce profile list

# Rename a profile
pnce profile rename production prod

# Delete a profile
pnce profile delete production
```

### 4. Command Aliases

```bash
# Add alias for frequently used commands
pnce alias add i install
pnce alias add ib install-batch
pnce alias add up upload

# Now you can use shorter commands
pnce i user-module
pnce ib auth user payment
pnce up

# List all aliases
pnce alias list

# Remove an alias
pnce alias remove i
```

### 5. Batch Installation Optimization

```bash
# Adjust concurrency based on network conditions
# Fast network: increase concurrency
pnce install-batch m1 m2 m3 m4 m5 --concurrency 5

# Slow network: reduce concurrency
pnce install-batch m1 m2 m3 --concurrency 2
```

### 6. Debug Mode

```bash
# Enable detailed logs
export PNCE_LOG_LEVEL="debug"
pnce install module-name

# View detailed log files
cat ~/.pnce/logs/combined.log

# View only errors
cat ~/.pnce/logs/error.log
```

### 7. Clear Cache

```bash
# Clear module cache
rm -rf ~/.pnce/cache

# Clear logs
rm -rf ~/.pnce/logs

# Clear all configurations
rm -rf ~/.pnce

# Clear port cache
pnce ports --clear
```

## 📊 Performance Optimization

### Parallel Downloads

Batch installation uses parallel downloads for significant speed improvements:

| Module Count | Serial Download | Parallel (3) | Improvement |
|--------------|------------------|---------------|-------------|
| 3 modules    | 6 seconds        | 2 seconds     | 3x          |
| 9 modules    | 18 seconds       | 6 seconds     | 3x          |
| 15 modules   | 30 seconds       | 10 seconds    | 3x          |

### Cache Mechanism

Downloaded modules are cached for 7 days to avoid repeated downloads.

## 🌐 i18n Support

Pnce CLI supports multiple languages:

```bash
# View current language
pnce lang

# Set language to English
pnce lang set en

# Set language to Chinese
pnce lang set zh

# List supported languages
pnce lang list
```

## 🔌 Plugin System

Pnce CLI features an extensible plugin system:

```bash
# List installed plugins
pnce plugin list

# View plugin system info
pnce plugin info
```

Currently, the plugin system supports:
- Command extension
- Hook system
- Config validation
- Event tracking

## ❓ FAQ

### Q1: What should I do if login fails?

**A:** Check the following:

1. Network connection is normal
2. API server is accessible (`pnce registry ping`)
3. Account credentials are correct
4. Check error logs: `cat ~/.pnce/logs/error.log`

### Q2: What if the token expires?

**A:** After token expiration, CLI will prompt you to re-login:

```bash
pnce login
```

### Q3: How to change the API server?

**A:** Through registry commands:

```bash
pnce registry set http://your-server.com

# Or reset to default
pnce registry reset
```

### Q4: Module installation failed?

**A:** Possible reasons:

1. Module doesn't exist: verify with registry
2. Network issues: check connection with `pnce registry ping`
3. Permission issues: check write permissions
4. View detailed logs: `export PNCE_LOG_LEVEL="debug"`

### Q5: How to view installed modules?

**A:** View project configuration files:

```bash
# modules.json
cat modules.json

# package.json's localModules
cat package.json | grep localModules

# List dependencies
pnce modules-list
```

### Q6: Error during batch installation?

**A:** CLI will continue installing other modules, error messages will be shown at the end. You can retry failed modules individually:

```bash
pnce install failed-module-name
```

### Q7: How to uninstall a module?

**A:** Manually delete module directory and configuration:

```bash
# Remove from dependencies
pnce modules-remove user-module

# Clean up unused modules
pnce modules-prune

# Or manually delete
rm -rf src/external_modules/user-module
rm -rf src/local_modules/user-module
```

### Q8: How to update CLI?

**A:** Use npm to update:

```bash
npm update -g pnce
```

### Q9: Does it support CI/CD?

**A:** Yes! Use environment variable to configure token:

```yaml
# GitHub Actions example
env:
  PNCE_API_SERVER: "https://api.example.com"
  PNCE_TOKEN: ${{ secrets.PNCE_TOKEN }}

steps:
  - run: pnce install user-module
```

### Q10: Where are modules installed?

**A:** Depends on installation mode:

- **External dependency** (`--link`): `src/external_modules/`
- **Local integration** (`--save`): `src/local_modules/`
- **Temporary install**: `src/external_modules/`

## ⚠️ Important Notes

### Login Requirements

**Operations requiring login** (cloud operations only):
- ✅ Upload module to cloud (`pnce upload`)
- ✅ Delete cloud module
- ✅ Update cloud module version

**Operations not requiring login** (local operations and public access):
- ❌ Install module (`pnce install`)
- ❌ Batch install (`pnce install-batch`)
- ❌ Search module (via registry)
- ❌ View module info (via registry)
- ❌ Create service (`pnce init`)
- ❌ Dependency management (`pnce modules`)
- ❌ Port management (`pnce ports`)
- ❌ Registry management (`pnce registry`)

**Example**:

```bash
# ❌ Install module - No login required, use directly
pnce install user-module

# ✅ Upload module - Login required
pnce login           # Login first
pnce upload          # Then upload
```

## 🤝 Contributing

Contributions of code, issue reports, or suggestions are welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## 📄 License

[MulanPSL2](LICENSE)

## 🔗 Related Links

- [npm package](https://www.npmjs.com/package/pnce)
- [GitHub repository](https://github.com/hi-giacomo/pnce)
- [Issue tracker](https://github.com/hi-giacomo/pnce/issues)

---

**Make NestJS development simpler and more efficient!** 🚀
