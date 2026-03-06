# Pnce 模块注册中心 - 后端接口文档

> 本文档详细描述了Pnce CLI工具所需的所有后端接口，供纯手工开发后端参考。

---

## 目录

- [概述](#概述)
- [通用规范](#通用规范)
- [认证接口](#认证接口)
- [模块管理接口](#模块管理接口)
- [模块搜索接口](#模块搜索接口)
- [统计接口](#统计接口)
- [健康检查](#健康检查)
- [错误码](#错误码)
- [数据模型](#数据模型)

---

## 概述

### 基础信息

- **Base URL**: `http://localhost:3000` (可通过环境变量配置)
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token (JWT)

### OAuth2配置

- **Client ID**: `module-registry-cli`
- **授权模式**: Authorization Code + PKCE
- **回调端口**: 8765
- **Scope**: `read write`
- **超时时间**: 120秒

---

## 通用规范

### 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "message": "错误描述",
  "errorCode": "ERROR_CODE",
  "details": {}
}
```

### 认证方式

除公开接口外，所有接口需要在请求头中携带Token：

```http
Authorization: Bearer <access_token>
```

### 文件上传

使用 `multipart/form-data` 格式上传文件：

```http
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
```

---

## 认证接口

### 1. 用户注册

**接口地址**: `POST /api/auth/register`

**是否需要认证**: 否

**请求参数**:

```typescript
{
  "username": string,  // 用户名，必填
  "email": string,     // 邮箱，必填，唯一
  "password": string   // 密码，必填，最少6位
}
```

**响应示例**:

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误码**:
- `AUTH_001`: 邮箱已存在
- `AUTH_002`: 用户名已存在
- `AUTH_003`: 密码格式不正确

---

### 2. 用户登录（邮箱密码）

**接口地址**: `POST /api/auth/login`

**是否需要认证**: 否

**请求参数**:

```typescript
{
  "email": string,     // 邮箱，必填
  "password": string   // 密码，必填
}
```

**响应示例**:

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误码**:
- `AUTH_010`: 邮箱或密码错误
- `AUTH_011`: 账户已被禁用

---

### 3. OAuth2授权页面

**接口地址**: `GET /authorize` (在website域名下)

**是否需要认证**: 否

**请求参数** (Query):

```typescript
{
  "response_type": "code",           // 固定值
  "client_id": "module-registry-cli",
  "redirect_uri": string,            // 回调地址，如: http://localhost:8765/callback
  "code_challenge": string,           // PKCE challenge
  "code_challenge_method": "S256",   // 固定值
  "state": string,                   // 随机状态值
  "scope": "read write"              // 权限范围
}
```

**响应**: 返回授权页面HTML

**授权成功后回调格式**:
```
http://localhost:8765/callback?code=<base64_encoded_data>&state=<state>
```

其中 `code` 是 base64 编码的 JSON，格式为：
```json
{
  "accessToken": "string",
  "user": {
    "username": "string",
    "email": "string"
  }
}
```

**错误码**:
- `OAUTH_001`: 无效的client_id
- `OAUTH_002`: 无效的redirect_uri
- `OAUTH_003`: state验证失败

---

### 4. 获取当前用户信息

**接口地址**: `GET /api/auth/me`

**是否需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. 刷新Token

**接口地址**: `POST /api/auth/refresh`

**是否需要认证**: 否（使用refresh_token）

**请求参数**:

```typescript
{
  "refresh_token": string  // 刷新令牌
}
```

**响应示例**:

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new_refresh_token"
}
```

**错误码**:
- `AUTH_020`: refresh_token无效或已过期

---

## 模块管理接口

### 6. 上传模块

**接口地址**: `POST /api/modules/upload`

**是否需要认证**: 是

**请求方式**: `multipart/form-data`

**请求参数**:

```
package: <binary file>       // .tgz文件，必填
name: string                 // 模块名称，必填
version: string              // 版本号，必填
description: string          // 描述，可选
appId: string                // 应用ID，可选
teamId: string               // 团队ID，可选
type: string                 // 类型，可选: 'service' | 'microservice' | 'library'
```

**请求示例**:

```http
POST /api/modules/upload HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="package"; filename="module-1.0.0.tgz"
Content-Type: application/gzip

<binary data>
------WebKitFormBoundary
Content-Disposition: form-data; name="name"

auth-service
------WebKitFormBoundary
Content-Disposition: form-data; name="version"

1.0.0
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

用户认证微服务
------WebKitFormBoundary
Content-Disposition: form-data; name="type"

microservice
------WebKitFormBoundary--
```

**响应示例**:

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
    "size": 102400
  }
}
```

**错误码**:
- `MODULE_001`: 模块名称格式错误
- `MODULE_002`: 版本号格式错误
- `MODULE_003`: 同一模块已存在该版本
- `MODULE_004`: 文件上传失败
- `MODULE_005`: package.json解析失败
- `MODULE_006`: module.config.json格式错误

---

### 7. 获取模块信息

**接口地址**: `GET /api/modules/:name`

**是否需要认证**: 否

**路径参数**:

- `name`: 模块名称

**响应示例**:

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
    "versions": {
      "1.0.0": {
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "size": 102400
      },
      "0.9.0": {
        "uploadedAt": "2023-12-01T00:00:00.000Z",
        "size": 98304
      }
    }
  }
}
```

**错误码**:
- `MODULE_010`: 模块不存在

---

### 8. 下载模块

**接口地址**: `GET /api/modules/:name/:version/download`

**是否需要认证**: 是

**路径参数**:

- `name`: 模块名称
- `version`: 版本号

**响应**: 二进制文件流 (.tgz)

**响应头**:

```http
Content-Type: application/gzip
Content-Disposition: attachment; filename="auth-service-1.0.0.tgz
Content-Length: 102400
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_011`: 版本不存在

---

### 9. 删除模块版本

**接口地址**: `DELETE /api/modules/:name/:version`

**是否需要认证**: 是

**路径参数**:

- `name`: 模块名称
- `version`: 版本号

**响应示例**:

```json
{
  "success": true,
  "message": "版本删除成功"
}
```

**错误码**:
- `MODULE_010`: 模块不存在
- `MODULE_011`: 版本不存在
- `MODULE_012`: 无权限删除

---

### 10. 删除整个模块

**接口地址**: `DELETE /api/modules/:name`

**是否需要认证**: 是

**路径参数**:

- `name`: 模块名称

**请求参数** (Query):

```typescript
{
  "force": boolean  // 是否强制删除（删除所有版本）
}
```

**响应示例**:

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

## 模块搜索接口

### 11. 搜索模块

**接口地址**: `GET /api/modules`

**是否需要认证**: 否

**请求参数** (Query):

```typescript
{
  "q": string,           // 搜索关键词，可选
  "author": string,      // 按作者筛选，可选
  "type": string,        // 按类型筛选: 'service' | 'microservice' | 'library'，可选
  "page": number,        // 页码，默认1
  "limit": number,       // 每页数量，默认20
  "sort": string         // 排序方式: 'name' | 'date' | 'downloads'，默认'date'
}
```

**响应示例**:

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

### 12. 获取热门模块

**接口地址**: `GET /api/modules/trending`

**是否需要认证**: 否

**请求参数** (Query):

```typescript
{
  "period": string,  // 时间段: 'day' | 'week' | 'month'，默认'week'
  "limit": number    // 返回数量，默认10
}
```

**响应示例**:

```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "author": "testuser",
      "downloads": 500,
      "downloadsChange": 25.5  // 增长百分比
    }
  ]
}
```

---

### 13. 按作者获取模块

**接口地址**: `GET /api/modules/by-author/:author`

**是否需要认证**: 否

**路径参数**:

- `author`: 作者用户名

**请求参数** (Query):

```typescript
{
  "page": number,   // 页码，默认1
  "limit": number   // 每页数量，默认20
}
```

**响应示例**:

```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "用户认证微服务",
      "latest": "1.0.0",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "author": {
    "username": "testuser",
    "moduleCount": 5
  }
}
```

---

## 统计接口

### 14. 获取全局统计信息

**接口地址**: `GET /api/stats`

**是否需要认证**: 否

**响应示例**:

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
        "count": 15
      },
      {
        "author": "developer",
        "count": 10
      }
    ],
    "topModules": [
      {
        "name": "auth-service",
        "downloads": 5000
      }
    ]
  }
}
```

---

### 15. 获取模块下载统计

**接口地址**: `GET /api/stats/modules/:name`

**是否需要认证**: 否

**路径参数**:

- `name`: 模块名称

**请求参数** (Query):

```typescript
{
  "period": string,  // 时间段: 'day' | 'week' | 'month' | 'year' | 'all'，默认'all'
  "byVersion": boolean  // 是否按版本分组，默认false
}
```

**响应示例**:

```json
{
  "success": true,
  "stats": {
    "module": "auth-service",
    "totalDownloads": 5000,
    "downloadsByPeriod": {
      "2024-01-01": 100,
      "2024-01-02": 150,
      // ...
    },
    "downloadsByVersion": {
      "1.0.0": 3000,
      "0.9.0": 2000
    }
  }
}
```

---

## 健康检查

### 16. 服务健康检查

**接口地址**: `GET /health`

**是否需要认证**: 否

**响应示例**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "storage": "available",
    "redis": "connected"
  }
}
```

---

## 错误码

### 认证错误 (AUTH_xxx)

| 错误码 | 说明 |
|--------|------|
| AUTH_001 | 邮箱已存在 |
| AUTH_002 | 用户名已存在 |
| AUTH_003 | 密码格式不正确 |
| AUTH_010 | 邮箱或密码错误 |
| AUTH_011 | 账户已被禁用 |
| AUTH_012 | Token无效或已过期 |
| AUTH_013 | Token格式错误 |
| AUTH_014 | 无权访问 |
| AUTH_020 | refresh_token无效或已过期 |

### OAuth2错误 (OAUTH_xxx)

| 错误码 | 说明 |
|--------|------|
| OAUTH_001 | 无效的client_id |
| OAUTH_002 | 无效的redirect_uri |
| OAUTH_003 | state验证失败 |
| OAUTH_004 | 授权被拒绝 |
| OAUTH_005 | code_challenge验证失败 |
| OAUTH_006 | 授权已过期 |

### 模块错误 (MODULE_xxx)

| 错误码 | 说明 |
|--------|------|
| MODULE_001 | 模块名称格式错误 |
| MODULE_002 | 版本号格式错误 |
| MODULE_003 | 同一模块已存在该版本 |
| MODULE_004 | 文件上传失败 |
| MODULE_005 | package.json解析失败 |
| MODULE_006 | module.config.json格式错误 |
| MODULE_010 | 模块不存在 |
| MODULE_011 | 版本不存在 |
| MODULE_012 | 无权限操作 |

### 服务器错误 (SERVER_xxx)

| 错误码 | 说明 |
|--------|------|
| SERVER_001 | 内部服务器错误 |
| SERVER_002 | 数据库连接失败 |
| SERVER_003 | 存储服务不可用 |
| SERVER_004 | 请求超时 |

---

## 数据模型

### User (用户)

```typescript
{
  "id": string,              // UUID
  "username": string,       // 用户名，唯一
  "email": string,          // 邮箱，唯一
  "avatar": string,         // 头像URL，可选
  "createdAt": string,      // ISO 8601日期
  "updatedAt": string       // ISO 8601日期
}
```

### Module (模块)

```typescript
{
  "name": string,           // 模块名称，必填，符合npm包名规范
  "description": string,    // 描述，可选
  "author": string,         // 作者用户名，从Token获取
  "uploadedBy": string,     // 上传者用户名
  "type": string,           // 类型: 'service' | 'microservice' | 'library'
  "appId": string,          // 应用ID，可选
  "teamId": string,         // 团队ID，可选
  "latest": string,         // 最新版本号
  "createdAt": string,     // 创建时间，ISO 8601
  "updatedAt": string,     // 更新时间，ISO 8601
  "downloads": number,      // 下载次数
  "versions": {             // 版本列表
    [version: string]: {
      "uploadedAt": string,  // 上传时间
      "size": number,        // 文件大小（字节）
      "sha256": string      // 文件哈希，用于完整性校验
    }
  }
}
```

### VersionInfo (版本信息)

```typescript
{
  "version": string,        // 版本号，符合语义化版本规范
  "uploadedAt": string,     // 上传时间
  "size": number,           // 文件大小（字节）
  "sha256": string          // 文件哈希
}
```

### Stats (统计信息)

```typescript
{
  "totalModules": number,       // 模块总数
  "totalVersions": number,     // 版本总数
  "totalSize": number,         // 总大小（字节）
  "totalDownloads": number,    // 总下载次数
  "topAuthors": Array<{        // 热门作者
    "author": string,
    "count": number
  }>,
  "topModules": Array<{        // 热门模块
    "name": string,
    "downloads": number
  }>
}
```

### Pagination (分页信息)

```typescript
{
  "page": number,        // 当前页码
  "limit": number,       // 每页数量
  "total": number,       // 总记录数
  "totalPages": number   // 总页数
}
```

---

## 特殊说明

### 1. 版本号规范

模块版本号必须遵循 [Semantic Versioning 2.0.0](https://semver.org/) 规范：

```
MAJOR.MINOR.PATCH

例如: 1.0.0, 2.1.3, 0.9.0-beta.1
```

### 2. 模块名称规范

模块名称必须遵循 npm 包名规范：

```
- 必须以字母开头
- 只能包含字母、数字、连字符(-)、下划线(_)
- 长度限制: 1-214字符
- 不能以 . 或 _ 开头

例如: my-module, auth_service, user-api
```

### 3. 文件格式要求

上传的 .tgz 文件必须包含以下文件：

```
package.json          # 必填，NPM包配置
module.config.json    # 必填，模块元数据
src/                  # 源代码目录
dist/                 # 编译输出（可选）
README.md             # 文档（可选）
```

**package.json 示例**:

```json
{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "用户认证微服务",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "rxjs": "^7.0.0"
  },
  "localModules": {}  // 本地模块依赖（可选）
}
```

**module.config.json 示例**:

```json
{
  "name": "auth-service",
  "description": "用户认证微服务",
  "version": "1.0.0",
  "type": "microservice",
  "appId": "",
  "teamId": "",
  "installedModules": {},
  "port": 3001
}
```

### 4. 文件完整性校验

为防止文件被篡改，上传时应计算SHA256哈希：

```typescript
import crypto from 'crypto';

function calculateHash(filePath: string): string {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}
```

下载后应验证文件完整性：

```typescript
function verifyHash(filePath: string, expectedHash: string): boolean {
  const actualHash = calculateHash(filePath);
  return actualHash === expectedHash;
}
```

### 5. 限流策略

为防止滥用，建议实现以下限流：

```typescript
// API限流
- 每个IP: 100请求/分钟
- 每个用户: 200请求/分钟
- 文件上传: 10次/分钟

// 文件大小限制
- 单个文件: 最大50MB
- 用户总存储: 10GB
```

### 6. 文件存储

建议使用对象存储服务（如S3、MinIO）存储模块文件：

```
存储路径结构:
modules/{module_name}/{version}/package.tgz
```

### 7. 数据库设计建议

**用户表 (users)**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**模块表 (modules)**

```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  name VARCHAR(214) NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id),
  type VARCHAR(20),
  app_id VARCHAR(100),
  team_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, author_id)
);
```

**模块版本表 (module_versions)**

```sql
CREATE TABLE module_versions (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(module_id, version)
);
```

**下载统计表 (download_stats)**

```sql
CREATE TABLE download_stats (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  version VARCHAR(50),
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (module_id, downloaded_at)
);
```

---

## 附录

### A. Postman Collection 示例

```json
{
  "info": {
    "name": "Pnce API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Register",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\"username\":\"test\",\"email\":\"test@example.com\",\"password\":\"password123\"}",
          "options": { "raw": { "language": "json" } }
        },
        "url": { "raw": "http://localhost:3000/api/auth/register" }
      }
    }
  ]
}
```

### B. cURL 示例

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

### C. Swagger/OpenAPI 规范

```yaml
openapi: 3.0.0
info:
  title: Pnce Module Registry API
  version: 1.0.0
  description: Pnce模块注册中心REST API

servers:
  - url: http://localhost:3000
    description: Development server

paths:
  /api/auth/register:
    post:
      summary: 用户注册
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: 注册成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  access_token:
                    type: string
                  user:
                    type: object
```

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本 |

---

**文档版本**: v1.0.0
**最后更新**: 2024-01-01
**维护者**: Pnce Team
