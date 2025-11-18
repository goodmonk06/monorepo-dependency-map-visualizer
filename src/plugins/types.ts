import { PackageInfo, DependencyGraph, Violation } from '../types/graph';
import { MonorepoMapConfig } from '../types/config';

/**
 * Base plugin interface
 */
export interface Plugin {
  name: string;
  version: string;
  description?: string;
}

/**
 * Analyzer plugin - extends dependency analysis
 */
export interface AnalyzerPlugin extends Plugin {
  /**
   * Analyze additional dependencies (e.g., CSS modules, assets)
   */
  analyzeDependencies(
    packageInfo: PackageInfo,
    config: MonorepoMapConfig
  ): Promise<string[]>;
}

/**
 * Rule plugin - custom boundary rules
 */
export interface RulePlugin extends Plugin {
  /**
   * Evaluate custom rules and return violations
   */
  evaluateRules(
    packages: Map<string, PackageInfo>,
    config: MonorepoMapConfig
  ): Promise<Violation[]>;
}

/**
 * Exporter plugin - custom output formats
 */
export interface ExporterPlugin extends Plugin {
  /**
   * File extension for this format
   */
  fileExtension: string;

  /**
   * Export the dependency graph to a custom format
   */
  export(
    graph: DependencyGraph,
    outputPath: string
  ): Promise<void>;
}

/**
 * Metric collector plugin - custom metrics
 */
export interface MetricCollectorPlugin extends Plugin {
  /**
   * Collect custom metrics from the analysis
   */
  collectMetrics(
    packages: Map<string, PackageInfo>,
    graph: DependencyGraph
  ): Promise<Record<string, any>>;
}

/**
 * Plugin registry for managing all plugins
 */
export class PluginRegistry {
  private analyzers: Map<string, AnalyzerPlugin> = new Map();
  private rules: Map<string, RulePlugin> = new Map();
  private exporters: Map<string, ExporterPlugin> = new Map();
  private metrics: Map<string, MetricCollectorPlugin> = new Map();

  registerAnalyzer(plugin: AnalyzerPlugin): void {
    this.analyzers.set(plugin.name, plugin);
  }

  registerRule(plugin: RulePlugin): void {
    this.rules.set(plugin.name, plugin);
  }

  registerExporter(plugin: ExporterPlugin): void {
    this.exporters.set(plugin.name, plugin);
  }

  registerMetric(plugin: MetricCollectorPlugin): void {
    this.metrics.set(plugin.name, plugin);
  }

  getAnalyzers(): AnalyzerPlugin[] {
    return Array.from(this.analyzers.values());
  }

  getRules(): RulePlugin[] {
    return Array.from(this.rules.values());
  }

  getExporters(): ExporterPlugin[] {
    return Array.from(this.exporters.values());
  }

  getMetrics(): MetricCollectorPlugin[] {
    return Array.from(this.metrics.values());
  }

  getExporter(name: string): ExporterPlugin | undefined {
    return this.exporters.get(name);
  }
}

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry();
