# Plugin Development Guide

This guide explains how to create custom plugins for the Monorepo Dependency Map Visualizer.

## Plugin Types

Monomap supports four types of plugins:

### 1. Analyzer Plugins

Extend dependency analysis to handle additional file types or import patterns.

```typescript
import { AnalyzerPlugin } from 'monomap/plugins';

export const cssModuleAnalyzer: AnalyzerPlugin = {
  name: 'css-module-analyzer',
  version: '1.0.0',
  description: 'Analyzes CSS module imports',

  async analyzeDependencies(packageInfo, config) {
    // Find CSS module imports
    const cssImports: string[] = [];

    // Your custom logic here
    // Return array of package names this package depends on

    return cssImports;
  },
};
```

**Use Cases:**
- Analyze CSS module dependencies
- Handle asset imports (images, fonts)
- Parse configuration file references
- Detect runtime dependencies

### 2. Rule Plugins

Define custom boundary rules beyond the built-in pattern matching.

```typescript
import { RulePlugin, Violation } from 'monomap/plugins';

export const complexityRule: RulePlugin = {
  name: 'max-dependencies-rule',
  version: '1.0.0',
  description: 'Enforce maximum dependency count per package',

  async evaluateRules(packages, config) {
    const violations: Violation[] = [];
    const MAX_DEPS = 10;

    for (const [name, info] of packages.entries()) {
      if (info.dependencies.length > MAX_DEPS) {
        violations.push({
          type: 'boundary',
          message: `Package ${name} has too many dependencies (${info.dependencies.length} > ${MAX_DEPS})`,
          packages: [name],
          rule: 'max-dependencies',
        });
      }
    }

    return violations;
  },
};
```

**Use Cases:**
- Enforce dependency budgets
- Check package naming conventions
- Validate dependency versions
- Detect anti-patterns

### 3. Exporter Plugins

Export analysis results to custom formats.

```typescript
import { ExporterPlugin } from 'monomap/plugins';
import * as fs from 'fs';

export const plantUMLExporter: ExporterPlugin = {
  name: 'plantuml-exporter',
  version: '1.0.0',
  fileExtension: 'puml',
  description: 'Export to PlantUML format',

  async export(graph, outputPath) {
    const lines: string[] = [];

    lines.push('@startuml');
    lines.push('');

    // Convert graph to PlantUML syntax
    for (const [name, pkg] of Object.entries(graph.packages)) {
      for (const dep of pkg.dependencies) {
        lines.push(`[${name}] --> [${dep}]`);
      }
    }

    lines.push('@enduml');

    fs.writeFileSync(outputPath, lines.join('\n'));
    console.log(`✓ PlantUML exported to: ${outputPath}`);
  },
};
```

**Use Cases:**
- Custom diagram formats
- Integration with documentation tools
- Export to architecture analysis platforms
- Generate custom reports

### 4. Metric Collector Plugins

Collect custom metrics from the dependency graph.

```typescript
import { MetricCollectorPlugin } from 'monomap/plugins';

export const healthScoreCollector: MetricCollectorPlugin = {
  name: 'health-score-collector',
  version: '1.0.0',
  description: 'Calculate architecture health scores',

  async collectMetrics(packages, graph) {
    const metrics: Record<string, any> = {};

    // Calculate various health metrics
    const avgDepsPerPackage = Array.from(packages.values())
      .reduce((sum, pkg) => sum + pkg.dependencies.length, 0) / packages.size;

    metrics.average_dependencies = avgDepsPerPackage;
    metrics.violation_ratio = graph.violations.length / packages.size;

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= graph.violations.length * 5;
    healthScore -= Math.max(0, avgDepsPerPackage - 3) * 2;

    metrics.health_score = Math.max(0, healthScore);

    return metrics;
  },
};
```

**Use Cases:**
- Calculate architecture quality scores
- Track technical debt
- Measure coupling and cohesion
- Generate custom KPIs

## Registering Plugins

### Option 1: Register Programmatically

```typescript
import { pluginRegistry } from 'monomap/plugins';
import { cssModuleAnalyzer } from './my-plugin';

pluginRegistry.registerAnalyzer(cssModuleAnalyzer);
```

### Option 2: Create a Plugin Package

```json
{
  "name": "@myorg/monomap-plugin-css",
  "version": "1.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "monomap": "^2.0.0"
  }
}
```

