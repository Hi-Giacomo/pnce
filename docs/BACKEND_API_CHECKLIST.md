# PNCE 后端接口开发清单

> 本文档为后端开发人员提供完整的接口开发清单，确保所有功能都能正确实现。

---

## 📋 开发概览

### 基础配置

- **Base URL**: `http://localhost:3000` (可通过环境变量 `PNCE_API_SERVER` 配置)
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token (JWT)

### OAuth2 配置

- **Client ID**: `module-registry-cli`
- **授权模式**: Authorization Code + PKCE
- **回调端口**: 8765 (可通过环境变量 `PNCE_OAUTH_PORT` 配置)
- **授权端点**: `http://localhost:5173/authorize` (可通过环境变量 `PNCE_OAUTH_ENDPOINT` 配置)
- **Scope**: `read write`
- **超时时间**: 120秒

### 技术栈建议

- **后端框架**: NestJS / Express / Fastify
- **数据库**: PostgreSQL / MySQL / MongoDB
- **对象存储**: AWS S3 / MinIO / 阿里云OSS
- **缓存**: Redis
- **认证**: JWT + OAuth2

---

## 🔐 认证接口（5个）

### 1. 用户注册

```typescript
POST /api/auth/register
```

**是否需要认证**: 否

**请求头**:
```http
Content-Type: application/json
```

**请求体**:
```typescript
{
  username: string;  // 用户名，必填，唯一
  email: string;     // 邮箱，必填，唯一
  password: string;  // 密码，必填，最少6位
}
```

**成功响应**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "邮箱已存在",
  "errorCode": "AUTH_001"
}
```

**错误码**:
- `AUTH_001`: 邮箱已存在
- `AUTH_002`: 用户名已存在
- `AUTH_003`: 密码格式不正确

---

### 2. 用户登录（邮箱密码）

```typescript
POST /api/auth/login
```

**是否需要认证**: 否

**请求体**:
```typescript
{
  email: string;     // 邮箱，必填
  password: string;  // 密码，必填
}
```

**成功响应**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误码**:
- `AUTH_010`: 邮箱或密码错误
- `AUTH_011`: 账户已被禁用

---

### 3. 获取当前用户信息

```typescript
GET /api/auth/me
```

**是否需要认证**: 是

**请求头**:
```http
Authorization: Bearer <access_token>
```

**成功响应**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. 刷新Token

```typescript
POST /api/auth/refresh
```

**是否需要认证**: 否（使用 refresh_token）

**请求体**:
```typescript
{
  refresh_token: string;  // 刷新令牌
}
```

**成功响应**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new_refresh_token"
}
```

**错误码**:
- `AUTH_020`: refresh_token 无效或已过期

---

### 5. 用户登出

```typescript
POST /api/auth/logout
```

**是否需要认证**: 是

**请求头**:
```http
Authorization: Bearer <access_token>
```

**成功响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 🔐 OAuth2 授权接口

### 6. OAuth2 授权页面

```typescript
GET /authorize
```

**说明**: 此接口在网站域名下（如 `http://localhost:5173/authorize`），不在 API 服务器

**是否需要认证**: 否

**请求参数** (Query):
```typescript
{
  response_type: string;           // 固定值 "code"
  client_id: string;               // 固定值 "module-registry-cli"
  redirect_uri: string;            // 回调地址，如: http://localhost:8765/callback
  code_challenge: string;          // PKCE challenge (base64url)
  code_challenge_method: string;   // 固定值 "S256"
  state: string;                   // 随机状态值，防止 CSRF
  scope: string;                   // 固定值 "read write"
}
```

**响应**: 返回授权页面 HTML

**授权成功回调格式**:
```
http://localhost:8765/callback?code=<base64_encoded_data>&state=<state>
```

其中 `code` 是 base64 编码的 JSON：
```json
{
  "accessToken": "jwt_token_string",
  "refreshToken": "refresh_token_string",
  "user": {
    "username": "string",
    "email": "string",
    "id": "uuid"
  }
}
```

**错误码**:
- `OAUTH_001`: 无效的 client_id
- `OAUTH_002`: 无效的 redirect_uri
- `OAUTH_003`: state 验证失败
- `OAUTH_004`: 授权被拒绝
- `OAUTH_005`: code_challenge 验证失败
- `OAUTH_006`: 授权已过期

---

## 📦 模块管理接口（6个）

### 7. 上传模块

```typescript
POST /api/modules/upload
```

**是否需要认证**: 是

