# PNCE BackendInterface

> DocumentationBackendInterface，FeatureImplementation。

---

## 📋 Overview

### Configure

- **Base URL**: `http://localhost:3000` (Variable `PNCE_API_SERVER` Configure)
- **APIversion**: v1
- **DataFormat**: JSON
- **Encoding**: UTF-8
- **Auth**: Bearer Token (JWT)

### OAuth2 Configure

- **Client ID**: `module-registry-cli`
- **Authorization**: Authorization Code + PKCE
- **CallbackPort**: 8765 (Variable `PNCE_OAUTH_PORT` Configure)
- **Authorization**: `http://localhost:5173/authorize` (Variable `PNCE_OAUTH_ENDPOINT` Configure)
- **Scope**: `read write`
- **Timeout**: 120

### Stacksuggestion

- **BackendFramework**: NestJS / Express / Fastify
- **DataLibrary**: PostgreSQL / MySQL / MongoDB
- **Object**: AWS S3 / MinIO / OSS
- **Cache**: Redis
- **Auth**: JWT + OAuth2

---

## 🔐 AuthInterface（5）

### 1. userRegister

```typescript
POST /api/auth/register
```

**Yes/NoAuth**: No

**Please**:
```http
Content-Type: application/json
```

**Please**:
```typescript
{
  username: string;  // user，，Unique
  email: string;     // ，，Unique
  password: string;  // ，，6
}
```

**SuccessResponse**:
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

**ErrorResponse**:
```json
{
  "success": false,
  "message": "already exists",
  "errorCode": "AUTH_001"
}
```

**Error**:
- `AUTH_001`: already exists
- `AUTH_002`: useralready exists
- `AUTH_003`: Format

---

### 2. userLogin（）

```typescript
POST /api/auth/login
```

**Yes/NoAuth**: No

**Please**:
```typescript
{
  email: string;     // ，
  password: string;  // ，
}
```

**SuccessResponse**:
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

**Error**:
- `AUTH_010`: Error
- `AUTH_011`: Disable

---

### 3. GetCurrentuserInfo

```typescript
GET /api/auth/me
```

**Yes/NoAuth**: Yes

**Please**:
```http
Authorization: Bearer <access_token>
```

**SuccessResponse**:
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

### 4. RefreshToken

```typescript
POST /api/auth/refresh
```

**Yes/NoAuth**: No（Use refresh_token）

**Please**:
```typescript
{
  refresh_token: string;  // RefreshToken
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new_refresh_token"
}
```

**Error**:
- `AUTH_020`: refresh_token invalid

---

### 5. user

```typescript
POST /api/auth/logout
```

**Yes/NoAuth**: Yes

**Please**:
```http
Authorization: Bearer <access_token>
```

**SuccessResponse**:
```json
{
  "success": true,
  "message": "Success"
}
```

---

### 🔐 OAuth2 AuthorizationInterface

### 6. OAuth2 Authorization

```typescript
GET /authorize
```

**Instructions**: Interface（ `http://localhost:5173/authorize`）， API service

**Yes/NoAuth**: No

**PleaseArgument** (Query):
```typescript
{
  response_type: string;           // Value "code"
  client_id: string;               // Value "module-registry-cli"
  redirect_uri: string;            // CallbackURL，: http://localhost:8765/callback
  code_challenge: string;          // PKCE challenge (base64url)
  code_challenge_method: string;   // Value "S256"
  state: string;                   // RandomStatusValue， CSRF
  scope: string;                   // Value "read write"
}
```

**Response**: ReturnAuthorization HTML

**AuthorizationSuccessCallbackFormat**:
```
http://localhost:8765/callback?code=<base64_encoded_data>&state=<state>
```

Medium `code` Yes base64 Encoding JSON：
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

**Error**:
- `OAUTH_001`: invalid client_id
- `OAUTH_002`: invalid redirect_uri
- `OAUTH_003`: state ValidateFailure
- `OAUTH_004`: Authorization
- `OAUTH_005`: code_challenge ValidateFailure
- `OAUTH_006`: Authorization

---

## 📦 moduleManageInterface（6）

