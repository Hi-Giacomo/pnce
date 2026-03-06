/**
 * 性能监控工具
 */

export interface PerformanceMetric {
  name: string;
  duration: number; // 毫秒
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = process.env.PNCE_PROFILE === 'true';

  /**
   * 开始计时
   */
  start(name: string): void {
    if (!this.enabled) return;
    this.timers.set(name, Date.now());
  }

  /**
   * 结束计时并记录指标
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

    // 记录慢操作（超过 1 秒）
    if (duration > 1000) {
      console.warn(`[PERF] Slow operation: ${name} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取指定名称的指标
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * 清空所有指标
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    if (!this.enabled || this.metrics.length === 0) {
      return;
    }

    console.log('\n=== Performance Report ===');
    const report = this.generateReport();
    report.forEach(item => {
      console.log(`  ${item.name}: ${item.duration}ms (avg) - ${item.count} ops`);
    });
    console.log(`Total time: ${report.reduce((sum, item) => sum + item.total, 0)}ms`);
    console.log('========================\n');
  }

  /**
   * 生成性能报告
   */
  private generateReport(): Array<{
    name: string;
    count: number;
    total: number;
    duration: number;
  }> {
    const grouped = new Map<string, PerformanceMetric[]>();
    this.metrics.forEach(m => {
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

// 导出单例
export const performance = new PerformanceMonitor();
