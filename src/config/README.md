# 配置文件说明

## 概述

本目录包含项目的默认配置常量，用于集中管理项目中所有的默认配置值。

## 文件说明

### default.config.ts

这是核心配置文件，包含以下配置项：

#### 注册中心相关配置
- `DEFAULT_REGISTRY_URL`: 默认的模块服务下载地址（http://localhost:3000）
- `DEFAULT_WEBSITE_URL`: 默认的网站地址（http://localhost:5173）

#### OAuth2 认证相关配置
- `OAUTH2_CONFIG.CLIENT_ID`: OAuth2 客户端ID（module-registry-cli）
- `OAUTH2_CONFIG.REDIRECT_PORT`: OAuth2 回调重定向端口（8765）
- `OAUTH2_CONFIG.AUTH_TIMEOUT`: 认证超时时间，单位毫秒（120000，即2分钟）
- `OAUTH2_CONFIG.SCOPE`: OAuth2 授权范围（read write）

#### 环境变量名称
- `ENV_KEYS.MODULE_REGISTRY`: 模块服务地址环境变量名（MODULE_REGISTRY）
- `ENV_KEYS.MODULE_REGISTRY_WEBSITE`: 网站地址环境变量名（MODULE_REGISTRY_WEBSITE）
- `ENV_KEYS.MODULE_AUTH_TOKEN`: 认证令牌环境变量名（MODULE_AUTH_TOKEN）

#### 配置文件
- `CONFIG_FILE_NAME`: 配置文件名称（.modulerc）

## 使用方式

### 在代码中引用配置

```typescript
import {
  DEFAULT_REGISTRY_URL,
  DEFAULT_WEBSITE_URL,
  OAUTH2_CONFIG,
  ENV_KEYS,
  CONFIG_FILE_NAME
} from '../config/default.config';
```

### 环境变量覆盖

可以通过设置环境变量来覆盖默认配置：

```bash
export MODULE_REGISTRY=https://api.example.com
export MODULE_REGISTRY_WEBSITE=https://www.example.com
export MODULE_AUTH_TOKEN=your_token_here
```

### 配置文件覆盖

也可以通过在项目根目录创建 `.modulerc` 文件来覆盖配置：

```json
{
  "registry": "https://api.example.com",
  "website": "https://www.example.com",
  "authToken": "your_token_here"
}
```

## 修改配置

### 修改默认值

直接修改 `default.config.ts` 文件中对应的常量值。

### 添加新的配置项

1. 在 `default.config.ts` 中添加新的常量
2. 更新使用这些配置的代码文件，导入并使用新常量

## 优先级

配置的优先级从高到低：

1. 用户设置的配置文件（`.modulerc`）
2. 环境变量
3. 默认配置常量（`default.config.ts`）

## 注意事项

- 修改默认配置常量后需要重新编译 TypeScript
- 敏感信息（如认证令牌）建议使用环境变量或配置文件，不要硬编码
- OAuth2 相关配置通常是固定的，不建议随意修改
