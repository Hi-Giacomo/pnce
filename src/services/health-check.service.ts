import * as fs from 'fs-extra';
import * as path from 'path';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: MemoryUsage;
  services: ServiceHealth[];
  system: SystemHealth;
}

export interface ServiceHealth {
  name: string;
  port: number;
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface SystemHealth {
  platform: string;
  nodeVersion: string;
  arch: string;
  cpuUsage: NodeJS.CpuUsage;
  loadAverage: number[];
}

export class HealthCheckService {
  private readonly logger = console;
  private serviceHealthCache = new Map<string, ServiceHealth>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {}

  /**
   * Start health monitoring
   */
  startHealthMonitoring(): void {
    this.logger.log('Starting health monitoring...');

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.log('Health monitoring stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Get system health
      const system = await this.getSystemHealth();

      // Get memory usage
      const memory = this.getMemoryUsage();

      // Check all registered services
      const services = await this.checkAllServices();

      // Calculate overall status
      const status = this.calculateOverallStatus(services);

      const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory,
        services,
        system,
      };

      // Cache the result
      this.cacheHealthResult(result);

      // Log any issues
      this.logHealthIssues(result);

      const duration = Date.now() - startTime;
      this.logger.debug(`Health check completed in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error);

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: this.getMemoryUsage(),
        services: [],
        system: await this.getSystemHealth(),
      };
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthCheckResult | null {
    const cached = Array.from(this.serviceHealthCache.values());
    if (cached.length === 0) {
      return null;
    }

    return {
      status: this.calculateOverallStatus(cached),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: this.getMemoryUsage(),
      services: cached,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        arch: process.arch,
        cpuUsage: process.cpuUsage(),
        loadAverage: require('os').loadavg(),
      },
    };
  }

  /**
   * Check health of specific service
   */
  async checkServiceHealth(serviceName: string, port: number): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await this.makeHttpRequest(`http://localhost:${port}/health`, 5000);
      const responseTime = Date.now() - startTime;

      const health: ServiceHealth = {
        name: serviceName,
        port,
        status: response.ok ? 'up' : 'down',
        responseTime,
        lastCheck: new Date().toISOString(),
      };

      if (!response.ok && response.error) {
        health.error = response.error;
      }

      return health;
    } catch (error) {
      return {
        name: serviceName,
        port,
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check all registered services
   */
  private async checkAllServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Get port mappings
    const portMappings = this.getPortMappings();

    for (const [serviceName, port] of Object.entries(portMappings)) {
      const health = await this.checkServiceHealth(serviceName, port);
      services.push(health);
    }

    return services;
  }

  /**
   * Get system health information
   */
  private async getSystemHealth(): Promise<SystemHealth> {
    const os = require('os');

    return {
      platform: os.platform(),
      nodeVersion: process.version,
      arch: os.arch(),
      cpuUsage: process.cpuUsage(),
      loadAverage: os.loadavg(),
    };
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
    };
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeHttpRequest(
    url: string,
    timeout: number
  ): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      const http = require('http');
      const request = http.get(url, (response: any) => {
        let data = '';

        response.on('data', (chunk: any) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve({ ok: response.statusCode === 200 });
        });
      });

      request.on('error', (error: any) => {
        resolve({ ok: false, error: error.message });
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        resolve({ ok: false, error: 'Request timeout' });
      });
    });
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallStatus(services: ServiceHealth[]): 'healthy' | 'unhealthy' | 'degraded' {
    if (services.length === 0) {
      return 'healthy'; // No services to monitor
    }

    const downServices = services.filter((s) => s.status === 'down');
    const upServices = services.filter((s) => s.status === 'up');

    if (downServices.length === 0) {
      return 'healthy';
    }

    if (upServices.length === 0) {
      return 'unhealthy';
    }

    // Some services up, some down
    return 'degraded';
  }

  /**
   * Get port mappings from cache file
   */
  private getPortMappings(): Record<string, number> {
    try {
      const portCachePath = path.join(process.cwd(), '.pnce-port-cache.json');

      if (fs.existsSync(portCachePath)) {
        return fs.readJsonSync(portCachePath);
      }

      return {};
    } catch (error) {
      this.logger.error('Failed to read port mappings:', error);
      return {};
    }
  }

  /**
   * Cache health check result
   */
  private cacheHealthResult(result: HealthCheckResult): void {
    // Update service health cache
    result.services.forEach((service) => {
      this.serviceHealthCache.set(service.name, service);
    });
  }

  /**
   * Log health issues
   */
  private logHealthIssues(result: HealthCheckResult): void {
    const issues = result.services.filter((s) => s.status === 'down');

    if (issues.length > 0) {
      this.logger.warn(`Health check detected ${issues.length} unhealthy services:`);
      issues.forEach((service) => {
        this.logger.warn(
          `  - ${service.name} (port ${service.port}): ${service.error || 'Connection failed'}`
        );
      });
    }

    // Check memory usage
    const memoryUsagePercent = (result.memory.heapUsed / result.memory.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      this.logger.warn(`High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`);
    }

    // Check system load
    const loadAvg = result.system.loadAverage[0]; // 1-minute average
    if (loadAvg > 2.0) {
      this.logger.warn(`High system load detected: ${loadAvg.toFixed(2)}`);
    }
  }

  /**
   * Get health statistics
   */
  getHealthStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    uptime: number;
    lastCheck: string;
  } {
    const services = Array.from(this.serviceHealthCache.values());

    return {
      totalServices: services.length,
      healthyServices: services.filter((s) => s.status === 'up').length,
      unhealthyServices: services.filter((s) => s.status === 'down').length,
      uptime: process.uptime(),
      lastCheck: new Date().toISOString(),
    };
  }
}