**请求头**:
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**请求体** (FormData):
```typescript
{
  package: File;         // .tgz 文件，必填
  name: string;         // 模块名称，必填
  version: string;      // 版本号，必填（如 "1.0.0"）
  description?: string; // 描述，可选
  appId?: string;       // 应用ID，可选
  teamId?: string;      // 团队ID，可选
  type?: string;        // 类型: 'service' | 'microservice' | 'library'，默认 'library'
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "模块上传成功",
  "module": {
    "name": "auth-service",
    "version": "1.0.0",
    "description": "用户认证微服务",
    "author": "testuser",
    "type": "microservice",
    "appId": "",
    "teamId": "",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "size": 102400,
    "sha256": "abc123..."
  }
}
```

**错误码**:
- `MODULE_001`: 模块名称格式错误
- `MODULE_002`: 版本号格式错误
- `MODULE_003`: 同一模块已存在该版本
- `MODULE_004`: 文件上传失败
- `MODULE_005`: package.json 解析失败
- `MODULE_006`: module.config.json 格式错误

**文件格式要求**:
上传的 .tgz 文件必须包含：
```
package.json          # 必填
module.config.json    # 必填
src/                  # 源代码目录
dist/                 # 编译输出（可选）
README.md             # 文档（可选）
```

---

### 8. 获取模块信息

```typescript
GET /api/modules/:name
```

**是否需要认证**: 否

**路径参数**:
```typescript
name: string;  // 模块名称
```

**成功响应**:
```json
{
  "success": true,
  "module": {
    "name": "auth-service",
    "description": "用户认证微服务",
    "author": "testuser",
    "uploadedBy": "testuser",
    "latest": "1.0.0",
    "type": "microservice",
    "appId": "app-123",
    "teamId": "team-456",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "downloads": 1500,
    "versions": {
      "1.0.0": {
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "size": 102400,
        "sha256": "abc123..."
      },
      "0.9.0": {
        "uploadedAt": "2023-12-01T00:00:00.000Z",
        "size": 98304,
        "sha256": "def456..."
      }
    }
  }
}
```

**错误码**:
- `MODULE_010`: 模块不存在

---

### 9. 下载模块

```typescript
GET /api/modules/:name/:version/download
```

**是否需要认证**: 是

**路径参数**:
```typescript
name: string;     // 模块名称
version: string;   // 版本号
```

**响应**: 二进制文件流 (.tgz)

**响应头**:
```http
Content-Type: application/gzip
Content-Disposition: attachment; filename="auth-service-1.0.0.tgz"
Content-Length: 102400
X-SHA256: abc123...
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_011`: 版本不存在

---

### 10. 删除模块版本

```typescript
DELETE /api/modules/:name/:version
```

**是否需要认证**: 是

**路径参数**:
```typescript
name: string;     // 模块名称
version: string;  // 版本号
```

**成功响应**:
```json
{
  "success": true,
  "message": "版本删除成功"
}
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_011`: 版本不存在
- `MODULE_012`: 无权限删除（非模块所有者）

---

### 11. 删除整个模块

```typescript
DELETE /api/modules/:name
```

**是否需要认证**: 是

**路径参数**:
```typescript
name: string;  // 模块名称
```

**查询参数** (Query):
```typescript
{
  force?: boolean;  // 是否强制删除所有版本，默认 false
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "模块删除成功"
}
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_012`: 无权限删除

---

### 12. 更新模块信息

```typescript
PUT /api/modules/:name
```

**是否需要认证**: 是

**路径参数**:
```typescript
name: string;  // 模块名称
```

**请求体**:
```typescript
{
  description?: string;  // 新的描述
  type?: string;        // 新的类型
  appId?: string;        // 新的应用ID
  teamId?: string;      // 新的团队ID
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "模块信息更新成功",
  "module": {
    "name": "auth-service",
    "description": "新的描述",
    // ... 其他字段
  }
}
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_012`: 无权限更新

---

## 🔍 模块搜索接口（4个）

### 13. 搜索模块

```typescript
GET /api/modules
```

**是否需要认证**: 否

**查询参数** (Query):
```typescript
{
  q?: string;        // 搜索关键词，可选
  author?: string;   // 按作者筛选，可选
  type?: string;     // 按类型筛选: 'service' | 'microservice' | 'library'，可选
  page?: number;     // 页码，默认 1
  limit?: number;    // 每页数量，默认 20，最大 100
  sort?: string;     // 排序: 'name' | 'date' | 'downloads'，默认 'date'
}
```

**成功响应**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "author": "testuser",
      "latest": "1.0.0",
      "type": "microservice",
      "downloads": 1500,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 14. 获取热门模块

```typescript
GET /api/modules/trending
```

**是否需要认证**: 否

**查询参数** (Query):
```typescript
{
  period?: string;  // 时间段: 'day' | 'week' | 'month'，默认 'week'
  limit?: number;   // 返回数量，默认 10，最大 50
}
```

