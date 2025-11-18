export interface PackageInfo {
  /**
   * Package name from package.json
   */
  name: string;

  /**
   * Absolute path to package directory
   */
  path: string;

  /**
   * Version from package.json
   */
  version?: string;

  /**
   * Whether this is an app or a package
   */
  type: 'app' | 'package';

  /**
   * Dependencies (package names this package depends on)
   */
  dependencies: string[];
}

export interface Violation {
  type: 'cycle' | 'boundary';
  message: string;
  packages: string[];
  rule?: string;
}

export interface DependencyGraph {
  /**
   * Map of package name to package info
   */
  packages: Record<string, PackageInfo>;

  /**
   * Detected violations
   */
  violations: Violation[];

  /**
   * Metadata about the analysis
   */
  metadata: {
    analyzedAt: string;
    totalPackages: number;
    totalDependencies: number;
  };
}
