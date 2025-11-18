import * as fs from 'fs';
import * as path from 'path';
import { MonorepoMapConfig, defaultConfig } from '../types/config';

export function loadConfig(configPath?: string): MonorepoMapConfig {
  const defaultConfigPath = 'monorepo-map.config.json';
  const finalPath = configPath || defaultConfigPath;

  if (!fs.existsSync(finalPath)) {
    if (configPath) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    console.log('No config file found, using default configuration');
    return { ...defaultConfig };
  }

  try {
    const configContent = fs.readFileSync(finalPath, 'utf-8');
    const userConfig = JSON.parse(configContent) as Partial<MonorepoMapConfig>;

    // Merge with defaults
    const config: MonorepoMapConfig = {
      ...defaultConfig,
      ...userConfig,
      boundaryRules: userConfig.boundaryRules || defaultConfig.boundaryRules,
    };

    // Set root directory to config file location if not specified
    if (!config.rootDir) {
      config.rootDir = path.dirname(path.resolve(finalPath));
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load config: ${error}`);
  }
}

export function validateConfig(config: MonorepoMapConfig): void {
  if (!config.rootPatterns || config.rootPatterns.length === 0) {
    throw new Error('Config must specify at least one rootPattern');
  }

  if (config.boundaryRules) {
    for (const rule of config.boundaryRules) {
      if (!rule.name || !rule.from || !rule.to) {
        throw new Error('Boundary rules must have name, from, and to properties');
      }
    }
  }
}
