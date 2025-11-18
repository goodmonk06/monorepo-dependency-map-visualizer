import { describe, it, expect } from 'vitest';
import { detectCycles, detectBoundaryViolations } from '../violation-detector';
import { PackageInfo } from '../../types/graph';
import { MonorepoMapConfig } from '../../types/config';

describe('Cycle Detection', () => {
  it('should detect simple circular dependency', () => {
    const packages = new Map<string, PackageInfo>([
      ['pkg-a', {
        name: 'pkg-a',
        path: '/test/pkg-a',
        type: 'package',
        dependencies: ['pkg-b'],
      }],
      ['pkg-b', {
        name: 'pkg-b',
        path: '/test/pkg-b',
        type: 'package',
        dependencies: ['pkg-a'],
      }],
    ]);

    const violations = detectCycles(packages);

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('cycle');
    expect(violations[0].packages).toContain('pkg-a');
    expect(violations[0].packages).toContain('pkg-b');
  });

  it('should detect longer circular dependency chain', () => {
    const packages = new Map<string, PackageInfo>([
      ['pkg-a', {
        name: 'pkg-a',
        path: '/test/pkg-a',
        type: 'package',
        dependencies: ['pkg-b'],
      }],
      ['pkg-b', {
        name: 'pkg-b',
        path: '/test/pkg-b',
        type: 'package',
        dependencies: ['pkg-c'],
      }],
      ['pkg-c', {
        name: 'pkg-c',
        path: '/test/pkg-c',
        type: 'package',
        dependencies: ['pkg-a'],
      }],
    ]);

    const violations = detectCycles(packages);

    expect(violations).toHaveLength(1);
    expect(violations[0].packages).toHaveLength(4); // a -> b -> c -> a
  });

  it('should not detect cycles in acyclic graph', () => {
    const packages = new Map<string, PackageInfo>([
      ['pkg-a', {
        name: 'pkg-a',
        path: '/test/pkg-a',
        type: 'package',
        dependencies: ['pkg-b', 'pkg-c'],
      }],
      ['pkg-b', {
        name: 'pkg-b',
        path: '/test/pkg-b',
        type: 'package',
        dependencies: ['pkg-d'],
      }],
      ['pkg-c', {
        name: 'pkg-c',
        path: '/test/pkg-c',
        type: 'package',
        dependencies: ['pkg-d'],
      }],
      ['pkg-d', {
        name: 'pkg-d',
        path: '/test/pkg-d',
        type: 'package',
        dependencies: [],
      }],
    ]);

    const violations = detectCycles(packages);

    expect(violations).toHaveLength(0);
  });

  it('should handle self-referencing package', () => {
    const packages = new Map<string, PackageInfo>([
      ['pkg-a', {
        name: 'pkg-a',
        path: '/test/pkg-a',
        type: 'package',
        dependencies: ['pkg-a'],
      }],
    ]);

    const violations = detectCycles(packages);

    expect(violations).toHaveLength(1);
    expect(violations[0].packages).toEqual(['pkg-a', 'pkg-a']);
  });
});

describe('Boundary Violation Detection', () => {
  it('should detect app-to-app dependencies', () => {
    const packages = new Map<string, PackageInfo>([
      ['app-web', {
        name: 'app-web',
        path: '/test/apps/web',
        type: 'app',
        dependencies: [],
      }],
      ['app-mobile', {
        name: 'app-mobile',
        path: '/test/apps/mobile',
        type: 'app',
        dependencies: ['app-web'],
      }],
    ]);

    const config: MonorepoMapConfig = {
      rootPatterns: ['apps/*'],
      detectCycles: true,
      exclude: ['node_modules'],
      boundaryRules: [
        {
          name: 'no-app-to-app',
          from: 'apps/*',
          to: 'apps/*',
          message: 'Apps should not depend on other apps',
        },
      ],
    };

    const violations = detectBoundaryViolations(packages, config);

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('boundary');
    expect(violations[0].rule).toBe('no-app-to-app');
    expect(violations[0].packages).toEqual(['app-mobile', 'app-web']);
  });

  it('should detect wildcard pattern violations', () => {
    const packages = new Map<string, PackageInfo>([
      ['@myorg/public-api', {
        name: '@myorg/public-api',
        path: '/test/packages/public-api',
        type: 'package',
        dependencies: ['@myorg/internal-utils'],
      }],
      ['@myorg/internal-utils', {
        name: '@myorg/internal-utils',
        path: '/test/packages/internal-utils',
        type: 'package',
        dependencies: [],
      }],
    ]);

    const config: MonorepoMapConfig = {
      rootPatterns: ['packages/*'],
      detectCycles: true,
      exclude: ['node_modules'],
      boundaryRules: [
        {
          name: 'no-internal-deps',
          from: '@myorg/public-*',
          to: '@myorg/internal-*',
          message: 'Public packages cannot depend on internal packages',
        },
      ],
    };

    const violations = detectBoundaryViolations(packages, config);

    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('Public packages cannot depend on internal packages');
  });

  it('should not detect violations when rules are satisfied', () => {
    const packages = new Map<string, PackageInfo>([
      ['app-web', {
        name: 'app-web',
        path: '/test/apps/web',
        type: 'app',
        dependencies: ['pkg-ui'],
      }],
      ['pkg-ui', {
        name: 'pkg-ui',
        path: '/test/packages/ui',
        type: 'package',
        dependencies: [],
      }],
    ]);

    const config: MonorepoMapConfig = {
      rootPatterns: ['apps/*', 'packages/*'],
      detectCycles: true,
      exclude: ['node_modules'],
      boundaryRules: [
        {
          name: 'no-app-to-app',
          from: 'apps/*',
          to: 'apps/*',
          message: 'Apps should not depend on other apps',
        },
      ],
    };

    const violations = detectBoundaryViolations(packages, config);

    expect(violations).toHaveLength(0);
  });

  it('should return empty array when no boundary rules defined', () => {
    const packages = new Map<string, PackageInfo>([
      ['pkg-a', {
        name: 'pkg-a',
        path: '/test/pkg-a',
        type: 'package',
        dependencies: ['pkg-b'],
      }],
      ['pkg-b', {
        name: 'pkg-b',
        path: '/test/pkg-b',
        type: 'package',
        dependencies: [],
      }],
    ]);

    const config: MonorepoMapConfig = {
      rootPatterns: ['packages/*'],
      detectCycles: true,
      exclude: ['node_modules'],
      boundaryRules: [],
    };

    const violations = detectBoundaryViolations(packages, config);

    expect(violations).toHaveLength(0);
  });
});
