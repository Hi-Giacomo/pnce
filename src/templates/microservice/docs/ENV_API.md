# 环境变量管理 API

该服务提供动态环境变量管理功能，支持通过 API 接口或直接编辑 `.env` 文件修改配置。修改后自动监听并应用变更，无需手动重启服务。

## 目录

- [功能特性](#功能特性)
- [API 接口](#api-接口)
- [使用方式](#使用方式)
- [重启机制](#重启机制)
- [注意事项](#注意事项)

---

## 功能特性

### 1. 动态配置更新
- ✅ 通过 API 接口实时修改环境变量
- ✅ 直接编辑 `.env` 文件自动生效
- ✅ 修改立即写入文件，持久化保存
- ✅ 配置变更自动同步到 `process.env`

### 2. 智能重启机制
- 🔀 修改 `PORT` 或 `NODE_ENV` 时自动平滑重启服务
- 🔀 重启异步执行，不阻塞当前请求
- 🔀 其他配置修改立即生效，无需重启
- 🔀 重启时间约 1-2 秒

### 3. 文件自动监听
- 📂 自动监听 `.env` 文件的任何修改
- 📂 支持接口修改、手动编辑、脚本更新等多种方式
- 📂 资源占用极低（CPU <0.01%，内存 1-2 MB）
- 📂 使用 `chokidar` 实现高效文件监听

---

## API 接口

### 基础信息

**Base URL**: `http://localhost:3000/api`

**全局前缀**: `/api`

---

### 1. 获取所有环境变量

获取当前所有的环境变量及其值。

**请求**
```
GET /api/env
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "PORT": "3000",
    "NODE_ENV": "development",
    "DB_HOST": "localhost",
    "DB_PORT": "5432",
    "DB_NAME": "database",
    "DB_USER": "admin",
    "DB_PASS": "password",
    "JWT_SECRET": "your-secret-key",
    "JWT_EXPIRES_IN": "7d",
    "REDIS_HOST": "localhost",
    "REDIS_PORT": "6379"
  }
}
```

---

### 2. 获取单个环境变量

获取指定环境变量的值。

**请求**
```
GET /api/env/:key
```

**参数**
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| key | string | 是 | 环境变量名称 | PORT |

**请求示例**
```
GET /api/env/PORT
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "key": "PORT",
    "value": "3000"
  }
}
```

---

### 3. 获取配置对象

获取结构化的配置对象，包含所有配置分组。

**请求**
```
GET /api/env/config/all
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "app": {
      "port": 3000,
      "env": "development"
    },
    "database": {
      "host": "localhost",
      "port": 5432,
      "username": "admin",
      "password": "password",
      "database": "database"
    },
    "jwt": {
      "secret": "your-secret-key",
      "expiresIn": "7d"
    },
    "redis": {
      "host": "localhost",
      "port": 6379,
      "password": ""
    }
  }
}
```

---

### 4. 设置环境变量

设置单个环境变量的值。修改 `PORT` 或 `NODE_ENV` 会自动重启服务。

**请求**
```
POST /api/env
Content-Type: application/json
```

**请求体**
```json
{
  "key": "PORT",
  "value": "4000"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 环境变量名称 |
| value | string | 是 | 环境变量值 |

**响应示例（无需重启）**
```json
{
  "success": true,
  "message": "环境变量 PORT 更新成功",
  "needRestart": false
}
```

**响应示例（需要重启）**
```json
{
  "success": true,
  "message": "环境变量 PORT 更新成功，服务正在自动重启中...",
  "needRestart": true
}
```

**注意事项**
- 修改 `PORT` 或 `NODE_ENV` 会触发服务重启（1-2 秒）
- 当前请求会立即返回，不等待重启完成
- 重启期间其他请求可能短暂中断
- 重启后访问新端口或新环境

---

### 5. 批量设置环境变量

批量设置多个环境变量的值。

**请求**
```
POST /api/env/batch
Content-Type: application/json
```

**请求体**
```json
{
  "envVars": {
    "DB_HOST": "192.168.1.100",
    "DB_PORT": "5432",
    "DB_NAME": "production_db",
    "JWT_EXPIRES_IN": "30d"
  }
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| envVars | object | 是 | 环境变量键值对对象 |

**响应示例**
```json
{
  "success": true,
  "message": "批量更新完成: 成功 4 个, 失败 0 个",
  "updated": ["DB_HOST", "DB_PORT", "DB_NAME", "JWT_EXPIRES_IN"],
  "failed": []
}
```

**注意事项**
- 如果 `envVars` 中包含 `PORT` 或 `NODE_ENV`，会触发重启
- 全部成功或全部失败都视为一个批次
- 部分失败时会返回失败列表

---

### 6. 删除环境变量

删除指定的环境变量。

**请求**
```
DELETE /api/env/:key
```

**参数**
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| key | string | 是 | 要删除的环境变量名称 | REDIS_PASSWORD |

**请求示例**
```
DELETE /api/env/REDIS_PASSWORD
```

**响应示例**
```json
{
  "success": true,
  "message": "环境变量 REDIS_PASSWORD 删除成功"
}
```

---

### 7. 重载环境变量

从 `.env` 文件重新加载所有环境变量到 `process.env`。

**请求**
```
POST /api/env/reload
```

**响应示例**
```json
{
  "success": true,
  "message": "环境变量重载成功",
  "config": {
    "PORT": "3000",
    "NODE_ENV": "development",
    "DB_HOST": "localhost",
    ...
  }
}
```

---

### 8. 健康检查

检查环境变量服务是否正常运行。

**请求**
```
GET /api/env/health/status
```

**响应示例**
```json
{
  "success": true,
  "message": "环境变量服务运行正常",
  "timestamp": "2024-02-26T10:30:00.000Z",
  "config": {
    "env": "development",
    "port": 3000
  }
}
```

---

## 使用方式

### 方式一：通过 API 接口

#### 使用 cURL

```bash
# 更新端口为 4000
curl -X POST http://localhost:3000/api/env \
  -H "Content-Type: application/json" \
  -d '{"key":"PORT","value":"4000"}'

# 批量更新数据库配置
curl -X POST http://localhost:3000/api/env/batch \
  -H "Content-Type: application/json" \
  -d '{
    "envVars": {
      "DB_HOST": "192.168.1.100",
      "DB_PORT": "5432",
      "DB_NAME": "production_db"
    }
  }'

# 获取所有环境变量
curl http://localhost:3000/api/env
```

#### 使用 JavaScript/Fetch

```javascript
// 更新单个配置
fetch('http://localhost:3000/api/env', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: 'JWT_EXPIRES_IN',
    value: '30d',
  }),
}).then(res => res.json()).then(console.log);

// 批量更新配置
fetch('http://localhost:3000/api/env/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    envVars: {
      NODE_ENV: 'production',
      REDIS_HOST: 'redis.example.com',
    },
  }),
}).then(res => res.json()).then(console.log);
```

#### 使用 Postman

导入 `postman-collection.json` 文件到 Postman，即可使用预配置的接口集合。

---

### 方式二：直接编辑 .env 文件

服务会自动监听 `.env` 文件的修改，无需手动重启。

```bash
# 编辑 .env 文件
nano .env

# 修改端口
PORT=8080

# 保存后，服务会自动检测并重启
```

**日志输出示例**
```
📄 检测到 .env 文件修改
🔄 环境变量已更新
⚠️  端口从 3000 变更为 8080
⚠️  准备重启服务...
✅ 旧服务器已关闭
✅ 环境变量文件监听已启动
✅ 服务重启成功
```

---

## 重启机制

### 重启触发条件

只有修改以下环境变量时会触发服务重启：

| 变量名 | 类型 | 说明 |
|---------|------|------|
| PORT | 端口号 | 应用监听端口变化时需要重启 |
| NODE_ENV | 运行环境 | 开发/生产环境切换时需要重启 |

### 重启流程

```
1. 接收请求或文件修改
   ↓
2. 更新 .env 文件（持久化）
   ↓
3. 更新 process.env（当前进程）
   ↓
4. 返回成功响应（不阻塞）
   ↓
5. 文件监听器检测到变化
   ↓
6. 检测到 PORT 或 NODE_ENV 变化
   ↓
7. 停止监听器（避免重复事件）
   ↓
8. 关闭旧服务器
   ↓
9. 使用新配置启动新服务器
   ↓
10. 重新启动监听器
```

### 重启时间

| 操作 | 耗时 |
|------|------|
| 停止监听器 | <10ms |
| 关闭服务器 | 100-500ms |
| 启动新服务器 | 500-1000ms |
| **总计** | **1-2 秒** |

### 请求影响

| 阶段 | 端口3000 | 端口3001 |
|------|-----------|-----------|
| 发起修改请求 | ✅ 正常 | ❌ 不可用 |
| 修改期间 | ✅ 正常 | ❌ 不可用 |
| 重启中（1-2秒） | ❌ 短暂中断 | ❌ 不可用 |
| 重启完成 | ❌ 已关闭 | ✅ 正常 |

---

## 在代码中使用配置

### 使用 ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}

  getData() {
    const port = this.configService.get<number>('env.app.port');
    const dbHost = this.configService.get<string>('env.database.host');
    const jwtSecret = this.configService.get<string>('env.jwt.secret');

    return { port, dbHost, jwtSecret };
  }
}
```

### 使用 EnvService

```typescript
import { Injectable } from '@nestjs/common';
import { EnvService } from './env.service';

@Injectable()
export class MyService {
  constructor(private readonly envService: EnvService) {}

  getData() {
    const config = this.envService.getConfig();
    return config;
  }

  getPort() {
    return this.envService.get<number>('env.app.port');
  }

  updateConfig(key: string, value: string) {
    return this.envService.setEnv(key, value);
  }
}
```

### 直接使用 process.env

```typescript
const port = process.env.PORT;
const dbHost = process.env.DB_HOST;
const jwtSecret = process.env.JWT_SECRET;
```

---

## 注意事项

### 安全性

1. **生产环境保护**
   - 环境变量接口建议在受保护的网络环境中使用
   - 添加身份验证中间件限制访问权限
   - 使用 HTTPS 协议传输数据

2. **敏感信息**
   - 不要在日志中输出密码、密钥等敏感信息
   - 定期轮换 JWT_SECRET、DB_PASS 等密钥
   - `.env` 文件不要提交到版本控制系统

### 配置管理

1. **备份建议**
   - 修改重要配置前建议备份 `.env` 文件
   - 使用 `.env.example` 作为配置模板

2. **配置验证**
   - 某些配置修改后可能需要重启服务才能完全生效
   - 修改数据库连接配置时，确保新连接信息正确
   - 修改 JWT_SECRET 后，已签发的 token 会失效

### 性能考虑

1. **资源占用**
   - 文件监听 CPU 占用 <0.01%
   - 内存占用 1-2 MB
   - 对服务性能影响可忽略

2. **重启频率**
   - 避免频繁修改 PORT 和 NODE_ENV
   - 每次重启会有 1-2 秒的短暂中断
   - 建议在低峰期进行端口或环境切换

### 开发建议

1. **编辑器配置**
   - 某些编辑器会生成临时文件（如 `.env.swp`）
   - 已自动忽略临时文件，不会触发误重启
   - 建议使用支持原子写入的编辑器

2. **文件权限**
   - 确保 `.env` 文件具有读写权限
   - Docker 部署时注意文件挂载权限
   - 容器内应用需要有文件修改权限

3. **日志监控**
   - 关注控制台日志中的重启信息
   - 监控重启失败告警
   - 记录重要配置变更历史

---

## 支持的环境变量

| 变量名 | 类型 | 默认值 | 说明 |
|---------|------|---------|------|
| PORT | number | 3000 | 应用监听端口 |
| NODE_ENV | string | development | 运行环境：development \| production \| test |
| DB_HOST | string | localhost | 数据库主机地址 |
| DB_PORT | number | 5432 | 数据库端口 |
| DB_NAME | string | database | 数据库名称 |
| DB_USER | string | admin | 数据库用户名 |
| DB_PASS | string | (空) | 数据库密码 |
| JWT_SECRET | string | default-secret | JWT 签名密钥 |
| JWT_EXPIRES_IN | string | 7d | JWT 过期时间 |
| REDIS_HOST | string | localhost | Redis 主机地址 |
| REDIS_PORT | number | 6379 | Redis 端口 |
| REDIS_PASSWORD | string | (空) | Redis 密码（可选） |

---

## 故障排查

### 问题：修改 PORT 后无法访问新端口

**原因**：服务未正常重启

**解决方法**：
1. 检查控制台日志，确认是否有重启日志
2. 查看是否有错误信息
3. 手动重启服务：`npm run dev`
4. 检查新端口是否被占用：`lsof -i :新端口`

### 问题：修改配置未生效

**原因**：`.env` 文件没有正确写入或监听器未启动

**解决方法**：
1. 检查 `.env` 文件是否已更新
2. 查看控制台日志确认监听器状态
3. 调用 `/api/env/reload` 手动重载配置
4. 重启服务

### 问题：服务频繁重启

**原因**：`.env` 文件被频繁修改或监听器误触发

**解决方法**：
1. 检查是否有其他进程在修改 `.env` 文件
2. 检查编辑器配置，避免频繁自动保存
3. 调整 `stabilityThreshold` 参数

---

## 附录

### 完整示例

**场景：切换到生产环境并更新数据库配置**

```bash
# 1. 切换环境
curl -X POST http://localhost:3000/api/env \
  -H "Content-Type: application/json" \
  -d '{"key":"NODE_ENV","value":"production"}'

# 等待 2 秒...

# 2. 批量更新数据库配置
curl -X POST http://localhost:3000/api/env/batch \
  -H "Content-Type: application/json" \
  -d '{
    "envVars": {
      "DB_HOST": "prod-db.example.com",
      "DB_PORT": "5432",
      "DB_NAME": "myapp_prod",
      "DB_USER": "prod_user",
      "DB_PASS": "secure_password"
    }
  }'

# 3. 验证配置
curl http://localhost:3000/api/env/config/all
```

### 类型提示

项目已配置 `process.env` 的类型提示，在 TypeScript 代码中输入 `process.env.` 会自动提示所有可用环境变量。

```typescript
// 自动提示
process.env.PORT        // ✅
process.env.DB_HOST     // ✅
process.env.JWT_SECRET  // ✅
```
