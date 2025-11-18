import * as fs from 'fs';
import * as path from 'path';
import { MonorepoMapConfig, defaultConfig, MonorepoMapConfigSchema } from '../types/config';
import { ZodError } from 'zod';

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
    const userConfig = JSON.parse(configContent);

    // Merge with defaults
    const mergedConfig = {
      ...defaultConfig,
      ...userConfig,
      boundaryRules: userConfig.boundaryRules || defaultConfig.boundaryRules,
    };

    // Validate using zod schema
    const validatedConfig = MonorepoMapConfigSchema.parse(mergedConfig);

    // Set root directory to config file location if not specified
    if (!validatedConfig.rootDir) {
      validatedConfig.rootDir = path.dirname(path.resolve(finalPath));
    }

    return validatedConfig;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) =>
        `  - ${err.path.join('.')}: ${err.message}`
      ).join('\n');
      throw new Error(`Config validation failed:\n${formattedErrors}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${error.message}`);
    }
    throw new Error(`Failed to load config: ${error}`);
  }
}

export function validateConfig(config: MonorepoMapConfig): void {
  try {
    MonorepoMapConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) =>
        `  - ${err.path.join('.')}: ${err.message}`
      ).join('\n');
      throw new Error(`Config validation failed:\n${formattedErrors}`);
    }
    throw error;
  }
}
