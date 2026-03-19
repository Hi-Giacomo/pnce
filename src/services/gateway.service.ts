import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ServiceRoute {
  path: string;
  target: string;
  method: string[];
  service: string;
  port: number;
  health?: 'up' | 'down';
}

export interface GatewayConfig {
  port: number;
  routes: ServiceRoute[];
  middleware?: string[];
  cors?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface GatewayRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface GatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
}

export class GatewayService {
  private config: GatewayConfig;
  private server: http.Server | null = null;
  private serviceHealthCache = new Map<string, 'up' | 'down'>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly logger = console;

  constructor(config?: Partial<GatewayConfig>) {
    this.config = {
      port: 8080,
      routes: [],
      cors: true,
      rateLimit: {
        windowMs: 60000, // 1 minute
        max: 100, // requests per minute
      },
      ...config,
    };
  }

  /**
   * Start the API Gateway
   */
  async start(): Promise<void> {
    if (this.server) {
      this.logger.warn('Gateway is already running');
      return;
    }

    // Load routes from port cache
    await this.loadServiceRoutes();

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Start listening
    this.server.listen(this.config.port, () => {
      this.logger.log(`🚀 API Gateway started on port ${this.config.port}`);
      this.logger.log(`📋 Loaded ${this.config.routes.length} service routes`);

      // Start health checking
      this.startHealthChecking();
    });
  }

