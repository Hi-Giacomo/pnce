# Environment Variable Management API

This service provides dynamic environment variable management, supporting configuration changes through API endpoints or direct editing of `.env` file. Changes are automatically monitored and applied without requiring manual service restart.

## Table of Contents

- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Restart Mechanism](#restart-mechanism)
- [Notes](#notes)

---

## Features

### 1. Dynamic Configuration Updates
- ✅ Real-time environment variable modification via API endpoints
- ✅ Direct `.env` file editing with automatic effect
- ✅ Changes are immediately written to file and persistently saved
- ✅ Configuration changes are automatically synchronized to `process.env`

### 2. Intelligent Restart Mechanism
- 🚀 Automatic graceful service restart when `PORT`, `NODE_ENV`, or `APP_HOST` is modified
- 🚀 Asynchronous restart execution, not blocking current requests
- 🚀 Other configuration changes take effect immediately without restart
- 🚀 Restart time approximately 1-2 seconds

### 3. Automatic File Monitoring
- 📂 Automatic monitoring of any modifications to `.env` file
- 🔄 Real-time detection of file changes
- ⚡ Instant application of changes to service

---

## API Endpoints

### Get All Environment Variables

```http
GET /api/env
```

**Response:**
```json
{
  "success": true,
  "data": {
    "PORT": "3000",
    "NODE_ENV": "development",
    "APP_HOST": "localhost"
  }
}
```

### Get Single Environment Variable

```http
GET /api/env/:key
```

**Parameters:**
- `key` (path parameter): Environment variable name

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "PORT",
    "value": "3000"
  }
}
```

### Set Environment Variable

```http
POST /api/env
Content-Type: application/json
```

**Request Body:**
```json
{
  "key": "PORT",
  "value": "3001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Environment variable updated successfully",
  "data": {
    "key": "PORT",
    "value": "3001"
  }
}
```

### Set Multiple Environment Variables

```http
POST /api/env/batch
Content-Type: application/json
```

**Request Body:**
```json
{
  "variables": {
    "PORT": "3001",
    "NODE_ENV": "production",
    "APP_HOST": "0.0.0.0"
  }
}
```

**Response:**
```json
{
  "success": translationsue,
  "message": "Environment variables updated successfully",
  "data": {
    "updated": ["PORT", "NODE_ENV", "APP_HOST"]
  }
}
```

### Delete Environment Variable

```http
DELETE /api/env/:key
```

**Parameters:**
- `key` (path parameter): Environment variable name

**Response:**
```json
{
  "success": true,
  "message": "Environment variable deleted successfully",
  "data": {
    "key": "PORT"
  }
}
```

### Reload Configuration

```http
POST /api/env/reload
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration reloaded successfully"
}
```

---

## Usage

### Using cURL

```bash
# Get all environment variables
curl http://localhost:3000/api/env

# Get specific variable
curl http://localhost:3000/api/env/PORT

# Set environment variable
curl -X POST http://localhost:3000/api/env \
  -H "Content-Type: application/json" \
  -d '{"key":"PORT","value":"3001"}'

# Batch set variables
curl -X POST http://localhost:3000/api/env/batch \
  -H "Content-Type: application/json" \
  -d '{"variables":{"PORT":"3001","NODE_ENV":"production"}}'

# Delete environment variable
curl -X DELETE http://localhost:3000/api/env/PORT

# Reload configuration
curl -X POST http://localhost:3000/api/env/reload
```

### Using JavaScript/TypeScript

```typescript
// Get all variables
const response = await fetch('http://localhost:3000/api/env');
const data = await response.json();
console.log(data.data);

// Set variable
await fetch('http://localhost:3000/api/env', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'PORT', value: '3001' })
});
```

---

## Restart Mechanism

### Trigger Conditions

The service automatically restarts when the following environment variables are modified:

1. **PORT** - Service port
2. **NODE_ENV** - Environment mode (development/production)
3. **APP_HOST** - Service host address

### Restart Process

1. Gracefully close current server (stop accepting new requests)
2. Wait for existing requests to complete (up to 30 seconds)
3. Update `process.env` with new configuration
4. Restart server with new configuration
5. Log restart event

### Restart Safety

- ⚠️ In-progress requests are allowed to complete before restart
- ⚠️ Maximum wait time is 30 seconds
- ⚠️ If restart fails, service enters error state
- ⚠️ Check logs for detailed restart information

---

## Notes

### File Format

`.env` file format:

```env
# Comment lines start with #
PORT=3000
NODE_ENV=development
APP_HOST=localhost
```

### Data Types

- Environment variables are stored and returned as **strings**
- Numeric values should be converted manually in application code
- Boolean values should be represented as `"true"`/`"false"`

### Security

- 🔒 Do not commit `.env` file to version control
- 🔒 Add `.env` to `.gitignore`
- 🔒 Use environment variables for sensitive data (passwords, API keys)
- 🔒 Provide `.env.example` template file in repository

### Performance

- File monitoring uses efficient OS-level file watchers
- Configuration changes are applied instantly
- Restart only occurs when necessary (PORT, NODE_ENV, APP_HOST)
- Batch updates support prevents multiple restarts

### Troubleshooting

**Configuration not updating?**
1. Check `.env` file format (no extra spaces)
2. Verify file has read/write permissions
3. Check service logs for errors

**Service not restarting after PORT change?**
1. Verify new PORT is not in use
2. Check firewall settings
3. Review restart logs for error messages

---

## Error Codes

| Code | Description |
|-------|-------------|
| `CONFIG_NOT_FOUND` | Configuration file not found |
| `INVALID_KEY` | Invalid environment variable name |
| `READ_ONLY` | Configuration is read-only |
| `UPDATE_FAILED` | Failed to update configuration |
| `RESTART_FAILED` | Failed to restart service |

---

## Support

For issues or questions, please refer to:
- Service documentation
- API logs
- System logs for detailed error information
