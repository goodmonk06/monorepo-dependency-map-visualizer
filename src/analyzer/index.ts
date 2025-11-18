import { MonorepoMapConfig } from '../types/config';
import { Violation, DependencyGraph } from '../types/graph';
import { discoverPackages } from './package-discovery';
import { analyzeDependencies } from './dependency-analyzer';
import { detectCycles, detectBoundaryViolations } from './violation-detector';
import { generateJsonOutput } from '../output/json-generator';
import { generateDotOutput } from '../output/dot-generator';
import { generateMermaidOutput } from '../output/mermaid-generator';
import { generateHtmlReport } from '../output/html-generator';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';
import { pluginRegistry } from '../plugins/types';

export interface AnalyzerOptions {
  config: MonorepoMapConfig;
  outputDir?: string;
  formats?: ('json' | 'dot' | 'mermaid' | 'html')[];
}

export async function runAnalysis(options: AnalyzerOptions): Promise<DependencyGraph> {
  const startTime = Date.now();
  const { config } = options;
  const outputDir = options.outputDir || './analysis';
  const formats = options.formats || ['json', 'dot', 'mermaid', 'html'];

  logger.info('Starting monorepo analysis', {
    rootPatterns: config.rootPatterns,
    detectCycles: config.detectCycles,
    boundaryRules: config.boundaryRules?.length || 0,
  });

  console.log('🔍 Starting monorepo analysis...\n');
  console.log('Configuration:');
  console.log(`  Root patterns: ${config.rootPatterns.join(', ')}`);
  console.log(`  Detect cycles: ${config.detectCycles !== false}`);
  console.log(`  Boundary rules: ${config.boundaryRules?.length || 0}`);
  console.log('');

  // Step 1: Discover packages
  console.log('📦 Step 1: Discovering packages...');
  const packages = await discoverPackages(config);
  metrics.setGauge('packages_discovered', packages.size);

  if (packages.size === 0) {
    logger.error('No packages found', { rootPatterns: config.rootPatterns });
    console.error('❌ No packages found! Please check your rootPatterns configuration.');
    process.exit(1);
  }

  // Step 2: Analyze dependencies
  console.log('\n🔗 Step 2: Analyzing dependencies...');
  await analyzeDependencies(packages);

  // Run plugin analyzers
  const pluginAnalyzers = pluginRegistry.getAnalyzers();
  if (pluginAnalyzers.length > 0) {
    logger.info('Running plugin analyzers', { count: pluginAnalyzers.length });
    for (const plugin of pluginAnalyzers) {
      for (const [, packageInfo] of packages.entries()) {
        const additionalDeps = await plugin.analyzeDependencies(packageInfo, config);
        packageInfo.dependencies.push(...additionalDeps);
      }
    }
  }

  // Step 3: Detect violations
  console.log('\n⚠️  Step 3: Detecting violations...');
  const violations: Violation[] = [];

  if (config.detectCycles !== false) {
    console.log('  Checking for circular dependencies...');
    const cycles = detectCycles(packages);
    violations.push(...cycles);
    metrics.setGauge('cycles_detected', cycles.length);
    console.log(`  Found ${cycles.length} circular dependency issue(s)`);
  }

  if (config.boundaryRules && config.boundaryRules.length > 0) {
    console.log('  Checking boundary rules...');
    const boundaryViolations = detectBoundaryViolations(packages, config);
    violations.push(...boundaryViolations);
    metrics.setGauge('boundary_violations', boundaryViolations.length);
    console.log(`  Found ${boundaryViolations.length} boundary violation(s)`);
  }

  // Run plugin rules
  const pluginRules = pluginRegistry.getRules();
  if (pluginRules.length > 0) {
    logger.info('Running plugin rules', { count: pluginRules.length });
    for (const plugin of pluginRules) {
      const pluginViolations = await plugin.evaluateRules(packages, config);
      violations.push(...pluginViolations);
    }
  }

  // Calculate total dependencies
  let totalDependencies = 0;
  for (const pkg of packages.values()) {
    totalDependencies += pkg.dependencies.length;
  }

  // Build graph object
  const packagesObj: Record<string, any> = {};
  for (const [name, info] of packages.entries()) {
    packagesObj[name] = info;
  }

  const graph: DependencyGraph = {
    packages: packagesObj,
    violations,
    metadata: {
      analyzedAt: new Date().toISOString(),
      totalPackages: packages.size,
      totalDependencies,
    },
  };

  // Step 4: Generate outputs
  console.log('\n📄 Step 4: Generating outputs...');

  if (formats.includes('json')) {
    generateJsonOutput(packages, violations, `${outputDir}/graph.json`);
  }

  if (formats.includes('dot')) {
    generateDotOutput(packages, violations, `${outputDir}/graph.dot`);
  }

  if (formats.includes('mermaid')) {
    generateMermaidOutput(packages, violations, `${outputDir}/graph.mmd`);
  }

  if (formats.includes('html')) {
    generateHtmlReport(graph, `${outputDir}/report.html`);
  }

  // Run plugin exporters
  const pluginExporters = pluginRegistry.getExporters();
  for (const plugin of pluginExporters) {
    logger.info('Running plugin exporter', { name: plugin.name });
    await plugin.export(graph, `${outputDir}/graph.${plugin.fileExtension}`);
  }

  // Collect metrics
  const analysisTime = Date.now() - startTime;
  metrics.recordHistogram('analysis_duration_ms', analysisTime);
  metrics.setGauge('total_violations', violations.length);

  // Summary
  console.log('\n✅ Analysis complete!');
  console.log('\nSummary:');
  console.log(`  Packages analyzed: ${packages.size}`);
  console.log(`  Total violations: ${violations.length}`);
  console.log(`  Analysis time: ${(analysisTime / 1000).toFixed(2)}s`);

  if (violations.length > 0) {
    console.log('\n⚠️  Violations found:');
    for (const violation of violations) {
      console.log(`  - [${violation.type.toUpperCase()}] ${violation.message}`);
    }
    console.log('\nRun the UI or open report.html to explore the dependency graph.');
  } else {
    console.log('\n✨ No violations detected!');
  }

  logger.info('Analysis completed', {
    packages: packages.size,
    violations: violations.length,
    durationMs: analysisTime,
  });

  return graph;
}
