# Pnce CLI

Pnce CLI Tool - NestJS Modular Rapid Development Command-Line Tool

A modular development tool designed specifically for NestJS, helping developers quickly create, manage, and publish NestJS modules.

## 🚀 Installation

### Global Installation

```bash
npm install -g pnce
```

After installation, you can use the `pnce` command in any directory.

## 📖 Quick Start

### Check Installation

```bash
pnce --version
pnce --help
```

### Authentication

```bash
# Login to your account
pnce login

# View current user
pnce whoami

# Logout from your account
pnce logout
```

### Create Project

```bash
# Create a service project
pnce init my-service

# Create a microservice project
pnce init my-microservice --type microservice

# Create project in a specific directory
pnce init my-service --directory /path/to/project
```

### Module Management

```bash
# Publish module
pnce publish
```

### Dependency Management

```bash
# Install module
pnce install <module-name>

# Add module to dependencies
pnce add <module-name>

# Remove module
pnce remove <module-name>

# Update all modules
pnce update
```

### Port Management

```bash
# List all port configurations
pnce port list

# Check for port conflicts
pnce port check
```

## 📦 Available Commands

| Command      | Description                   | Example                       |
| ------------ | ----------------------------- | ----------------------------- |
| `login`      | Login to account              | `pnce login`                  |
| `logout`     | Logout from account           | `pnce logout`                 |
| `whoami`     | View current user             | `pnce whoami`                 |
| `publish`    | Publish module                | `pnce publish`                |
| `init`       | Initialize project            | `pnce init my-service`        |
| `install`    | Install module                | `pnce install auth-module`    |
| `add`        | Add module to dependencies    | `pnce add auth-module`        |
| `remove`     | Remove module                 | `pnce remove auth-module`     |
| `update`     | Update all modules            | `pnce update`                 |
| `port list`  | List port configurations      | `pnce port list`             |
| `port check` | Check for port conflicts      | `pnce port check`            |

## 💡 Usage Examples

### 1. Create Service Project

```bash
# Create a service project (default type)
pnce init my-service

# Or explicitly specify type
pnce init my-service --type service
```

### 2. Create Microservice Module

```bash
# Create a microservice module
pnce init my-microservice --type microservice
```

### 3. Edit module.config.json

After creating a project, you can edit the `module.config.json` file to associate with an application or team:

```json
{
  "name": "my-microservice",
  "description": "Microservice module",
  "author": "module-author",
  "version": "1.0.0",
  "type": "microservice",
  "appId": "607f1f77bcf86cd799439022",
  "teamId": "507f1f77bcf86cd799439011",
  "mainModule": "./dist/my-microservice.module.js",
  "exports": {
    "MyMicroserviceModule": "./dist/my-microservice.module.js",
    "MyMicroserviceService": "./dist/my-microservice.service.js"
  }
}
```

### 4. Upload Module

```bash
# When uploading a module, appId and teamId from module.config.json will be automatically read
pnce publish
```

**Notes:**

- `appId` - Used to associate with an application
- `teamId` - Used to associate with a team
- Both can be used separately or together
- If not provided, these fields will be empty strings

## 🏗️ Development

### Running from Source

```bash
# Clone repository
git clone <repository-url>
cd command-line-tools

# Install dependencies
npm install

# Build
npm run build

# Development mode (auto recompile)
npm run watch

# Test commands
npm run start init my-service
```

### Local Testing with Global Installation

```bash
# Build and link locally
cd command-line-tools
npm run build
npm link

# Now you can use pnce commands anywhere
pnce --help
```

## 📁 Project Structure

```
command-line-tools/
├── src/
│   ├── commands/           # Command modules
│   │   ├── auth.commands.ts
│   │   ├── module.commands.ts
│   │   ├── install.commands.ts
│   │   ├── init.commands.ts
│   │   ├── modules-manager.commands.ts
│   │   ├── port.commands.ts
│   │   ├── templates/      # Project templates
│   │   │   └── microservice-template.ts
│   │   └── index.ts        # Command registration
│   ├── services/           # Business services
│   ├── types/             # Type definitions
│   ├── utils/             # Utility functions
│   └── index.ts           # CLI entry point
├── dist/                  # Build output
├── package.json
└── README.md
```

## 🔧 Configuration

### Configuration Files

Pnce CLI uses the following configuration files:

- `module.config.json` - Project configuration (in project root directory)
- `.pnce/config.json` - User configuration (in user home directory)

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT
