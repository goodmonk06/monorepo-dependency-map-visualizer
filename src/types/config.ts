export interface BoundaryRule {
  /**
   * Name of the rule for reporting
   */
  name: string;

  /**
   * Pattern to match source packages (e.g., "apps/*")
   */
  from: string;

  /**
   * Pattern to match target packages that are forbidden (e.g., "packages/internal/*")
   */
  to: string;

  /**
   * Error message to display when this rule is violated
   */
  message?: string;
}

export interface MonorepoMapConfig {
  /**
   * Glob patterns to find package.json files in the monorepo
   * Default: ["packages/*", "apps/*"]
   */
  rootPatterns: string[];

  /**
   * Rules defining forbidden dependencies between packages
   */
  boundaryRules?: BoundaryRule[];

  /**
   * Whether to detect circular dependencies
   * Default: true
   */
  detectCycles?: boolean;

  /**
   * Patterns to exclude from analysis
   */
  exclude?: string[];

  /**
   * Root directory of the monorepo (defaults to config file location)
   */
  rootDir?: string;
}

export const defaultConfig: MonorepoMapConfig = {
  rootPatterns: ['packages/*', 'apps/*'],
  boundaryRules: [],
  detectCycles: true,
  exclude: ['node_modules', 'dist', 'build', '.next'],
};
