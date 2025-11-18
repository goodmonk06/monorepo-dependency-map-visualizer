import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry, AnalyzerPlugin, RulePlugin, ExporterPlugin, MetricCollectorPlugin } from '../types';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should register and retrieve analyzer plugins', () => {
    const plugin: AnalyzerPlugin = {
      name: 'test-analyzer',
      version: '1.0.0',
      analyzeDependencies: async () => [],
    };

    registry.registerAnalyzer(plugin);
    const analyzers = registry.getAnalyzers();

    expect(analyzers).toHaveLength(1);
    expect(analyzers[0].name).toBe('test-analyzer');
  });

  it('should register and retrieve rule plugins', () => {
    const plugin: RulePlugin = {
      name: 'test-rule',
      version: '1.0.0',
      evaluateRules: async () => [],
    };

    registry.registerRule(plugin);
    const rules = registry.getRules();

    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('test-rule');
  });

  it('should register and retrieve exporter plugins', () => {
    const plugin: ExporterPlugin = {
      name: 'test-exporter',
      version: '1.0.0',
      fileExtension: 'txt',
      export: async () => {},
    };

    registry.registerExporter(plugin);
    const exporters = registry.getExporters();

    expect(exporters).toHaveLength(1);
    expect(exporters[0].name).toBe('test-exporter');
  });

  it('should register and retrieve metric collector plugins', () => {
    const plugin: MetricCollectorPlugin = {
      name: 'test-metrics',
      version: '1.0.0',
      collectMetrics: async () => ({}),
    };

    registry.registerMetric(plugin);
    const metrics = registry.getMetrics();

    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('test-metrics');
  });

  it('should retrieve specific exporter by name', () => {
    const plugin: ExporterPlugin = {
      name: 'json-exporter',
      version: '1.0.0',
      fileExtension: 'json',
      export: async () => {},
    };

    registry.registerExporter(plugin);

    const exporter = registry.getExporter('json-exporter');
    expect(exporter).toBeDefined();
    expect(exporter?.name).toBe('json-exporter');

    const nonExistent = registry.getExporter('nonexistent');
    expect(nonExistent).toBeUndefined();
  });

  it('should allow multiple plugins of different types', () => {
    const analyzer: AnalyzerPlugin = {
      name: 'analyzer',
      version: '1.0.0',
      analyzeDependencies: async () => [],
    };

    const rule: RulePlugin = {
      name: 'rule',
      version: '1.0.0',
      evaluateRules: async () => [],
    };

    registry.registerAnalyzer(analyzer);
    registry.registerRule(rule);

    expect(registry.getAnalyzers()).toHaveLength(1);
    expect(registry.getRules()).toHaveLength(1);
  });
});