  /**
   * Stop the API Gateway
   */
  async stop(): Promise<void> {
    if (!this.server) {
      this.logger.warn('Gateway is not running');
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.logger.log('🛑 API Gateway stopped');
        resolve();
      });
    });
  }

  /**
   * Load service routes from port cache
   */
  private async loadServiceRoutes(): Promise<void> {
    try {
      const portCachePath = path.join(process.cwd(), '.pnce-port-cache.json');

      if (fs.existsSync(portCachePath)) {
        const portMappings = fs.readJsonSync(portCachePath);
        const routes: ServiceRoute[] = [];

        for (const [serviceName, port] of Object.entries(portMappings)) {
          // Create common routes for each service
          routes.push(
            {
              path: `/${serviceName}`,
              target: `http://localhost:${port}`,
              method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              service: serviceName,
              port: port as number,
            },
            {
              path: `/${serviceName}/*`,
              target: `http://localhost:${port}`,
              method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              service: serviceName,
              port: port as number,
            }
          );
        }

        this.config.routes = routes;
        this.logger.log(`📦 Loaded routes for ${Object.keys(portMappings).length} services`);
      }
    } catch (error) {
      this.logger.error('Failed to load service routes:', error);
    }
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const startTime = Date.now();

      // Apply CORS headers
      if (this.config.cors) {
        this.applyCorsHeaders(res);
      }

      // Apply rate limiting
      if (this.config.rateLimit && !this.checkRateLimit(req)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
          })
        );
        return;
      }

      // Find matching route
      const route = this.findRoute(req);

      if (!route) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Not Found',
            message: 'Route not found',
            availableRoutes: this.config.routes.map((r) => r.path),
          })
        );
        return;
      }

      // Check service health
      if (route.health === 'down') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Service Unavailable',
            message: `Service ${route.service} is currently down`,
            service: route.service,
          })
        );
        return;
      }

      // Proxy request to target service
      await this.proxyRequest(req, res, route, startTime);
    } catch (error) {
      this.logger.error('Request handling error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        })
      );
    }
  }

  /**
   * Find matching route for request
   */
  private findRoute(req: http.IncomingMessage): ServiceRoute | null {
    const url = req.url || '/';
    const method = req.method?.toUpperCase() || 'GET';

    // Find exact match first
    let route = this.config.routes.find((r) => r.path === url && r.method.includes(method));

    // Find wildcard match
    if (!route) {
      route = this.config.routes.find((r) => {
        if (!r.method.includes(method)) return false;

        // Handle wildcard routes like /service/*
        if (r.path.endsWith('/*')) {
          const basePath = r.path.slice(0, -2);
          return url.startsWith(basePath);
        }

        return false;
      });
    }

    return route || null;
  }

  /**
   * Proxy request to target service
   */
  private async proxyRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    route: ServiceRoute,
    startTime: number
  ): Promise<void> {
    try {
      // Prepare request options
      const targetUrl = new URL(req.url || '/', route.target);
      const options: http.RequestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: { ...req.headers },
      };

      // Remove hop-by-hop headers
      const headers = { ...req.headers } as Record<string, string>;
      delete headers['host'];
      delete headers['connection'];
      delete headers['transfer-encoding'];

      // Create proxy request
      const proxyReq = http.request(options, (proxyRes) => {
        // Forward response headers
        Object.keys(proxyRes.headers).forEach((key) => {
          if (!this.isHopByHopHeader(key)) {
            res.setHeader(key, proxyRes.headers[key] as string);
          }
        });

        // Set response status
        res.writeHead(proxyRes.statusCode || 200);

        // Forward response body
        proxyRes.pipe(res);

        // Log successful proxy
        const duration = Date.now() - startTime;
        this.logger.log(`✅ ${req.method} ${req.url} -> ${route.service} (${duration}ms)`);
      });

      // Handle proxy request errors
      proxyReq.on('error', (error) => {
        this.logger.error(`❌ Proxy error for ${route.service}:`, error);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Bad Gateway',
            message: `Failed to connect to service ${route.service}`,
            service: route.service,
          })
        );
      });

      // Forward request body
      req.pipe(proxyReq);
    } catch (error) {
      this.logger.error(`❌ Proxy setup error for ${route.service}:`, error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'Failed to setup proxy request',
          })
        );
      }
    }
  }

  /**
   * Apply CORS headers
   */
  private applyCorsHeaders(res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(req: http.IncomingMessage): boolean {
    if (!this.config.rateLimit) return true;

    const clientIp = this.getClientIp(req);
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // Get or create client request count
    let clientData = this.requestCounts.get(clientIp);

    if (!clientData || clientData.resetTime <= now) {
      clientData = {
        count: 0,
        resetTime: now + this.config.rateLimit.windowMs,
      };
      this.requestCounts.set(clientIp, clientData);
    }

    // Check if rate limit exceeded
    if (clientData.count >= this.config.rateLimit.max) {
      return false;
    }

    // Increment request count
    clientData.count++;
    return true;
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: http.IncomingMessage): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Check if header is hop-by-hop
   */
  private isHopByHopHeader(headerName: string): boolean {
    const hopByHopHeaders = [
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
    ];

    return hopByHopHeaders.includes(headerName.toLowerCase());
  }

  /**
   * Start health checking for services
   */
  private startHealthChecking(): void {
    // Check service health every 30 seconds
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 30000);

    // Initial health check
    this.checkServiceHealth();
  }

  /**
   * Check health of all services
   */
  private async checkServiceHealth(): Promise<void> {
    for (const route of this.config.routes) {
      try {
        const isHealthy = await this.pingService(route.port);
        const previousHealth = this.serviceHealthCache.get(route.service);

        if (previousHealth !== undefined && previousHealth !== (isHealthy ? 'up' : 'down')) {
          this.logger.log(
            `${isHealthy ? '🟢' : '🔴'} Service ${route.service} is ${isHealthy ? 'UP' : 'DOWN'}`
          );
        }

        route.health = isHealthy ? 'up' : 'down';
        this.serviceHealthCache.set(route.service, isHealthy ? 'up' : 'down');
      } catch (error) {
        this.logger.error(`Health check failed for ${route.service}:`, error);
        route.health = 'down';
        this.serviceHealthCache.set(route.service, 'down');
      }
    }
  }

  /**
   * Ping service to check if it's responsive
   */
  private async pingService(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.get(`http://localhost:${port}/health`, (res: any) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Get gateway status
   */
  getStatus(): {
    running: boolean;
    port: number;
    routes: number;
    services: Array<{ name: string; health: 'up' | 'down' | 'unknown' }>;
    uptime: number;
  } {
    const services = Array.from(new Set(this.config.routes.map((r) => r.service))).map(
      (serviceName) => ({
        name: serviceName,
        health:
          (this.serviceHealthCache.get(serviceName) as 'up' | 'down' | 'unknown') || 'unknown',
      })
    );

    return {
      running: this.server !== null,
      port: this.config.port,
      routes: this.config.routes.length,
      services,
      uptime: process.uptime(),
    };
  }

  /**
   * Add custom route
   */
  addRoute(route: ServiceRoute): void {
    this.config.routes.push(route);
    this.logger.log(`➕ Added route: ${route.path} -> ${route.target}`);
  }

  /**
   * Remove route
   */
  removeRoute(path: string): boolean {
    const index = this.config.routes.findIndex((r) => r.path === path);
    if (index !== -1) {
      const removed = this.config.routes.splice(index, 1)[0];
      this.logger.log(`➖ Removed route: ${removed.path}`);
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('⚙️ Gateway configuration updated');
  }
}
