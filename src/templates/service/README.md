# Service

Service 微服务模板项目，基于 NestJS 构建，提供模块化的服务架构。

## 功能特性

- 模块化架构设计
- 动态环境变量管理
- 热重载支持（开发模式）
- CORS 跨域支持
- 环境文件自动监听
- 优雅关闭处理（SIGTERM/SIGINT）

## 安装

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install
```

## 运行

```bash
# 开发模式（带热重载）
npm run dev

# 开发模式（指定环境）
npm run dev:main

# 生产模式
npm run build
npm run start:prod
```

## 构建

```bash
npm run build
```

## 项目结构

```
service/
├── src/
│   ├── config/           # 配置文件
│   │   ├── env.config.ts # 环境变量配置
│   │   └── env.interface.ts
│   ├── modules/          # 业务模块
│   │   ├── env/         # 环境变量管理模块
│   │   └── hello/       # Hello 示例模块
│   └── main.ts          # 应用入口
├── docs/                # 项目文档
├── postman.json         # Postman 接口集合
├── package.json         # 依赖配置
├── module.config.json   # 模块配置
├── .env                 # 环境变量配置
└── tsconfig.json        # TypeScript 配置
```

## API 接口

### Hello 接口

- `GET /api/hello/world` - 获取 Hello World 消息

### 环境变量管理接口

- `GET /api/env` - 获取所有环境变量
- `GET /api/env/:key` - 获取单个环境变量
- `GET /api/env/config/all` - 获取配置对象
- `POST /api/env` - 设置环境变量
- `POST /api/env/batch` - 批量设置环境变量
- `DELETE /api/env/:key` - 删除环境变量
- `POST /api/env/reload` - 重载环境变量

详细 API 文档请查看 [docs/ENV_API.md](./docs/ENV_API.md)

## 环境变量

项目使用 `.env` 文件管理环境变量，支持以下变量：

### 应用配置
- `PORT` - 服务端口（默认: 3000）
- `NODE_ENV` - 运行环境（development/production/test）
- `APP_NAME` - 应用名称（默认: service）
- `APP_HOST` - 监听地址（默认: 0.0.0.0）

## 热重载机制

开发模式下，修改以下环境变量会自动重启服务：
- `PORT` - 服务端口变更
- `NODE_ENV` - 运行环境变更
- `APP_HOST` - 监听地址变更

其他环境变量修改后立即生效，无需重启。

## 优雅关闭

服务支持优雅关闭，当收到 SIGTERM 或 SIGINT 信号时会：
1. 停止环境变量文件监听
2. 关闭 HTTP 服务器
3. 退出进程

## Postman 导入

导入 `postman.json` 文件到 Postman 即可使用预配置的接口集合。

## 配置

编辑 `module.config.json` 来配置应用和团队关联：

```json
{
  "appId": "your-app-id",
  "teamId": "your-team-id"
}
```