**成功响应**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "author": "testuser",
      "latest": "1.0.0",
      "type": "microservice",
      "downloads": 500,
      "downloadsChange": 25.5  // 增长百分比
    }
  ]
}
```

---

### 15. 按作者获取模块

```typescript
GET /api/modules/by-author/:author
```

**是否需要认证**: 否

**路径参数**:
```typescript
author: string;  // 作者用户名
```

**查询参数** (Query):
```typescript
{
  page?: number;   // 页码，默认 1
  limit?: number;  // 每页数量，默认 20
}
```

**成功响应**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "latest": "1.0.0",
      "type": "microservice",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "downloads": 1500
    }
  ],
  "author": {
    "username": "testuser",
    "email": "test@example.com",
    "moduleCount": 5,
    "totalDownloads": 10000
  }
}
```

---

### 16. 获取所有模块列表

```typescript
GET /api/modules/list
```

**是否需要认证**: 否

**查询参数** (Query):
```typescript
{
  page?: number;   // 页码，默认 1
  limit?: number;  // 每页数量，默认 20，最大 100
}
```

**成功响应**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "author": "testuser",
      "latest": "1.0.0",
      "type": "microservice",
      "downloads": 1500,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 📊 统计接口（2个）

### 17. 获取全局统计信息

```typescript
GET /api/stats
```

**是否需要认证**: 否

**成功响应**:
```json
{
  "success": true,
  "stats": {
    "totalModules": 150,
    "totalVersions": 450,
    "totalSize": 1073741824,  // 字节数
    "totalDownloads": 50000,
    "topAuthors": [
      {
        "author": "testuser",
        "count": 15,
        "downloads": 10000
      },
      {
        "author": "developer",
        "count": 10,
        "downloads": 8000
      }
    ],
    "topModules": [
      {
        "name": "auth-service",
        "downloads": 5000
      },
      {
        "name": "user-module",
        "downloads": 3000
      }
    ]
  }
}
```

---

### 18. 获取模块下载统计

```typescript
GET /api/stats/modules/:name
```

**是否需要认证**: 否

**路径参数**:
```typescript
name: string;  // 模块名称
```

**查询参数** (Query):
```typescript
{
  period?: string;     // 时间段: 'day' | 'week' | 'month' | 'year' | 'all'，默认 'all'
  byVersion?: boolean; // 是否按版本分组，默认 false
}
```

**成功响应**:
```json
{
  "success": true,
  "stats": {
    "module": "auth-service",
    "totalDownloads": 5000,
    "downloadsByPeriod": {
      "2024-01-01": 100,
      "2024-01-02": 150,
      "2024-01-03": 200
    },
    "downloadsByVersion": {
      "1.0.0": 3000,
      "0.9.0": 2000
    }
  }
}
```

---

## ❤️ 健康检查接口（1个）

### 19. 服务健康检查

```typescript
GET /health
```

**是否需要认证**: 否

**成功响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "storage": "available",
    "redis": "connected"
  },
  "uptime": 86400  // 运行时间（秒）
}
```

---

## ❌ 错误码完整列表

### 认证错误 (AUTH_xxx)

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| AUTH_001 | 邮箱已存在 | 409 |
| AUTH_002 | 用户名已存在 | 409 |
| AUTH_003 | 密码格式不正确 | 400 |
| AUTH_010 | 邮箱或密码错误 | 401 |
| AUTH_011 | 账户已被禁用 | 403 |
| AUTH_012 | Token 无效或已过期 | 401 |
| AUTH_013 | Token 格式错误 | 401 |
| AUTH_014 | 无权访问 | 403 |
| AUTH_020 | refresh_token 无效或已过期 | 401 |

### OAuth2 错误 (OAUTH_xxx)

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| OAUTH_001 | 无效的 client_id | 400 |
| OAUTH_002 | 无效的 redirect_uri | 400 |
| OAUTH_003 | state 验证失败 | 403 |
| OAUTH_004 | 授权被拒绝 | 403 |
| OAUTH_005 | code_challenge 验证失败 | 403 |
| OAUTH_006 | 授权已过期 | 410 |

### 模块错误 (MODULE_xxx)

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| MODULE_001 | 模块名称格式错误 | 400 |
| MODULE_002 | 版本号格式错误 | 400 |
| MODULE_003 | 同一模块已存在该版本 | 409 |
| MODULE_004 | 文件上传失败 | 500 |
| MODULE_005 | package.json 解析失败 | 400 |
| MODULE_006 | module.config.json 格式错误 | 400 |
| MODULE_010 | 模块不存在 | 404 |
| MODULE_011 | 版本不存在 | 404 |
| MODULE_012 | 无权限操作 | 403 |

### 服务器错误 (SERVER_xxx)

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| SERVER_001 | 内部服务器错误 | 500 |
| SERVER_002 | 数据库连接失败 | 503 |
| SERVER_003 | 存储服务不可用 | 503 |
| SERVER_004 | 请求超时 | 504 |

---

## 🗄️ 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_username (username),
  INDEX idx_email (email)
);
```

