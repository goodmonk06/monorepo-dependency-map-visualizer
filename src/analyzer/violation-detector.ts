import { PackageInfo, Violation } from '../types/graph';
import { MonorepoMapConfig } from '../types/config';

/**
 * Detects cycles in the dependency graph using DFS
 */
export function detectCycles(packages: Map<string, PackageInfo>): Violation[] {
  const violations: Violation[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(packageName: string): boolean {
    if (recursionStack.has(packageName)) {
      // Found a cycle
      const cycleStart = currentPath.indexOf(packageName);
      const cycle = [...currentPath.slice(cycleStart), packageName];

      violations.push({
        type: 'cycle',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        packages: cycle,
      });

      return true;
    }

    if (visited.has(packageName)) {
      return false;
    }

    visited.add(packageName);
    recursionStack.add(packageName);
    currentPath.push(packageName);

    const packageInfo = packages.get(packageName);
    if (packageInfo) {
      for (const dependency of packageInfo.dependencies) {
        if (packages.has(dependency)) {
          dfs(dependency);
        }
      }
    }

    currentPath.pop();
    recursionStack.delete(packageName);

    return false;
  }

  // Run DFS from each package
  for (const packageName of packages.keys()) {
    if (!visited.has(packageName)) {
      dfs(packageName);
    }
  }

  return violations;
}

/**
 * Detects boundary violations based on configured rules
 */
export function detectBoundaryViolations(
  packages: Map<string, PackageInfo>,
  config: MonorepoMapConfig
): Violation[] {
  const violations: Violation[] = [];

  if (!config.boundaryRules || config.boundaryRules.length === 0) {
    return violations;
  }

  for (const [packageName, packageInfo] of packages.entries()) {
    for (const dependency of packageInfo.dependencies) {
      const depInfo = packages.get(dependency);
      if (!depInfo) continue;

      // Check each boundary rule
      for (const rule of config.boundaryRules) {
        if (matchesPattern(packageName, packageInfo, rule.from) &&
            matchesPattern(dependency, depInfo, rule.to)) {
          violations.push({
            type: 'boundary',
            message:
              rule.message ||
              `Forbidden dependency: ${packageName} should not depend on ${dependency}`,
            packages: [packageName, dependency],
            rule: rule.name,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check if a package matches a pattern (supports wildcards and type-based matching)
 * Patterns can match:
 * - Package name: "@myorg/package-*"
 * - Type shorthand: "apps/*" matches all apps, "packages/*" matches all packages
 */
function matchesPattern(packageName: string, packageInfo: PackageInfo, pattern: string): boolean {
  // Check for type-based matching shortcuts
  if (pattern === 'apps/*') {
    return packageInfo.type === 'app';
  }
  if (pattern === 'packages/*') {
    return packageInfo.type === 'package';
  }

  // Support for simple wildcards using glob-style patterns
  // e.g., "@myorg/package-*"
  if (pattern.includes('*')) {
    return matchGlobPattern(packageName, pattern);
  }

  // Exact match
  return packageName === pattern;
}

function matchGlobPattern(input: string, pattern: string): boolean {
  // Simple glob matching for package names
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(input);
}
