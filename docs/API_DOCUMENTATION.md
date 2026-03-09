# Pnce Module Registry - Backend API Documentation

> This document details all backend interfaces required by the Pnce CLI tool, for reference when developing the backend manually.

---

## Table of Contents

- [Overview](#overview)
- [General Specifications](#general-specifications)
- [Authentication Endpoints](#authentication-endpoints)
- [Module Management Endpoints](#module-management-endpoints)
- [Module Search Endpoints](#module-search-endpoints)
- [Statistics Endpoints](#statistics-endpoints)
- [Health Check](#health-check)
- [Error Codes](#error-codes)
- [Data Models](#data-models)

---

## Overview

### Basic Information

- **Base URL**: `http://localhost:3000` (configurable via environment variables)
- **API Version**: v1
- **Data Format**: JSON
- **Character Encoding**: UTF-8
- **Authentication**: Bearer Token (JWT)

### OAuth2 Configuration

- **Client ID**: `module-registry-cli`
- **Authorization Mode**: Authorization Code + PKCE
- **Callback Port**: 8765
- **Scope**: `read write`
- **Timeout**: 120 seconds

---

## General Specifications

### Unified Response Format

```typescript
// Success response
{
  "success": true,
  "data": {
    // Specific data
  },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "details": {}
}
```

### Authentication Method

Except for public endpoints, all endpoints require a Token in the request header:

```http
Authorization: Bearer <access_token>
```

### File Upload

Use `multipart/form-data` format to upload files:

```http
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
```

---

## Authentication Endpoints

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Authentication Required**: No

**Request Parameters**:

```typescript
{
  "username": string,  // Username, required
  "email": string,     // Email, required, unique
  "password": string   // Password, required, minimum 6 characters
}
```

**Response Example**:

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

**Error Codes**:
- `AUTH_001`: Email already exists
- `AUTH_002`: Username already exists
- `AUTH_003`: Password format incorrect

---

### 2. User Login (Email/Password)

**Endpoint**: `POST /api/auth/login`

**Authentication Required**: No

**Request Parameters**:

```typescript
{
  "email": string,     // Email, required
  "password": string   // Password, required
}
```

**Response Example**:

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

**Error Codes**:
- `AUTH_010`: Email or password incorrect
- `AUTH_011`: Account disabled

---

### 3. OAuth2 Authorization Page

**Endpoint**: `GET /authorize` (under website domain)

**Authentication Required**: No

**Request Parameters** (Query):

```typescript
{
  "response_type": "code",           // Fixed value
  "client_id": "module-registry-cli",
  "redirect_uri": string,            // Callback address, e.g.: http://localhost:8765/callback
  "code_challenge": string,           // PKCE challenge
  "code_challenge_method": "S256",   // Fixed value
  "state": string,                   // Random state value
  "scope": "read write"              // Permission scope
}
```

**Response**: Returns authorization page HTML

**Callback Format After Successful Authorization**:
```
http://localhost:8765/callback?code=<base64_encoded_data>&state=<state>
```

Where `code` is base64-encoded JSON with format:
```json
{
  "accessToken": "string",
  "user": {
    "username": "string",
    "email": "string"
  }
}
```

**Error Codes**:
- `OAUTH_001`: Invalid client_id
- `OAUTH_002`: Invalid redirect_uri
- `OAUTH_003`: State validation failed

---

### 4. Get Current User Information

**Endpoint**: `GET /api/auth/me`

**Authentication Required**: Yes

**Response Example**:

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

### 5. Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Authentication Required**: No (uses refresh_token)

**Request Parameters**:

```typescript
{
  "refresh_token": string  // Refresh token
}
```

**Response Example**:

```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new_refresh_token"
}
```

**Error Codes**:
- `AUTH_020`: refresh_token invalid or expired

---

## Module Management Endpoints

### 6. Upload Module

**Endpoint**: `POST /api/modules/upload`

**Authentication Required**: Yes

**Request Method**: `multipart/form-data`

**Request Parameters**:

```
package: <binary file>       // .tgz file, required
name: string                 // Module name, required
version: string              // Version number, required
description: string          // Description, optional
appId: string                // Application ID, optional
teamId: string               // Team ID, optional
type: string                 // Type, optional: 'service' | 'microservice' | 'library'
```

**Request Example**:

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

User authentication microservice
------WebKitFormBoundary
Content-Disposition: form-data; name="type"

microservice
------WebKitFormBoundary--
```

**Response Example**:

```json
{
  "success": true,
  "message": "Module uploaded successfully",
  "module": {
    "name": "auth-service",
    "version": "1.0.0",
    "description": "User authentication microservice",
    "author": "testuser",
    "type": "microservice",
    "appId": "",
    "teamId": "",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "size": 102400
  }
}
```

**Error Codes**:
- `MODULE_001`: Module name format error
- `MODULE_002`: Version format error
- `MODULE_003`: Same module already has this version
- `MODULE_004`: File upload failed
- `MODULE_005`: package.json parsing failed
- `MODULE_006`: module.config.json format error

---

### 7. Get Module Information

**Endpoint**: `GET /api/modules/:name`

**Authentication Required**: No

**Path Parameters**:

- `name`: Module name

**Response Example**:

```json
{
  "success": true,
  "module": {
    "name": "auth-service",
    "description": "User authentication microservice",
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

**Error Codes**:
- `MODULE_010`: Module does not exist

---

### 8. Download Module

**Endpoint**: `GET /api/modules/:name/:version/download`

**Authentication Required**: Yes

**Path Parameters**:

- `name`: Module name
- `version`: Version number

**Response**: Binary file stream (.tgz)

**Response Headers**:

```http
Content-Type: application/gzip
Content-Disposition: attachment; filename="auth-service-1.0.0.tgz
Content-Length: 102400
```

**Error Codes**:
- `MODULE_010`: Module does not exist
- `MODULE_011`: Version does not exist

---

### 9. Delete Module Version

**Endpoint**: `DELETE /api/modules/:name/:version`

**Authentication Required**: Yes

**Path Parameters**:

- `name`: Module name
- `version`: Version number

**Response Example**:

```json
{
  "success": true,
  "message": "Version deleted successfully"
}
```

**Error Codes**:
- `MODULE_010`: Module does not exist
- `MODULE_011`: Version does not exist
- `MODULE_012`: No permission to delete

---

### 10. Delete Entire Module

**Endpoint**: `DELETE /api/modules/:name`

**Authentication Required**: Yes

**Path Parameters**:

- `name`: Module name

**Request Parameters** (Query):

```typescript
{
  "force": boolean  // Whether to force delete (delete all versions)
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Module deleted successfully"
}
```

**Error Codes**:
- `MODULE_010`: Module does not exist
- `MODULE_012`: No permission to delete

---

## Module Search Endpoints

### 11. Search Modules

**Endpoint**: `GET /api/modules`

**Authentication Required**: No

**Request Parameters** (Query):

```typescript
{
  "q": string,           // Search keyword, optional
  "author": string,      // Filter by author, optional
  "type": string,        // Filter by type: 'service' | 'microservice' | 'library', optional
  "page": number,        // Page number, default 1
  "limit": number,       // Items per page, default 20
  "sort": string         // Sort order: 'name' | 'date' | 'downloads', default 'date'
}
```

**Response Example**:

```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "User authentication microservice",
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

### 12. Get Trending Modules

**Endpoint**: `GET /api/modules/trending`

**Authentication Required**: No

**Request Parameters** (Query):

```typescript
{
  "period": string,  // Time period: 'day' | 'week' | 'month', default 'week'
  "limit": number    // Return count, default 10
}
```

**Response Example**:

```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "User authentication microservice",
      "author": "testuser",
      "downloads": 500,
      "downloadsChange": 25.5  // Growth percentage
    }
  ]
}
```

---

### 13. Get Modules by Author

**Endpoint**: `GET /api/modules/by-author/:author`

**Authentication Required**: No

**Path Parameters**:

- `author`: Author username

**Request Parameters** (Query):

```typescript
{
  "page": number,   // Page number, default 1
  "limit": number   // Items per page, default 20
}
```

**Response Example**:

```json
{
  "success": true,
  "modules": [
    {
      "name": "auth-service",
      "description": "User authentication microservice",
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

## Statistics Endpoints

### 14. Get Global Statistics

**Endpoint**: `GET /api/stats`

**Authentication Required**: No

**Response Example**:

```json
{
  "success": true,
  "stats": {
    "totalModules": 150,
    "totalVersions": 450,
    "totalSize": 1073741824,  // Bytes
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

### 15. Get Module Download Statistics

**Endpoint**: `GET /api/stats/modules/:name`

**Authentication Required**: No

**Path Parameters**:

- `name`: Module name

**Request Parameters** (Query):

```typescript
{
  "period": string,  // Time period: 'day' | 'week' | 'month' | 'year' | 'all', default 'all'
  "byVersion": boolean  // Whether to group by version, default false
}
```

**Response Example**:

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

## Health Check

### 16. Service Health Check

**Endpoint**: `GET /health`

**Authentication Required**: No

**Response Example**:

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

## Error Codes

### Authentication Errors (AUTH_xxx)

| Error Code | Description |
|-----------|-------------|
| AUTH_001 | Email already exists |
| AUTH_002 | Username already exists |
| AUTH_003 | Password format incorrect |
| AUTH_010 | Email or password incorrect |
| AUTH_011 | Account disabled |
| AUTH_012 | Token invalid or expired |
| AUTH_013 | Token format error |
| AUTH_014 | No access permission |
| AUTH_020 | refresh_token invalid or expired |

### OAuth2 Errors (OAUTH_xxx)

| Error Code | Description |
|-----------|-------------|
| OAUTH_001 | Invalid client_id |
| OAUTH_002 | Invalid redirect_uri |
| OAUTH_003 | State validation failed |
| OAUTH_004 | Authorization denied |
| OAUTH_005 | code_challenge validation failed |
| OAUTH_006 | Authorization expired |

### Module Errors (MODULE_xxx)

| Error Code | Description |
|-----------|-------------|
| MODULE_001 | Module name format error |
| MODULE_002 | Version format error |
| MODULE_003 | Same module already has this version |
| MODULE_004 | File upload failed |
| MODULE_005 | package.json parsing failed |
| MODULE_006 | module.config.json format error |
| MODULE_010 | Module does not exist |
| MODULE_011 | Version does not exist |
| MODULE_012 | No permission to operate |

### Server Errors (SERVER_xxx)

| Error Code | Description |
|-----------|-------------|
| SERVER_001 | Internal server error |
| SERVER_002 | Database connection failed |
| SERVER_003 | Storage service unavailable |
| SERVER_004 | Request timeout |

---

## Data Models

### User

```typescript
{
  "id": string,              // UUID
  "username": string,       // Username, unique
  "email": string,          // Email, unique
  "avatar": string,         // Avatar URL, optional
  "createdAt": string,      // ISO 8601 date
  "updatedAt": string       // ISO 8601 date
}
```

### Module

```typescript
{
  "name": string,           // Module name, required, follows npm package naming convention
  "description": string,    // Description, optional
  "author": string,         // Author username, obtained from Token
  "uploadedBy": string,     // Uploader username
  "type": string,           // Type: 'service' | 'microservice' | 'library'
  "appId": string,          // Application ID, optional
  "teamId": string,         // Team ID, optional
  "latest": string,         // Latest version number
  "createdAt": string,     // Creation time, ISO 8601
  "updatedAt": string,     // Update time, ISO 8601
  "downloads": number,      // Download count
  "versions": {             // Version list
    [version: string]: {
      "uploadedAt": string,  // Upload time
      "size": number,        // File size (bytes)
      "sha256": string      // File hash, for integrity verification
    }
  }
}
```

### VersionInfo

```typescript
{
  "version": string,        // Version number, follows semantic versioning
  "uploadedAt": string,     // Upload time
  "size": number,           // File size (bytes)
  "sha256": string          // File hash
}
```

### Stats

```typescript
{
  "totalModules": number,       // Total modules
  "totalVersions": number,     // Total versions
  "totalSize": number,         // Total size (bytes)
  "totalDownloads": number,    // Total downloads
  "topAuthors": Array<{        // Top authors
    "author": string,
    "count": number
  }>,
  "topModules": Array<{        // Top modules
    "name": string,
    "downloads": number
  }>
}
```

### Pagination

```typescript
{
  "page": number,        // Current page number
  "limit": number,       // Items per page
  "total": number,       // Total records
  "totalPages": number   // Total pages
}
```

---

## Special Notes

### 1. Version Number Specification

Module version numbers must follow [Semantic Versioning 2.0.0](https://semver.org/) specification:

```
MAJOR.MINOR.PATCH

Example: 1.0.0, 2.1.3, 0.9.0-beta.1
```

### 2. Module Name Specification

Module names must follow npm package naming convention:

```
- Must start with a letter
- Can only contain letters, numbers, hyphens (-), underscores (_)
- Length limit: 1-214 characters
- Cannot start with . or _

Example: my-module, auth_service, user-api
```

### 3. File Format Requirements

Uploaded .tgz files must contain the following files:

```
package.json          # Required, NPM package configuration
module.config.json    # Required, module metadata
src/                  # Source code directory
dist/                 # Build output (optional)
README.md             # Documentation (optional)
```

**package.json Example**:

```json
{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "User authentication microservice",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "rxjs": "^7.0.0"
  },
  "localModules": {}  // Local module dependencies (optional)
}
```

**module.config.json Example**:

```json
{
  "name": "auth-service",
  "description": "User authentication microservice",
  "version": "1.0.0",
  "type": "microservice",
  "appId": "",
  "teamId": "",
  "installedModules": {},
  "port": 3001
}
```

### 4. File Integrity Verification

To prevent file tampering, calculate SHA256 hash during upload:

```typescript
import crypto from 'crypto';

function calculateHash(filePath: string): string {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}
```

Verify file integrity after download:

```typescript
function verifyHash(filePath: string, expectedHash: string): boolean {
  const actualHash = calculateHash(filePath);
  return actualHash === expectedHash;
}
```

### 5. Rate Limiting Strategy

To prevent abuse, implement the following rate limits:

```typescript
// API rate limiting
- Per IP: 100 requests/minute
- Per user: 200 requests/minute
- File uploads: 10 times/minute

// File size limits
- Single file: Maximum 50MB
- User total storage: 10GB
```

### 6. File Storage

Recommend using object storage services (like S3, MinIO) to store module files:

```
Storage path structure:
modules/{module_name}/{version}/package.tgz
```

### 7. Database Design Recommendations

**User Table (users)**

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

**Module Table (modules)**

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

**Module Version Table (module_versions)**

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

**Download Statistics Table (download_stats)**

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

## Appendix

### A. Postman Collection Example

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

### B. cURL Examples

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Upload module
curl -X POST http://localhost:3000/api/modules/upload \
  -H "Authorization: Bearer <token>" \
  -F "package=@module-1.0.0.tgz" \
  -F "name=auth-service" \
  -F "version=1.0.0" \
  -F "description=Auth microservice"

# Get module info
curl http://localhost:3000/api/modules/auth-service

# Download module
curl -O -J http://localhost:3000/api/modules/auth-service/1.0.0/download \
  -H "Authorization: Bearer <token>"
```

### C. Swagger/OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Pnce Module Registry API
  version: 1.0.0
  description: Pnce module registry REST API

servers:
  - url: http://localhost:3000
    description: Development server

paths:
  /api/auth/register:
    post:
      summary: User registration
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
          description: Registration successful
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

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-01-01 | Initial version |

---

**Document Version**: v1.0.0
**Last Updated**: 2024-01-01
**Maintainer**: Pnce Team
