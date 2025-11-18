import * as fs from 'fs';
import * as path from 'path';
import { PackageInfo, Violation } from '../types/graph';

export function generateDotOutput(
  packages: Map<string, PackageInfo>,
  violations: Violation[],
  outputPath: string = './analysis/graph.dot'
): void {
  console.log(`\nGenerating Graphviz DOT output...`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const lines: string[] = [];

  // Header
  lines.push('digraph MonorepoDependencies {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style=rounded];');
  lines.push('');

  // Define nodes
  lines.push('  // Nodes');
  for (const [name, info] of packages.entries()) {
    const color = info.type === 'app' ? 'lightblue' : 'lightgreen';
    const label = name.replace(/"/g, '\\"');
    lines.push(`  "${label}" [fillcolor=${color}, style="rounded,filled"];`);
  }

  lines.push('');
  lines.push('  // Edges');

  // Track edges that are part of cycles
  const cycleEdges = new Set<string>();
  for (const violation of violations) {
    if (violation.type === 'cycle') {
      for (let i = 0; i < violation.packages.length - 1; i++) {
        const from = violation.packages[i];
        const to = violation.packages[i + 1];
        cycleEdges.add(`${from}->${to}`);
      }
    }
  }

  // Define edges
  for (const [name, info] of packages.entries()) {
    const fromLabel = name.replace(/"/g, '\\"');
    for (const dep of info.dependencies) {
      if (packages.has(dep)) {
        const toLabel = dep.replace(/"/g, '\\"');
        const edgeKey = `${name}->${dep}`;
        const color = cycleEdges.has(edgeKey) ? 'red' : 'black';
        const style = cycleEdges.has(edgeKey) ? ', style=bold' : '';
        lines.push(`  "${fromLabel}" -> "${toLabel}" [color=${color}${style}];`);
      }
    }
  }

  lines.push('}');

  // Write to file
  fs.writeFileSync(outputPath, lines.join('\n'));

  console.log(`✓ DOT output written to: ${outputPath}`);
  console.log(`  You can visualize this with: dot -Tpng ${outputPath} -o graph.png`);
}
