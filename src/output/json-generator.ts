import * as fs from 'fs';
import * as path from 'path';
import { DependencyGraph, PackageInfo } from '../types/graph';

export function generateJsonOutput(
  packages: Map<string, PackageInfo>,
  violations: any[],
  outputPath: string = './analysis/graph.json'
): void {
  console.log(`\nGenerating JSON output...`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the graph object
  const packagesObj: Record<string, PackageInfo> = {};
  let totalDependencies = 0;

  for (const [name, info] of packages.entries()) {
    packagesObj[name] = info;
    totalDependencies += info.dependencies.length;
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

  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

  console.log(`✓ JSON output written to: ${outputPath}`);
  console.log(`  - Total packages: ${packages.size}`);
  console.log(`  - Total dependencies: ${totalDependencies}`);
  console.log(`  - Violations: ${violations.length}`);
}
