/**
 * Performance monitoringUtility
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = process.env.PNCE_PROFILE === 'true';

  /**
   * Start
   */
  start(name: string): void {
    if (!this.enabled) return;
    this.timers.set(name, Date.now());
  }

  /**
   * Record
   */
  end(name: string, metadata?: Record<string, unknown>): number {
    if (!this.enabled) return 0;

    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Performance timer "${name}" not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    this.timers.delete(name);

    // Record（ 1 ）
    if (duration > 1000) {
      console.warn(`[PERF] Slow operation: ${name} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * All
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Print performance report
   */
  printReport(): void {
    if (!this.enabled || this.metrics.length === 0) {
      return;
    }

    console.log('\n=== Performance Report ===');
    const report = this.generateReport();
    report.forEach((item) => {
      console.log(`  ${item.name}: ${item.duration}ms (avg) - ${item.count} ops`);
    });
    console.log(`Total time: ${report.reduce((sum, item) => sum + item.total, 0)}ms`);
    console.log('========================\n');
  }

  /**
   * Generate performance report
   */
  private generateReport(): Array<{
    name: string;
    count: number;
    total: number;
    duration: number;
  }> {
    const grouped = new Map<string, PerformanceMetric[]>();
    this.metrics.forEach((m) => {
      const list = grouped.get(m.name) || [];
      list.push(m);
      grouped.set(m.name, list);
    });

    return Array.from(grouped.entries()).map(([name, metrics]) => ({
      name,
      count: metrics.length,
      total: metrics.reduce((sum, m) => sum + m.duration, 0),
      duration: Math.round(metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length),
    }));
  }
}

//
export const performance = new PerformanceMonitor();
