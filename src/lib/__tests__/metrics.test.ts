import { describe, it, expect, beforeEach } from 'vitest';
import { metrics } from '../metrics';

describe('Metrics', () => {
  beforeEach(() => {
    metrics.reset();
  });

  it('should increment counters', () => {
    metrics.incrementCounter('test_counter');
    expect(metrics.getCounter('test_counter')).toBe(1);

    metrics.incrementCounter('test_counter', {}, 5);
    expect(metrics.getCounter('test_counter')).toBe(6);
  });

  it('should handle counters with labels', () => {
    metrics.incrementCounter('requests', { method: 'GET', status: '200' });
    metrics.incrementCounter('requests', { method: 'POST', status: '201' });

    expect(metrics.getCounter('requests', { method: 'GET', status: '200' })).toBe(1);
    expect(metrics.getCounter('requests', { method: 'POST', status: '201' })).toBe(1);
  });

  it('should set and get gauges', () => {
    metrics.setGauge('memory_usage', 1024);
    expect(metrics.getGauge('memory_usage')).toBe(1024);

    metrics.setGauge('memory_usage', 2048);
    expect(metrics.getGauge('memory_usage')).toBe(2048);
  });

  it('should record histogram values', () => {
    metrics.recordHistogram('response_time', 100);
    metrics.recordHistogram('response_time', 200);
    metrics.recordHistogram('response_time', 150);

    const stats = metrics.getHistogramStats('response_time');

    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(3);
    expect(stats!.min).toBe(100);
    expect(stats!.max).toBe(200);
    expect(stats!.avg).toBe(150);
    expect(stats!.sum).toBe(450);
  });

  it('should return null for non-existent histogram', () => {
    const stats = metrics.getHistogramStats('nonexistent');
    expect(stats).toBeNull();
  });

  it('should provide summary of all metrics', () => {
    metrics.incrementCounter('test');
    metrics.setGauge('memory', 100);
    metrics.recordHistogram('latency', 50);

    const summary = metrics.getSummary();

    expect(summary.counters.length).toBeGreaterThan(0);
    expect(Object.keys(summary.gauges).length).toBeGreaterThan(0);
  });

  it('should reset all metrics', () => {
    metrics.incrementCounter('test');
    metrics.setGauge('memory', 100);

    metrics.reset();

    expect(metrics.getCounter('test')).toBe(0);
    expect(metrics.getGauge('memory')).toBe(0);
  });

  it('should track all metric events', () => {
    metrics.incrementCounter('events');
    metrics.setGauge('value', 42);

    const allMetrics = metrics.getAllMetrics();
    expect(allMetrics.length).toBeGreaterThan(0);
    expect(allMetrics[0]).toHaveProperty('name');
    expect(allMetrics[0]).toHaveProperty('value');
    expect(allMetrics[0]).toHaveProperty('timestamp');
  });
});