### 7. Uploadmodule

```typescript
POST /api/modules/upload
```

**Yes/NoAuth**: Yes

**Please**:
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Please** (FormData):
```typescript
{
  package: file;         // ..tgz file file，
  name: string;         // moduleName，
  version: string;      // version，（ "1.0.0"）
  description?: string; // Description，Optional
  appId?: string;       // ApplicationID，Optional
  teamId?: string;      // TeamID，Optional
  type?: string;        // Type: 'service' | 'microservice' | 'library'，Default 'library'
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "message": "moduleUploadSuccess",
  "module": {
    "name": "auth-service",
    "version": "1.0.0",
    "description": "userAuthservice",
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

**Error**:
- `MODULE_001`: moduleNameFormatError
- `MODULE_002`: versionFormatError
- `MODULE_003`: modulealready existsversion
- `MODULE_004`: fileUploadFailure
- `MODULE_005`: package.json Failure
- `MODULE_006`: module.config.json FormatError

**fileFormat**:
Upload ..tgz file fileRequiredPackage：
```
package.json          # 
module.config.json    # 
src/                  # CodeDirectory
dist/                 # CompileOutput（Optional）
README.md             # Documentation（Optional）
```

---

### 8. Getmodule information

```typescript
GET /api/modules/:name
```

**Yes/NoAuth**: No

**PathArgument**:
```typescript
name: string;  // moduleName
```

**SuccessResponse**:
```json
{
  "success": true,
  "module": {
    "name": "auth-service",
    "description": "userAuthservice",
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

**Error**:
- `MODULE_010`: moduledoes not exist

---

### 9. Downloadmodule

```typescript
GET /api/modules/:name/:version/download
```

**Yes/NoAuth**: Yes

**PathArgument**:
```typescript
name: string;     // moduleName
version: string;   // version
```

**Response**: file (..tgz file)

**Response**:
```http
Content-Type: application/gzip
Content-Disposition: attachment; filename="auth-service-1.0.0..tgz file"
Content-Length: 102400
X-SHA256: abc123...
```

**Error**:
- `MODULE_010`: moduledoes not exist
- `MODULE_011`: versiondoes not exist

---

### 10. Deletemoduleversion

```typescript
DELETE /api/modules/:name/:version
```

**Yes/NoAuth**: Yes

**PathArgument**:
```typescript
name: string;     // moduleName
version: string;  // version
```

**SuccessResponse**:
```json
{
  "success": true,
  "message": "versionDeleteSuccess"
}
```

**Error**:
- `MODULE_010`: moduledoes not exist
- `MODULE_011`: versiondoes not exist
- `MODULE_012`: PermissionDelete（moduleOwner）

---

### 11. Deletemodule

```typescript
DELETE /api/modules/:name
```

**Yes/NoAuth**: Yes

**PathArgument**:
```typescript
name: string;  // moduleName
```

**Argument** (Query):
```typescript
{
  force?: boolean;  // Yes/NoDeleteversion，Default false
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "message": "moduleDeleteSuccess"
}
```

**Error**:
- `MODULE_010`: moduledoes not exist
- `MODULE_012`: PermissionDelete

---

### 12. Updatemodule information

```typescript
PUT /api/modules/:name
```

**Yes/NoAuth**: Yes

**PathArgument**:
```typescript
name: string;  // moduleName
```

**Please**:
```typescript
{
  description?: string;  // Description
  type?: string;        // Type
  appId?: string;        // ApplicationID
  teamId?: string;      // TeamID
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "message": "module informationUpdateSuccess",
  "module": {
    "name": "auth-service",
    "description": "Description",
    // ... 
  }
}
```

**Error**:
- `MODULE_010`: moduledoes not exist
- `MODULE_012`: PermissionUpdate

---

## 🔍 moduleSearchInterface（4）

### 13. Searchmodule

```typescript
GET /api/modules
```

**Yes/NoAuth**: No

**Argument** (Query):
```typescript
{
  q?: string;        // SearchKey，Optional
  author?: string;   // Author，Optional
  type?: string;     // Type: 'service' | 'microservice' | 'library'，Optional
  page?: number;     // ，Default 1
  limit?: number;    // Count，Default 20， 100
  sort?: string;     // Sort: 'name' | 'date' | 'downloads'，Default 'date'
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "userAuthservice",
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

### 14. Getmodule

```typescript
GET /api/modules/trending
```

**Yes/NoAuth**: No

**Argument** (Query):
```typescript
{
  period?: string;  // : 'day' | 'week' | 'month'，Default 'week'
  limit?: number;   // ReturnCount，Default 10， 50
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "userAuthservice",
      "author": "testuser",
      "latest": "1.0.0",
      "type": "microservice",
      "downloads": 500,
      "downloadsChange": 25.5  // 
    }
  ]
}
```

---

### 15. AuthorGetmodule

```typescript
GET /api/modules/by-author/:author
```

**Yes/NoAuth**: No

**PathArgument**:
```typescript
author: string;  // Authoruser
```

**Argument** (Query):
```typescript
{
  page?: number;   // ，Default 1
  limit?: number;  // Count，Default 20
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "userAuthservice",
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

### 16. Getmodule list

```typescript
GET /api/modules/list
```

**Yes/NoAuth**: No

**Argument** (Query):
```typescript
{
  page?: number;   // ，Default 1
  limit?: number;  // Count，Default 20， 100
}
```

**SuccessResponse**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "userAuthservice",
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

## 📊 StatisticsInterface（2）

### 17. GetGlobalStatisticsInfo

```typescript
GET /api/stats
```

**Yes/NoAuth**: No

**SuccessResponse**:
```json
{
  "success": true,
  "stats": {
    "totalModules": 150,
    "totalversions": 450,
    "totalSize": 1073741824,  // Section
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

### 18. GetmoduleDownloadStatistics

```typescript
GET /api/stats/modules/:name
```

**Yes/NoAuth**: No

**PathArgument**:
```typescript
name: string;  // moduleName
```

**Argument** (Query):
```typescript
{
  period?: string;     // : 'day' | 'week' | 'month' | 'year' | 'all'，Default 'all'
  byversion?: boolean; // Yes/NoversionGroup，Default false
}
```

**SuccessResponse**:
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
    "downloadsByversion": {
      "1.0.0": 3000,
      "0.9.0": 2000
    }
  }
}
```

---

## ❤️ checkInterface（1）

### 19. servicecheck

```typescript
GET /health
```

**Yes/NoAuth**: No

**SuccessResponse**:
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
  "uptime": 86400  // Run（）
}
```

---

## ❌ ErrorList

### AuthError (AUTH_xxx)

| Error | Instructions | HTTP Status |
|--------|------|-------------|
| AUTH_001 | already exists | 409 |
| AUTH_002 | useralready exists | 409 |
| AUTH_003 | Format | 400 |
| AUTH_010 | Error | 401 |
| AUTH_011 | Disable | 403 |
| AUTH_012 | Token invalid | 401 |
| AUTH_013 | Token FormatError | 401 |
| AUTH_014 |  | 403 |
| AUTH_020 | refresh_token invalid | 401 |

### OAuth2 Error (OAUTH_xxx)

| Error | Instructions | HTTP Status |
|--------|------|-------------|
| OAUTH_001 | invalid client_id | 400 |
| OAUTH_002 | invalid redirect_uri | 400 |
| OAUTH_003 | state ValidateFailure | 403 |
| OAUTH_004 | Authorization | 403 |
| OAUTH_005 | code_challenge ValidateFailure | 403 |
| OAUTH_006 | Authorization | 410 |

### moduleError (MODULE_xxx)

| Error | Instructions | HTTP Status |
|--------|------|-------------|
| MODULE_001 | moduleNameFormatError | 400 |
| MODULE_002 | versionFormatError | 400 |
| MODULE_003 | modulealready existsversion | 409 |
| MODULE_004 | fileUploadFailure | 500 |
| MODULE_005 | package.json Failure | 400 |
| MODULE_006 | module.config.json FormatError | 400 |
| MODULE_010 | moduledoes not exist | 404 |
| MODULE_011 | versiondoes not exist | 404 |
| MODULE_012 | Permission | 403 |

### serviceError (SERVER_xxx)

| Error | Instructions | HTTP Status |
|--------|------|-------------|
| SERVER_001 | serviceError | 500 |
| SERVER_002 | DataLibraryConnectionFailure | 503 |
| SERVER_003 | service | 503 |
| SERVER_004 | PleaseTimeout | 504 |

---

## 🗄️ DataLibrary

### user (users)

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

### module (modules)

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

### moduleversion (module_versions)

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

### DownloadStatistics (download_stats)

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

### RefreshToken (refresh_tokens)

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

## 📦 file

### ObjectPath

```
modules/
  ├── {module_name}/
  │   ├── {version}/
  │   │   ├── package..tgz file
  │   │   └── metadata.json
  └── ...
