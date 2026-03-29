import { Command } from 'commander';
import { CLI_VERSION } from '../config/default.config';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Register help commands
 */
export function registerHelpCommand(program: Command): void {
  program
    .command('help')
    .alias('h')
    .description('Display comprehensive help information')
    .option('-v, --verbose', 'Show verbose help information')
    .action((options) => {
      if (options.verbose) {
        showVerboseHelp();
      } else {
        showBasicHelp();
      }
    });

  // Add quick help for common tasks
  program
    .command('quickstart')
    .description('Show quick start guide')
    .action(() => {
      showQuickStart();
    });
}

/**
 * Show basic help information
 */
function showBasicHelp(): void {
  logger.info('Displaying basic help information.');
  console.log(`
╭───────────────────────────────────────────────────────────╮
│                                                  │
│  PNCE CLI v${CLI_VERSION} - Quick Help            │
│                                                  │
│  Most Common Commands:                          │
│                                                  │
│  🚀 pnce init <name>                     │
│     Create a new service or microservice         │
│                                                  │
│  📦 pnce init <name> -t ms               │
│     Create a microservice (nested)             │
│                                                  │
│  🔧 pnpm install                           │
│     Install all dependencies recursively          │
│                                                  │
│  🏃 pnpm run dev                          │
│     Start development server with auto-reload   │
│                                                  │
│  📋 pnce list                             │
│     List all installed modules                │
│                                                  │
│  ⚙️  pnce set <key> <value>               │
│     Set configuration value                  │
│                                                  │
│  📚 pnce help --verbose                     │
│     Show detailed help information           │
│                                                  │
╰───────────────────────────────────────────────────╯

Examples:
  pnce init my-service                    Create a new service
  pnce init my-microservice -t ms          Create a new microservice
  pnce set lang en                        Set language preference
  pnce alias add ls="list -a"           Add command alias
  pnce port kill 3000                    Kill processes on port 3000
  pnce pka                               Kill all PNCE port processes
  pnce health                             Check all services health
  pnce health:monitor                     Start continuous monitoring
  pnce gateway --port 8080                Start API Gateway on port 8080
  pnce gateway:routes --list               List all gateway routes
  pnce config:reload --watch              Start configuration hot reload
  pnce config:watch --files .env,package.json    Watch specific files
  pnce logs --limit 50 --level error        Show last 50 error logs
  pnce logs:tail --service user-service   Tail logs from specific service
  pnce logs:search "database error"        Search logs for specific content

Need more help? Run: pnce help --verbose
  `);
}

/**
 * Show verbose help information
 */