```typescript
// dist/index.ts
export { cssModuleAnalyzer } from './css-analyzer';

// Auto-register on import
import { pluginRegistry } from 'monomap/plugins';
import { cssModuleAnalyzer } from './css-analyzer';

pluginRegistry.registerAnalyzer(cssModuleAnalyzer);
```

### Option 3: Configuration File (Future)

```json
{
  "plugins": [
    "@myorg/monomap-plugin-css",
    "./custom-plugins/my-analyzer.js"
  ]
}
```

## Plugin Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async analyzeDependencies(packageInfo, config) {
  try {
    // Your analysis logic
  } catch (error) {
    console.warn(`Plugin ${this.name} failed for ${packageInfo.name}:`, error);
    return []; // Return empty instead of throwing
  }
}
```

### 2. Performance

Be mindful of performance with large monorepos:

```typescript
// Good: Batch operations
const results = await Promise.all(
  packages.map(pkg => analyzePackage(pkg))
);

// Bad: Sequential operations
for (const pkg of packages) {
  await analyzePackage(pkg); // Slow!
}
```

### 3. Configuration

Accept configuration through the config object:

```typescript
async evaluateRules(packages, config) {
  const maxDeps = config.pluginConfig?.maxDependencies || 10;
  // Use the configuration
}
```

### 4. Testing

Write tests for your plugins:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyPlugin', () => {
  it('should analyze dependencies correctly', async () => {
    const result = await myPlugin.analyzeDependencies(testPackage, testConfig);
    expect(result).toContain('expected-dependency');
  });
});
```

## Example: Complete Plugin Package

Here's a complete example of a plugin package:

```
my-plugin/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── analyzer.ts
│   └── __tests__/
│       └── analyzer.test.ts
└── README.md
```

**src/analyzer.ts:**

```typescript
import { AnalyzerPlugin, PackageInfo, MonorepoMapConfig } from 'monomap/plugins';
import * as fs from 'fs';
import * as path from 'path';

export const sassAnalyzer: AnalyzerPlugin = {
  name: 'sass-analyzer',
  version: '1.0.0',
  description: 'Analyzes SASS/SCSS @import statements',

  async analyzeDependencies(packageInfo: PackageInfo, config: MonorepoMapConfig): Promise<string[]> {
    const dependencies: Set<string> = new Set();

    // Find all .scss files
    const scssFiles = await findFiles(packageInfo.path, '**/*.scss');

    for (const file of scssFiles) {
      const content = fs.readFileSync(file, 'utf-8');

      // Match @import statements
      const importRegex = /@import\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Check if this imports a package
        const packageName = extractPackageName(importPath);
        if (packageName) {
          dependencies.add(packageName);
        }
      }
    }

    return Array.from(dependencies);
  },
};

function extractPackageName(importPath: string): string | null {
  // Handle scoped packages: @myorg/package/file
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }

  // Handle regular packages: package/file
  return importPath.split('/')[0];
}

async function findFiles(dir: string, pattern: string): Promise<string[]> {
  // Implementation to find files matching pattern
  return [];
}
```

**src/index.ts:**

```typescript
export { sassAnalyzer } from './analyzer';

// Auto-register if imported
if (typeof window === 'undefined') {
  import('monomap/plugins').then(({ pluginRegistry }) => {
    pluginRegistry.registerAnalyzer(sassAnalyzer);
  });
}
```

## Publishing Your Plugin

1. **Naming Convention**: Use `monomap-plugin-*` or `@scope/monomap-plugin-*`

2. **Package.json Setup**:

```json
{
  "name": "@myorg/monomap-plugin-sass",
  "keywords": ["monomap", "plugin", "sass", "scss"],
  "peerDependencies": {
    "monomap": "^2.0.0"
  }
}
```

3. **Documentation**: Include README with:
   - What the plugin does
   - Installation instructions
   - Configuration options
   - Examples

4. **Publish to npm**:

```bash
npm publish --access public
```

## Community Plugins

Share your plugins! Open a PR to add them to the community plugins list:

- `@monomap/plugin-css-modules` - Analyze CSS module dependencies
- `@monomap/plugin-architecture-rules` - Advanced architecture rules
- `@monomap/plugin-complexity` - Measure package complexity

## Support

- **Issues**: https://github.com/yourusername/monorepo-dependency-map-visualizer/issues
- **Discussions**: https://github.com/yourusername/monorepo-dependency-map-visualizer/discussions
- **Examples**: https://github.com/yourusername/monomap-plugin-examples
