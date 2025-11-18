import * as fs from 'fs';
import * as path from 'path';
import { PackageInfo, Violation } from '../types/graph';

/**
 * Generate Mermaid diagram format output
 * Mermaid is widely supported in GitHub, GitLab, and many documentation tools
 */
export function generateMermaidOutput(
  packages: Map<string, PackageInfo>,
  violations: Violation[],
  outputPath: string = './analysis/graph.mmd'
): void {
  console.log(`\nGenerating Mermaid diagram output...`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const lines: string[] = [];

  // Header
  lines.push('```mermaid');
  lines.push('graph LR');
  lines.push('  %% Monorepo Dependency Graph');
  lines.push('');

  // Create safe node IDs (Mermaid doesn't like special characters)
  const nodeIds = new Map<string, string>();
  let idCounter = 0;
  for (const name of packages.keys()) {
    nodeIds.set(name, `pkg${idCounter++}`);
  }

  // Define nodes with labels and styles
  lines.push('  %% Nodes');
  for (const [name, info] of packages.entries()) {
    const nodeId = nodeIds.get(name)!;
    const label = name.replace(/[@/]/g, '_'); // Sanitize for display
    const styleClass = info.type === 'app' ? 'app' : 'package';
    lines.push(`  ${nodeId}["${name}"]:::${styleClass}`);
  }

  lines.push('');
  lines.push('  %% Dependencies');

  // Track edges that are part of cycles for styling
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
    const fromId = nodeIds.get(name)!;
    for (const dep of info.dependencies) {
      if (packages.has(dep)) {
        const toId = nodeIds.get(dep)!;
        const edgeKey = `${name}->${dep}`;
        const styleClass = cycleEdges.has(edgeKey) ? 'cyclic' : 'normal';
        lines.push(`  ${fromId} -->|${styleClass}| ${toId}`);
      }
    }
  }

  lines.push('');
  lines.push('  %% Styles');
  lines.push('  classDef app fill:#60a5fa,stroke:#2563eb,stroke-width:2px,color:#fff');
  lines.push('  classDef package fill:#34d399,stroke:#059669,stroke-width:2px,color:#000');
  lines.push('  linkStyle default stroke:#9ca3af,stroke-width:2px');

  lines.push('```');

  // Add violations as comments
  if (violations.length > 0) {
    lines.push('');
    lines.push('<!-- Violations Detected -->');
    for (const violation of violations) {
      lines.push(`<!-- ${violation.type.toUpperCase()}: ${violation.message} -->`);
      lines.push(`<!-- Packages: ${violation.packages.join(' → ')} -->`);
    }
  }

  // Write to file
  fs.writeFileSync(outputPath, lines.join('\n'));

  console.log(`✓ Mermaid output written to: ${outputPath}`);
  console.log(`  You can embed this in GitHub/GitLab README or use with mermaid-cli`);
}
