import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, validateConfig } from '../loader';
import { MonorepoMapConfig } from '../../types/config';

describe('Config Loader', () => {
  const testConfigDir = path.join(process.cwd(), '__test_configs__');

  beforeEach(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  it('should load valid config file', () => {
    const configPath = path.join(testConfigDir, 'valid-config.json');
    const validConfig = {
      rootPatterns: ['packages/*', 'apps/*'],
      detectCycles: true,
      boundaryRules: [
        {
          name: 'test-rule',
          from: 'apps/*',
          to: 'apps/*',
          message: 'Test message',
        },
      ],
    };

    fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

    const config = loadConfig(configPath);

    expect(config.rootPatterns).toEqual(['packages/*', 'apps/*']);
    expect(config.detectCycles).toBe(true);
    expect(config.boundaryRules).toHaveLength(1);
    expect(config.boundaryRules![0].name).toBe('test-rule');
  });

  it('should throw error for invalid JSON', () => {
    const configPath = path.join(testConfigDir, 'invalid.json');
    fs.writeFileSync(configPath, '{ invalid json }');

    expect(() => loadConfig(configPath)).toThrow('Invalid JSON');
  });

  it('should use defaults when only detecting cycles is set', () => {
    const configPath = path.join(testConfigDir, 'minimal-config.json');
    // With zod defaults, this would get filled in with default rootPatterns
    // But in the merge, we don't have rootPatterns so it should come from defaults
    fs.writeFileSync(configPath, JSON.stringify({
      rootPatterns: ['my-custom/*'],
      detectCycles: false
    }));

    const config = loadConfig(configPath);
    expect(config.rootPatterns).toEqual(['my-custom/*']);
    expect(config.detectCycles).toBe(false);
  });

  it('should throw error for empty rootPatterns', () => {
    const configPath = path.join(testConfigDir, 'empty-patterns.json');
    fs.writeFileSync(configPath, JSON.stringify({ rootPatterns: [] }));

    expect(() => loadConfig(configPath)).toThrow('At least one root pattern is required');
  });

  it('should validate boundary rules', () => {
    const configPath = path.join(testConfigDir, 'invalid-rule.json');
    const invalidConfig = {
      rootPatterns: ['packages/*'],
      boundaryRules: [
        {
          name: '',  // Empty name should fail
          from: 'apps/*',
          to: 'packages/*',
        },
      ],
    };

    fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

    expect(() => loadConfig(configPath)).toThrow('Boundary rule name cannot be empty');
  });

  it('should use default config when no config path provided and file not found', () => {
    // Move to a directory where there's no config file
    const originalCwd = process.cwd();
    try {
      process.chdir(testConfigDir);
      const config = loadConfig();
      expect(config.rootPatterns).toEqual(['packages/*', 'apps/*']);
      expect(config.detectCycles).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should merge user config with defaults', () => {
    const configPath = path.join(testConfigDir, 'partial-config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      rootPatterns: ['custom/*'],
    }));

    const config = loadConfig(configPath);

    expect(config.rootPatterns).toEqual(['custom/*']);
    expect(config.detectCycles).toBe(true); // Should use default
    expect(config.exclude).toContain('node_modules'); // Should use default
  });
});

describe('validateConfig', () => {
  it('should validate correct config', () => {
    const validConfig: MonorepoMapConfig = {
      rootPatterns: ['packages/*'],
      detectCycles: true,
      boundaryRules: [],
      exclude: ['node_modules'],
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should throw for invalid config with empty rootPatterns', () => {
    const invalidConfig = {
      rootPatterns: [],
      detectCycles: true,
      exclude: [],
      boundaryRules: [],
    } as MonorepoMapConfig;

    expect(() => validateConfig(invalidConfig)).toThrow();
  });
});
