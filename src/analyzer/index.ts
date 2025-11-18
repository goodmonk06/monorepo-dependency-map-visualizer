import { MonorepoMapConfig } from '../types/config';
import { Violation } from '../types/graph';
import { discoverPackages } from './package-discovery';
import { analyzeDependencies } from './dependency-analyzer';
import { detectCycles, detectBoundaryViolations } from './violation-detector';
import { generateJsonOutput } from '../output/json-generator';
import { generateDotOutput } from '../output/dot-generator';

export interface AnalyzerOptions {
  config: MonorepoMapConfig;
  outputDir?: string;
}

export async function runAnalysis(options: AnalyzerOptions): Promise<void> {
  const { config } = options;
  const outputDir = options.outputDir || './analysis';

  console.log('🔍 Starting monorepo analysis...\n');
  console.log('Configuration:');
  console.log(`  Root patterns: ${config.rootPatterns.join(', ')}`);
  console.log(`  Detect cycles: ${config.detectCycles !== false}`);
  console.log(`  Boundary rules: ${config.boundaryRules?.length || 0}`);
  console.log('');

  // Step 1: Discover packages
  console.log('📦 Step 1: Discovering packages...');
  const packages = await discoverPackages(config);

  if (packages.size === 0) {
    console.error('❌ No packages found! Please check your rootPatterns configuration.');
    process.exit(1);
  }

  // Step 2: Analyze dependencies
  console.log('\n🔗 Step 2: Analyzing dependencies...');
  await analyzeDependencies(packages);

  // Step 3: Detect violations
  console.log('\n⚠️  Step 3: Detecting violations...');
  const violations: Violation[] = [];

  if (config.detectCycles !== false) {
    console.log('  Checking for circular dependencies...');
    const cycles = detectCycles(packages);
    violations.push(...cycles);
    console.log(`  Found ${cycles.length} circular dependency issue(s)`);
  }

  if (config.boundaryRules && config.boundaryRules.length > 0) {
    console.log('  Checking boundary rules...');
    const boundaryViolations = detectBoundaryViolations(packages, config);
    violations.push(...boundaryViolations);
    console.log(`  Found ${boundaryViolations.length} boundary violation(s)`);
  }

  // Step 4: Generate outputs
  console.log('\n📄 Step 4: Generating outputs...');
  generateJsonOutput(packages, violations, `${outputDir}/graph.json`);
  generateDotOutput(packages, violations, `${outputDir}/graph.dot`);

  // Summary
  console.log('\n✅ Analysis complete!');
  console.log('\nSummary:');
  console.log(`  Packages analyzed: ${packages.size}`);
  console.log(`  Total violations: ${violations.length}`);

  if (violations.length > 0) {
    console.log('\n⚠️  Violations found:');
    for (const violation of violations) {
      console.log(`  - [${violation.type.toUpperCase()}] ${violation.message}`);
    }
    console.log('\nRun the UI to explore the dependency graph and violations.');
  } else {
    console.log('\n✨ No violations detected!');
  }
}
