/**
 * 200X Performance Monitor - Real-time metrics and alerting
 * Track performance, identify bottlenecks, alert on issues
 */

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: Map<string, number>;
  slowOperations: Array<{ name: string; duration: number }>;
  memoryUsage: NodeJS.MemoryUsage;
}

interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;
  duration?: number; // ms - must exceed for this duration
}

interface Alert {
  id: string;
  metric: string;
  threshold: number;
  actualValue: number;
  timestamp: number;
  severity: 'warning' | 'critical';
}

export class PerformanceMonitor {
  private metrics: Metric[] = [];
  private thresholds: AlertThreshold[] = [];
  private alerts: Alert[] = [];
  private operationTimings: Map<string, number[]> = new Map();
  private maxMetricsHistory = 10000;

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    // Trim old metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check thresholds
    this.checkThresholds(name, value);
  }

  /**
   * Time an operation
   */
  async time<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.record(`${name}_duration`, duration, tags);
      this.record(`${name}_success`, 1, tags);
      
      // Track for statistics
      this.trackTiming(name, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(`${name}_duration`, duration, tags);
      this.record(`${name}_error`, 1, tags);
      throw error;
    }
  }

  /**
   * Add an alert threshold
   */
  addThreshold(threshold: AlertThreshold): void {
    this.thresholds.push(threshold);
  }

  /**
   * Get metric statistics
   */
  getStats(name: string, timeWindow: number = 60000): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const values = this.metrics
      .filter(m => m.name === name && m.timestamp >= cutoff)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    const p95Index = Math.floor(values.length * 0.95);
    const p99Index = Math.floor(values.length * 0.99);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg,
      p95: values[p95Index] || values[values.length - 1],
      p99: values[p99Index] || values[values.length - 1]
    };
  }

  /**
   * Get performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    const metrics = new Map<string, number>();
    
    // Aggregate current metrics
    const latestMetrics = this.getLatestMetrics();
    for (const [name, value] of latestMetrics) {
      metrics.set(name, value);
    }

    // Get slow operations
    const slowOperations = this.getSlowOperations();

    return {
      timestamp: Date.now(),
      metrics,
      slowOperations,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(severity?: 'warning' | 'critical'): Alert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Clear old alerts
   */
  clearAlerts(olderThan?: number): void {
    if (olderThan) {
      const cutoff = Date.now() - olderThan;
      this.alerts = this.alerts.filter(a => a.timestamp >= cutoff);
    } else {
      this.alerts = [];
    }
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.toPrometheusFormat();
    }
    return JSON.stringify(this.metrics.slice(-1000));
  }

  private trackTiming(name: string, duration: number): void {
    const timings = this.operationTimings.get(name) || [];
    timings.push(duration);
    
    // Keep last 1000 timings
    if (timings.length > 1000) {
      timings.shift();
    }
    
    this.operationTimings.set(name, timings);
  }

  private getLatestMetrics(): Map<string, number> {
    const latest = new Map<string, number>();
    
    for (let i = this.metrics.length - 1; i >= 0; i--) {
      const metric = this.metrics[i];
      if (!latest.has(metric.name)) {
        latest.set(metric.name, metric.value);
      }
    }
    
    return latest;
  }

  private getSlowOperations(): Array<{ name: string; duration: number }> {
    const slow: Array<{ name: string; duration: number }> = [];
    
    for (const [name, timings] of this.operationTimings.entries()) {
      if (timings.length === 0) continue;
      
      const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
      if (avg > 100) { // > 100ms is slow
        slow.push({ name, duration: avg });
      }
    }
    
    return slow.sort((a, b) => b.duration - a.duration).slice(0, 10);
  }

  private checkThresholds(metricName: string, value: number): void {
    for (const threshold of this.thresholds) {
      if (threshold.metric !== metricName) continue;
      
      let breached = false;
      switch (threshold.operator) {
        case '>': breached = value > threshold.value; break;
        case '<': breached = value < threshold.value; break;
        case '>=': breached = value >= threshold.value; break;
        case '<=': breached = value <= threshold.value; break;
        case '==': breached = value === threshold.value; break;
      }
      
      if (breached) {
        this.createAlert(threshold, value);
      }
    }
  }

  private createAlert(threshold: AlertThreshold, actualValue: number): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric: threshold.metric,
      threshold: threshold.value,
      actualValue,
      timestamp: Date.now(),
      severity: threshold.operator === '>' && actualValue > threshold.value * 2 ? 'critical' : 'warning'
    };
    
    this.alerts.push(alert);
    
    // Log alert
    console.warn(`[PerformanceMonitor] ALERT: ${alert.metric} ${threshold.operator} ${threshold.value} (actual: ${actualValue})`);
  }

  private toPrometheusFormat(): string {
    const lines: string[] = [];
    
    for (const [name, stats] of this.operationTimings.entries()) {
      if (stats.length === 0) continue;
      
      const avg = stats.reduce((a, b) => a + b, 0) / stats.length;
      lines.push(`# HELP ${name} Average duration in ms`);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}_avg ${avg.toFixed(2)}`);
    }
    
    return lines.join('\n');
  }
}

// Global monitor instance
export const globalMonitor = new PerformanceMonitor();

// Decorator for automatic timing
export function Timed(name: string, tags?: Record<string, string>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return globalMonitor.time(name, () => originalMethod.apply(this, args), tags);
    };
    
    return descriptor;
  };
}

export default PerformanceMonitor;
