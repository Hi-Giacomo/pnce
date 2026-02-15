# Pnce CLI

Pnce CLI Tool - NestJS 模块化快速开发命令行工具

专为 NestJS 设计的模块化开发工具，帮助开发者快速创建、管理和发布 NestJS 模块。

## 🚀 安装

### 全局安装

```bash
npm install -g pnce
```

安装后，可以在任何目录使用 `pnce` 命令。

## 📖 快速开始

### 检查安装

```bash
pnce --version
pnce --help
```

### 认证

```bash
# 登录账户
pnce login

# 查看当前用户
pnce whoami

# 登出账户
pnce logout
```

### 创建项目

```bash
# 创建服务项目
pnce init my-service

# 创建微服务项目
pnce init my-microservice --type microservice

# 在指定目录创建项目
pnce init my-service --directory /path/to/project
```

### 模块管理

```bash
# 发布模块
pnce publish
```

### 依赖管理

```bash
# 安装模块
pnce install <module-name>

# 添加模块到依赖
pnce add <module-name>

# 移除模块
pnce remove <module-name>

# 更新所有模块
pnce update
```

### 端口管理

```bash
# 列出所有端口配置
pnce port list

# 检查端口冲突
pnce port check
```

## 📦 可用命令

| 命令         | 说明           | 示例                       |
| ------------ | -------------- | -------------------------- |
| `login`      | 登录账户       | `pnce login`               |
| `logout`     | 登出账户       | `pnce logout`              |
| `whoami`     | 查看当前用户   | `pnce whoami`              |
| `publish`    | 发布模块       | `pnce publish`             |
| `init`       | 初始化项目     | `pnce init my-service`     |
| `install`    | 安装模块       | `pnce install auth-module` |
| `add`        | 添加模块到依赖 | `pnce add auth-module`     |
| `remove`     | 移除模块       | `pnce remove auth-module`  |
| `update`     | 更新所有模块   | `pnce update`              |
| `port list`  | 列出端口配置   | `pnce port list`           |
| `port check` | 检查端口冲突   | `pnce port check`          |

## 💡 使用示例

### 1. 创建服务项目

```bash
# 创建一个服务项目（默认类型）
pnce init my-service

# 或明确指定类型
pnce init my-service --type service
```

### 2. 创建微服务模块

```bash
# 创建一个微服务模块
pnce init my-microservice --type microservice
```

### 3. 编辑 module.config.json

创建项目后，可以编辑 `module.config.json` 文件来关联应用或团队：

```json
{
  "name": "my-microservice",
  "description": "微服务模块",
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

### 4. 上传模块

```bash
# 上传模块时，会自动读取 module.config.json 中的 appId 和 teamId
pnce publish
```

**说明：**

- `appId` - 用于关联到应用
- `teamId` - 用于关联到团队
- 两者可以单独使用，也可以同时使用
- 如果不提供，这两个字段为空字符串

## 🏗️ 开发

### 从源码运行

```bash
# 克隆仓库
git clone <repository-url>
cd command-line-tools

# 安装依赖
npm install

# 构建
npm run build

# 开发模式（自动重新编译）
npm run watch

# 测试命令
npm run start init my-service
```

### 本地测试全局安装

```bash
# 在本地构建并链接
cd command-line-tools
npm run build
npm link

# 现在可以在任何位置使用 pnce 命令
pnce --help
```

## 📁 项目结构

```
command-line-tools/
├── src/
│   ├── commands/           # 命令模块
│   │   ├── auth.commands.ts
│   │   ├── module.commands.ts
│   │   ├── install.commands.ts
│   │   ├── init.commands.ts
│   │   ├── modules-manager.commands.ts
│   │   ├── port.commands.ts
│   │   ├── templates/      # 项目模板
│   │   │   └── microservice-template.ts
│   │   └── index.ts        # 命令注册
│   ├── services/           # 业务服务
│   ├── types/             # 类型定义
│   ├── utils/             # 工具函数
│   └── index.ts           # CLI 入口
├── dist/                  # 编译输出
├── package.json
└── README.md
```

## 🔧 配置

### 配置文件

Pnce CLI 使用以下配置文件：

- `module.config.json` - 项目配置（在项目根目录）
- `.pnce/config.json` - 用户配置（在用户主目录）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