function showVerboseHelp(): void {
  logger.info('Displaying verbose help information.');
  console.log(`
╭───────────────────────────────────────────────────────────╮
│                                                  │
│  PNCE CLI v${CLI_VERSION} - Complete Help         │
│                                                  │
│  CORE COMMANDS                                  │
│                                                  │
│  Service & Microservice Management:               │
│  • init <name> [-t ms]                 │
│      Create new service or microservice         │
│      Options:                              │
│        -t, --type    Service type (service|ms) │
│        -p, --port     Custom port (auto-assigned if not specified) │
│                                                  │
│  Dependency Management:                         │
│  • install [directory]                   │
│      Install all dependencies recursively     │
│  • list                                 │
│      List all installed modules           │
│                                                  │
│  Configuration:                               │
│  • set <key> <value>                   │
│      Set configuration value            │
│  • get <key>                           │
│      Get configuration value            │
│  • config                              │
│      Show all configuration           │
│  • config:reload --watch                 │
│      Start configuration hot reload   │
│  • config:watch                        │
│      Watch configuration files         │
│  • config:reload --reload              │
│      Trigger configuration reload       │
│  • config:reload --stats                │
│      Show reload statistics            │
│                                                  │
│  Development Tools:                             │
│  • dev                                 │
│      Start development server           │
│  • build                               │
│      Build for production              │
│  • clean                               │
│      Clean build artifacts             │
│  • health                              │
│      Check service health status        │
│  • health:check <service> --port <port> │
│      Check specific service health      │
│  • health:stats                       │
│      Show health statistics            │
│  • health:monitor                     │
│      Start continuous monitoring        │
│  • logs                               │
│      View and manage logs             │
│  • logs:tail                         │
│      Tail logs in real-time           │
│  • logs:search <query>               │
│      Search logs by content           │
│  • logs:stats                        │
│      Show logging statistics          │
│  • logs:export <path>                │
│      Export logs to file             │
│  • gateway                             │
│      Start API Gateway              │
│  • gateway:status                    │
│      Show gateway status             │
│  • gateway:stop                      │
│      Stop API Gateway               │
│  • gateway:routes                    │
│      Manage gateway routes           │
│  • gateway:config                   │
│      Gateway configuration          │
│                                                  │
│  Port Management:                             │
│  • port list                           │
│      List allocated ports              │
│  • port free <port>                   │
│      Free specific port                 │
│  • port cleanup                         │
│      Clean unused port mappings        │
│  • port kill <port>                    │
│      Kill processes on specific port     │
│  • port kill-all                       │
│      Kill all PNCE port processes      │
│                                                  │
│  Utility Commands:                             │
│  • alias <action> [args]              │
│      Manage command aliases             │
│  • lang <action> [lang]               │
│      Set/list language                 │
│  • analytics <action>                  │
│      Manage usage analytics             │
│  • profile <action> [name]            │
│      Manage configuration profiles     │
│                                                  │
│  ENVIRONMENT VARIABLES                           │
│  • PNCE_ENV                           │
│      Set mode (development|production) │
│  • NODE_ENV                          │
│      Node.js environment mode         │
│  • PORT                              │
│      Default service port (3000)     │
│                                                  │
│  WORKFLOW EXAMPLES                             │
│                                                  │
│  1. Create Service:                          │
│     pnce init my-api                         │
│                                                  │
│  2. Add Microservice:                        │
│     cd my-api && pnce init user-service -t ms     │
│                                                  │
│  3. Install Dependencies:                     │
│     pnpm install                               │
│                                                  │
│  4. Start Development:                        │
│     pnpm run dev                               │
│                                                  │
│  5. Auto-loading works automatically!             │
│     New microservices are detected and started   │
│                                                  │
╰───────────────────────────────────────────────────╯

Configuration Files:
  • ~/.pnce/.pnce-config.json     - Global config
  • ./.pnce-port-cache.json        - Port mappings
  • module.config.json              - Module metadata

Troubleshooting:
  • Port conflicts: pnce port cleanup
  • Build issues: pnpm run build
  • Dependency issues: pnpm install
  • Logs: Check console output

Documentation: https://github.com/your-org/pnce-cli/wiki
  `);
}

/**
 * Show quick start guide
 */
function showQuickStart(): void {
  logger.info('Displaying quick start guide.');
  console.log(`
╭───────────────────────────────────────────────────────────╮
│                                                  │
│  PNCE CLI - Quick Start Guide                    │
│                                                  │
│  STEP 1: CREATE YOUR FIRST SERVICE               │
│                                                  │
│  pnce init my-first-service                      │
│                                                  │
│  This creates:                                     │
│  • my-first-service/                             │
│  • package.json with workspace config               │
│  • NestJS structure with TypeScript             │
│  • Port 3000 (auto-assigned)                  │
│                                                  │
│  STEP 2: NAVIGATE AND INSTALL                 │
│                                                  │
│  cd my-first-service                              │
│  pnpm install                                    │
│                                                  │
│  This installs:                                   │
│  • All dependencies for all levels               │
│  • Nested microservice dependencies              │
│  • Dev dependencies                             │
│                                                  │
│  STEP 3: START DEVELOPMENT                    │
│                                                  │
│  pnpm run dev                                    │
│                                                  │
│  This starts:                                     │
│  • Main service on port 3000                   │
│  • Auto-scans for microservices                 │
│  • File watching with hot reload               │
│  • Auto-port cleanup                           │
│                                                  │
│  STEP 4: ADD MICROSERVICE (OPTIONAL)          │
│                                                  │
│  # In another terminal (or same terminal):       │
│  pnce init user-service -t ms                    │
│                                                  │
│  This happens automatically:                       │
│  • Port 3001 assigned                           │
│  • Service added to workspace                   │
│  • Auto-detected and started by main service     │
│                                                  │
│  STEP 5: ACCESS YOUR SERVICES                 │
│                                                  │
│  Main Service:     http://localhost:3000/api     │
│  User Service:     http://localhost:3001/api     │
│                                                  │
│  FEATURES AVAILABLE:                            │
│  ✅ Automatic dependency management              │
│  ✅ Port mapping and cleanup                    │
│  ✅ Hot reload in development                   │
│  ✅ Auto-loading of new microservices          │
│  ✅ Process management and monitoring            │
│                                                  │
│  NEXT STEPS:                                  │
│  • pnce help --verbose  - See all commands    │
│  • pnce set lang en     - Set language         │
│  • pnce port list        - Check port usage    │
│                                                  │
╰───────────────────────────────────────────────────╯

🎉 You're all set! Start building your microservices!

Need help? pnce help --verbose
  `);
}
