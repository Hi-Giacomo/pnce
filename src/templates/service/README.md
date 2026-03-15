# Service

NestJS-based modular service template with microservice architecture.

## Features

- Modular architecture design
- Dynamic environment variable management
- Hot reload support (development mode)
- CORS cross-origin support
- Automatic environment file monitoring
- Graceful shutdown handling (SIGTERM/SIGINT)

## Installation

```bash
# Using npm
npm install

# Using yarn
yarn install
```

## Running

```bash
# Development mode (with hot reload)
npm run dev

# Development mode (specify environment)
npm run dev:main

# Production mode
npm run build
npm run start:prod
```

## Building

```bash
npm run build
```

## Project Structure

```
service/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.config.ts # Environment variable configuration
│   │   └── index.ts     # Configuration entry
│   ├── modules/          # Business modules
│   │   └── env/        # Environment management module
│   │       ├── env.module.ts
│   │       ├── env.controller.ts
│   │       ├── env.service.ts
│   │       └── env.dto.ts
│   ├── main.ts           # Application entry point
│   └── app.module.ts     # Root module
├── .env                # Environment variables (created automatically)
├── .env.example         # Environment variable template
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── nest-cli.json       # Nest CLI configuration
└── README.md            # Project documentation
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
APP_HOST=localhost

# Database Configuration (optional)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=service_db

# API Configuration (optional)
API_PREFIX=/api
API_VERSION=v1
```

## API Documentation

See [ENV_API.md](docs/ENV_API.md) for API endpoint documentation.

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## License

[Your License]
