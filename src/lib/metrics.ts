/**
 * Metrics collection system for observability
 */

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface Counter {
  name: string;
  value: number;
  labels: Record<string, string>;
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private metrics: Metric[] = [];

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.makeKey(name, labels);
    const counter = this.counters.get(key) || { name, value: 0, labels };
    counter.value += value;
    this.counters.set(key, counter);

    this.recordMetric(name, counter.value, labels);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);
    this.recordMetric(name, value, labels);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    this.recordMetric(name, value, labels);
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels: Record<string, string> = {}): number {
    const key = this.makeKey(name, labels);
    return this.counters.get(key)?.value || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels: Record<string, string> = {}): number {
    const key = this.makeKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels: Record<string, string> = {}): {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
  } | null {
    const key = this.makeKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = sum / count;

    return { count, sum, min, max, avg };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    counters: Counter[];
    gauges: Record<string, number>;
    histograms: Record<string, ReturnType<MetricsCollector['getHistogramStats']>>;
  } {
    const histogramStats: Record<string, any> = {};
    for (const [key, values] of this.histograms.entries()) {
      histogramStats[key] = this.getHistogramStats(key.split(':')[0], {});
    }

    return {
      counters: Array.from(this.counters.values()),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.metrics = [];
  }

  private makeKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${name}:${labelStr}` : name;
  }

  private recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });

    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }
}

/**
 * Global metrics collector instance
 */
export const metrics = new MetricsCollector();
