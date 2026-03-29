# Environment Variable Management

This service supports dynamic environment variable configuration.

## Features

- **Dynamic Updates**: Modify environment variables via API or `.env` file
- **Auto Reload**: Changes are automatically applied without restart
- **Smart Restart**: Service restarts automatically when `PORT`, `NODE_ENV`, or `APP_HOST` changes

## Quick Usage

### Get All Variables

```bash
GET /api/env
```

### Update Variable

```bash
POST /api/env/set
Content-Type: application/json

{
  "key": "VAR_NAME",
  "value": "new_value"
}
```

### Batch Update

```bash
POST /api/env/batch
Content-Type: application/json

{
  "VAR1": "value1",
  "VAR2": "value2"
}
```

## Notes

- Changes to `PORT`, `NODE_ENV`, or `APP_HOST` will trigger automatic service restart
- Other changes take effect immediately
- All changes are persisted to `.env` file

For detailed API documentation, see the full API docs.
