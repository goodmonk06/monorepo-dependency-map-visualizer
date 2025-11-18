#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, validateConfig } from './config/loader';
import { runAnalysis } from './analyzer';

const program = new Command();

program
  .name('monomap')
  .description('Monorepo dependency visualizer')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze monorepo dependencies and detect violations')
  .option('-c, --config <path>', 'Path to config file', 'monorepo-map.config.json')
  .option('-o, --output <path>', 'Output directory for analysis results', './analysis')
  .action(async (options) => {
    try {
      console.log('Loading configuration...');
      const config = loadConfig(options.config);

      console.log('Validating configuration...');
      validateConfig(config);

      await runAnalysis({
        config,
        outputDir: options.output,
      });
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new monorepo-map.config.json file')
  .action(() => {
    const fs = require('fs');
    const path = require('path');

    const configPath = 'monorepo-map.config.json';

    if (fs.existsSync(configPath)) {
      console.error('❌ Config file already exists!');
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

program.parse();