### 模块表 (modules)

```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(214) NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'library',
  app_id VARCHAR(100),
  team_id VARCHAR(100),
  total_downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(name, author_id),
  INDEX idx_name (name),
  INDEX idx_author (author_id),
  INDEX idx_type (type),
  INDEX idx_created (created_at)
);
```

### 模块版本表 (module_versions)

```sql
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  downloads INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(module_id, version),
  INDEX idx_module_version (module_id, version),
  INDEX idx_uploaded (uploaded_at)
);
```

### 下载统计表 (download_stats)

```sql
CREATE TABLE download_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version VARCHAR(50),
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_module_date (module_id, downloaded_at),
  INDEX idx_downloaded_at (downloaded_at)
);
```

### 刷新令牌表 (refresh_tokens)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_token (token),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
);
```

---

## 📦 文件存储结构

### 对象存储路径

```
modules/
  ├── {module_name}/
  │   ├── {version}/
  │   │   ├── package.tgz
  │   │   └── metadata.json
  └── ...
```

### 文件完整性校验

上传文件时计算 SHA256 哈希：
```typescript
import crypto from 'crypto';
import fs from 'fs';

function calculateHash(filePath: string): string {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}
```

---

## 🔒 安全要求

### 1. 密码加密

使用 bcrypt 加密密码，盐值轮数 ≥ 10：
```typescript
import bcrypt from 'bcrypt';

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 2. JWT Token

- Access Token 有效期：1小时
- Refresh Token 有效期：7天
- 使用 RS256 算法签名

### 3. 文件上传限制

- 单个文件最大：50MB
- 允许的文件类型：.tgz
- 文件大小验证
- 文件类型验证

### 4. 限流策略

```typescript
// API 限流
- 每个 IP: 100 请求/分钟
- 每个用户: 200 请求/分钟
- 文件上传: 10 次/分钟

// 存储限制
- 单个文件: 最大 50MB
- 用户总存储: 10GB
```

---

## ✅ 开发检查清单

### 基础功能

- [ ] 用户注册
- [ ] 用户登录
- [ ] OAuth2 授权
- [ ] Token 刷新
- [ ] 用户登出
- [ ] 获取用户信息

### 模块管理

- [ ] 上传模块
- [ ] 获取模块信息
- [ ] 下载模块
- [ ] 删除模块版本
- [ ] 删除整个模块
- [ ] 更新模块信息

### 模块搜索

- [ ] 搜索模块
- [ ] 获取热门模块
- [ ] 按作者获取模块
- [ ] 获取所有模块列表

### 统计功能

- [ ] 全局统计
- [ ] 模块下载统计

### 系统功能

- [ ] 健康检查
- [ ] 错误处理
- [ ] 日志记录
- [ ] 性能监控

### 安全功能

- [ ] 密码加密
- [ ] JWT 认证
- [ ] OAuth2 授权
- [ ] 限流保护
- [ ] 文件校验

### 文档和测试

- [ ] API 文档（Swagger）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 部署文档

---

## 🚀 部署要求

### 环境变量

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/pnce

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# 对象存储配置
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=module-registry
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Redis 配置
REDIS_URL=redis://localhost:6379

# OAuth2 配置
OAUTH_CLIENT_ID=module-registry-cli
OAUTH_REDIRECT_URI=http://localhost:8765/callback

# 限流配置
RATE_LIMIT_WINDOW=60000  # 1分钟
RATE_LIMIT_MAX=100        # 最大请求数

# 文件上传配置
MAX_FILE_SIZE=52428800    # 50MB
USER_MAX_STORAGE=10737418240  # 10GB
```

---

## 📝 API 测试工具

### Postman Collection

建议创建 Postman Collection 进行接口测试，包含所有 19 个接口的示例。

### cURL 示例

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 上传模块
curl -X POST http://localhost:3000/api/modules/upload \
  -H "Authorization: Bearer <token>" \
  -F "package=@module-1.0.0.tgz" \
  -F "name=auth-service" \
  -F "version=1.0.0" \
  -F "description=Auth microservice"

# 获取模块信息
curl http://localhost:3000/api/modules/auth-service

# 下载模块
curl -O -J http://localhost:3000/api/modules/auth-service/1.0.0/download \
  -H "Authorization: Bearer <token>"
```

---

**文档版本**: v1.0.0
**最后更新**: 2024-03-06
**维护者**: PNCE Team

祝开发顺利！🎉
