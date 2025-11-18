import * as fs from 'fs';
import * as path from 'path';
import { DependencyGraph } from '../types/graph';

/**
 * Generate standalone HTML report with embedded visualization
 */
export function generateHtmlReport(
  graph: DependencyGraph,
  outputPath: string = './analysis/report.html'
): void {
  console.log(`\nGenerating HTML report...`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monorepo Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .meta { color: #6b7280; font-size: 14px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
    .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .violations {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .violation {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #ef4444;
      background: #fef2f2;
      border-radius: 4px;
    }
    .violation-type {
      font-weight: bold;
      color: #991b1b;
      text-transform: uppercase;
      font-size: 12px;
    }
    .violation-message { color: #7f1d1d; margin: 5px 0; }
    .violation-packages { color: #991b1b; font-size: 14px; font-family: 'Courier New', monospace; }
    .packages {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .package {
      padding: 15px;
      margin: 10px 0;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    .package-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .package-name { font-weight: bold; color: #1f2937; }
    .package-type {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .type-app { background: #dbeafe; color: #1e40af; }
    .type-package { background: #d1fae5; color: #065f46; }
    .dependencies { color: #6b7280; font-size: 14px; }
    .no-violations {
      text-align: center;
      padding: 40px;
      color: #059669;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Monorepo Analysis Report</h1>
      <div class="meta">
        Generated: ${new Date(graph.metadata.analyzedAt).toLocaleString()}
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${graph.metadata.totalPackages}</div>
        <div class="stat-label">Total Packages</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${graph.metadata.totalDependencies}</div>
        <div class="stat-label">Total Dependencies</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${graph.violations.length > 0 ? 'style="color: #ef4444;"' : 'style="color: #059669;"'}">${graph.violations.length}</div>
        <div class="stat-label">Violations</div>
      </div>
    </div>

    <div class="violations">
      <h2 style="margin-bottom: 15px; color: #1f2937;">Violations</h2>
      ${graph.violations.length === 0
        ? '<div class="no-violations">✓ No violations detected! Your architecture is clean.</div>'
        : graph.violations.map(v => `
          <div class="violation">
            <div class="violation-type">${v.type}</div>
            <div class="violation-message">${v.message}</div>
            <div class="violation-packages">${v.packages.join(' → ')}</div>
            ${v.rule ? `<div style="color: #6b7280; font-size: 12px; margin-top: 5px;">Rule: ${v.rule}</div>` : ''}
          </div>
        `).join('')}
    </div>

    <div class="packages">
      <h2 style="margin-bottom: 15px; color: #1f2937;">Packages</h2>
      ${Object.entries(graph.packages).map(([name, pkg]) => `
        <div class="package">
          <div class="package-header">
            <span class="package-name">${name}</span>
            <span class="package-type type-${pkg.type}">${pkg.type}</span>
          </div>
          ${pkg.version ? `<div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">v${pkg.version}</div>` : ''}
          <div class="dependencies">
            ${pkg.dependencies.length > 0
              ? `<strong>Dependencies (${pkg.dependencies.length}):</strong> ${pkg.dependencies.join(', ')}`
              : '<em>No internal dependencies</em>'}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);

  console.log(`✓ HTML report written to: ${outputPath}`);
  console.log(`  Open in browser: file://${path.resolve(outputPath)}`);
}