```

### fileValidate

UploadfileCalculate SHA256 ：
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

## 🔒 Security

### 1. Encrypt

Use bcrypt Encrypt，Value ≥ 10：
```typescript
import bcrypt from 'bcrypt';

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 2. JWT Token

- Access Token valid：1
- Refresh Token valid：7
- Use RS256 Signature

### 3. fileUploadLimitation

- file：50MB
- fileType：..tgz file
- fileSizeValidate
- fileTypeValidate

### 4. 

```typescript
// API 
-  IP: 100 Please/
- user: 200 Please/
- fileUpload: 10 /

// Limitation
- file:  50MB
- user: 10GB
```

---

## ✅ check

### Feature

- [ ] userRegister
- [ ] userLogin
- [ ] OAuth2 Authorization
- [ ] Token Refresh
- [ ] user
- [ ] GetuserInfo

### moduleManage

- [ ] Uploadmodule
- [ ] Getmodule information
- [ ] Downloadmodule
- [ ] Deletemoduleversion
- [ ] Deletemodule
- [ ] Updatemodule information

### moduleSearch

- [ ] Searchmodule
- [ ] Getmodule
- [ ] AuthorGetmodule
- [ ] Getmodule list

### StatisticsFeature

- [ ] GlobalStatistics
- [ ] moduleDownloadStatistics

