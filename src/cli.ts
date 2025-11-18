#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, validateConfig } from './config/loader';
import { runAnalysis } from './analyzer';
import { metrics } from './lib/metrics';
import { logger, LogLevel } from './lib/logger';
import * as fs from 'fs';

const program = new Command();

program
  .name('monomap')
  .description('Monorepo dependency visualizer')
  .version('2.0.0')
  .option('--debug', 'Enable debug logging')
  .option('--quiet', 'Suppress non-essential output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.debug) {
      logger.setLevel(LogLevel.DEBUG);
    } else if (opts.quiet) {
      logger.setLevel(LogLevel.ERROR);
    }
  });

program
  .command('analyze')
  .description('Analyze monorepo dependencies and detect violations')
  .option('-c, --config <path>', 'Path to config file', 'monorepo-map.config.json')
  .option('-o, --output <path>', 'Output directory for analysis results', './analysis')
  .option('--format <formats...>', 'Output formats (json, dot, mermaid, html)', ['json', 'dot', 'mermaid', 'html'])
  .action(async (options) => {
    try {
      console.log('Loading configuration...');
      const config = loadConfig(options.config);

      console.log('Validating configuration...');
      validateConfig(config);

      await runAnalysis({
        config,
        outputDir: options.output,
        formats: options.format,
      });
    } catch (error) {
      logger.error('Analysis failed', error as Error);
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new monorepo-map.config.json file')
  .option('--force', 'Overwrite existing config file')
  .action((options) => {
    const configPath = 'monorepo-map.config.json';

    if (fs.existsSync(configPath) && !options.force) {
      console.error('❌ Config file already exists! Use --force to overwrite.');
      process.exit(1);
    }

    const defaultConfig = {
      rootPatterns: ['packages/*', 'apps/*'],
      detectCycles: true,
      boundaryRules: [
        {
          name: 'apps-cannot-depend-on-apps',
          from: 'apps/*',
          to: 'apps/*',
          message: 'Applications should not depend on other applications',
        },
      ],
      exclude: ['node_modules', 'dist', 'build', '.next'],
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`✅ Created ${configPath}`);
    console.log('\nEdit this file to customize your analysis configuration.');
  });

program
  .command('report')
  .description('Generate a standalone HTML report from analysis results')
  .option('-i, --input <path>', 'Path to analysis JSON file', './analysis/graph.json')
  .option('-o, --output <path>', 'Output path for HTML report', './analysis/report.html')
  .action((options) => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error('❌ Analysis file not found! Run `monomap analyze` first.');
        process.exit(1);
      }

      const graphData = JSON.parse(fs.readFileSync(options.input, 'utf-8'));
      const { generateHtmlReport } = require('./output/html-generator');

      generateHtmlReport(graphData, options.output);
      console.log('✅ HTML report generated successfully!');
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('metrics')
  .description('Display collected metrics from the last analysis')
  .option('--json', 'Output metrics as JSON')
  .action((options) => {
    const summary = metrics.getSummary();

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log('\n📊 Metrics Summary\n');

      console.log('Counters:');
      if (summary.counters.length === 0) {
        console.log('  (none)');
      } else {
        for (const counter of summary.counters) {
          const labels = Object.entries(counter.labels).map(([k, v]) => `${k}=${v}`).join(', ');
          console.log(`  ${counter.name}${labels ? ` (${labels})` : ''}: ${counter.value}`);
        }
      }

      console.log('\nGauges:');
      if (Object.keys(summary.gauges).length === 0) {
        console.log('  (none)');
      } else {
        for (const [name, value] of Object.entries(summary.gauges)) {
          console.log(`  ${name}: ${value}`);
        }
      }

      console.log('\nHistograms:');
      if (Object.keys(summary.histograms).length === 0) {
        console.log('  (none)');
      } else {
        for (const [name, stats] of Object.entries(summary.histograms)) {
          if (stats) {
            console.log(`  ${name}:`);
            console.log(`    count: ${stats.count}`);
            console.log(`    avg: ${stats.avg.toFixed(2)}`);
            console.log(`    min: ${stats.min}`);
            console.log(`    max: ${stats.max}`);
          }
        }
      }
    }
  });

program
  .command('validate')
  .description('Validate config file without running analysis')
  .option('-c, --config <path>', 'Path to config file', 'monorepo-map.config.json')
  .action((options) => {
    try {
      console.log('Loading configuration...');
      const config = loadConfig(options.config);

      console.log('Validating configuration...');
      validateConfig(config);

      console.log('✅ Configuration is valid!');
      console.log('\nConfig summary:');
      console.log(`  Root patterns: ${config.rootPatterns.join(', ')}`);
      console.log(`  Detect cycles: ${config.detectCycles}`);
      console.log(`  Boundary rules: ${config.boundaryRules?.length || 0}`);
      console.log(`  Exclude patterns: ${config.exclude?.join(', ') || 'none'}`);
    } catch (error) {
      console.error('\n❌ Configuration is invalid:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
