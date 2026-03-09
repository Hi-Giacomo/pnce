# PNCE CLI Quick Start Guide

Welcome to PNCE CLI! This guide will help you get started quickly with PNCE CLI.

## Installation

### Install using npm

```bash
npm install -g pnce
```

### Install using yarn

```bash
yarn global add pnce
```

### Verify Installation

```bash
pnce --version
```

## Basic Usage

### 1. Login Authentication

Before first use, you need to login to the PNCE registry:

```bash
pnce login
```

The browser will automatically open the authorization page. Complete the login to proceed.

### 2. View Help

View all available commands:

```bash
pnce --help
```

View help for a specific command:

```bash
pnce upload --help
```

### 3. Upload Module

Upload the module in the current directory to the registry:

```bash
pnce upload
```

Specify a module directory:

```bash
pnce upload -d /path/to/module
```

### 4. Install Module

Install a module from the registry:

```bash
pnce install <module-name>
```

Install a specific version:

```bash
pnce install <module-name>@1.0.0
```

Install to a specific directory:

```bash
pnce install <module-name> -d ./modules
```

### 5. Manage Modules

List installed modules:

```bash
pnce list
```

View module details:

```bash
pnce info <module-name>
```

Search for modules:

```bash
pnce search <keyword>
```

### 6. Logout

```bash
pnce logout
```

## Configuration

### Using Interactive Configuration Wizard

```bash
pnce init
```

The wizard will guide you through configuring:
- Server URL
- Log level
- Proxy settings

### Manual Configuration

Configuration file locations:
- User config: `~/.pnce/config.json`
- Project config: `./.pnce/config.json`

Example configuration:

```json
{
  "apiServer": "https://pnce.example.com",
  "oauthEndpoint": "https://pnce.example.com/authorize",
  "oauthPort": 3001,
  "outputDir": "./modules",
  "logLevel": "info",
  "useProxy": false,
  "proxyUrl": "http://127.0.0.1:7890",
  "enableCache": true
}
```

## Auto-completion

### Bash

```bash
echo "eval \"\$(pnce completion)\"" >> ~/.bashrc
source ~/.bashrc
```

### Zsh

```bash
echo "eval \"\$(pnce completion)\"" >> ~/.zshrc
source ~/.zshrc
```

### Fish

```bash
pnce completion > ~/.config/fish/completions/pnce.fish
```

## Common Use Cases

### Use Case 1: Developing a New Module

1. Create module directory and write code
2. Create `module.config.json` configuration file
3. Run `pnce upload` to upload the module
4. Use `pnce install <module-name>` to test installation

### Use Case 2: Sharing Modules with Team

1. Login to registry: `pnce login`
2. Install team modules: `pnce install team-module`
3. Team members can install and use the same way

### Use Case 3: Multi-environment Configuration

1. Create configuration profile: `pnce profile save prod`
2. Switch to production config: `pnce profile use prod`
3. List all profiles: `pnce profile list`

## Common Questions

### Q: What to do if login fails?

A: Check network connection and ensure server URL is correct. You can use `pnce config` to view current configuration.

### Q: How to update PNCE CLI?

A: Use the following commands to update:

```bash
npm update -g pnce
# or
yarn global upgrade pnce
```

### Q: What to do if module installation fails?

A: Check:
1. If logged in: `pnce login`
2. If network connection is normal
3. If module name is correct
4. View detailed error info: `pnce install <module> --verbose`

## Next Steps

- Read full [API Documentation](./API_DOCUMENTATION.md)
- View [FAQ](./FAQ.md)
- Learn about [Troubleshooting Guide](./TROUBLESHOOTING.md)
- View [Contributing Guide](./CONTRIBUTING.md)

## Get Help

- GitHub Issues: [https://github.com/hi-giacomo/pnce/issues](https://github.com/hi-giacomo/pnce/issues)
- Documentation: [https://github.com/hi-giacomo/pnce](https://github.com/hi-giacomo/pnce)

---

**Happy using!** 🚀