### SystemFeature

- [ ] check
- [ ] ErrorHandle
- [ ] LogRecord
- [ ] PerformanceMonitor

### SecurityFeature

- [ ] Encrypt
- [ ] JWT Auth
- [ ] OAuth2 Authorization
- [ ] 
- [ ] fileValidate

### DocumentationTest

- [ ] API Documentation（Swagger）
- [ ] UnitTest
- [ ] Test
- [ ] DeployDocumentation

---

## 🚀 Deploy

### Variable

```bash
# serviceConfigure
PORT=3000
NODE_ENV=production

# DataLibraryConfigure
DATABASE_URL=postgresql://user:password@localhost:5432/pnce

# JWT Configure
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# ObjectConfigure
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=module-registry
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Redis Configure
REDIS_URL=redis://localhost:6379

# OAuth2 Configure
OAUTH_CLIENT_ID=module-registry-cli
OAUTH_REDIRECT_URI=http://localhost:8765/callback

# Configure
RATE_LIMIT_WINDOW=60000  # 1
RATE_LIMIT_MAX=100        # Please

# fileUploadConfigure
MAX_FILE_SIZE=52428800    # 50MB
USER_MAX_STORAGE=10737418240  # 10GB
```

---

## 📝 API TestUtility

### Postman Collection

suggestionCreate Postman Collection InterfaceTest，Package 19 InterfaceExample。

### cURL Example

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Uploadmodule
curl -X POST http://localhost:3000/api/modules/upload \
  -H "Authorization: Bearer <token>" \
  -F "package=@module-1.0.0..tgz file" \
  -F "name=auth-service" \
  -F "version=1.0.0" \
  -F "description=Auth microservice"

# Getmodule information
curl http://localhost:3000/api/modules/auth-service

# Downloadmodule
curl -O -J http://localhost:3000/api/modules/auth-service/1.0.0/download \
  -H "Authorization: Bearer <token>"
```

---

**Documentationversion**: v1.0.0
**Update**: 2024-03-06
****: PNCE Team

！🎉
