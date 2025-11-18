import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { MonorepoMapConfig } from '../types/config';
import { PackageInfo } from '../types/graph';

interface RawPackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export async function discoverPackages(
  config: MonorepoMapConfig
): Promise<Map<string, PackageInfo>> {
  const packages = new Map<string, PackageInfo>();
  const rootDir = config.rootDir || process.cwd();

  console.log(`Discovering packages in: ${rootDir}`);
  console.log(`Patterns: ${config.rootPatterns.join(', ')}`);

  for (const pattern of config.rootPatterns) {
    const fullPattern = path.join(rootDir, pattern, 'package.json');
    console.log(`Searching: ${fullPattern}`);

    const files = await glob(fullPattern, {
      ignore: config.exclude?.map(e => `**/${e}/**`) || [],
      absolute: true,
    });

    console.log(`Found ${files.length} package.json files for pattern: ${pattern}`);

    for (const file of files) {
      try {
        const packageInfo = loadPackageInfo(file, rootDir);
        if (packageInfo && packageInfo.name) {
          packages.set(packageInfo.name, packageInfo);
          console.log(`  - ${packageInfo.name} (${packageInfo.type})`);
        }
      } catch (error) {
        console.warn(`Warning: Failed to load package from ${file}: ${error}`);
      }
    }
  }

  console.log(`\nTotal packages discovered: ${packages.size}`);
  return packages;
}

function loadPackageInfo(packageJsonPath: string, rootDir: string): PackageInfo | null {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson: RawPackageJson = JSON.parse(content);

  if (!packageJson.name) {
    console.warn(`Package at ${packageJsonPath} has no name`);
    return null;
  }

  const packageDir = path.dirname(packageJsonPath);
  const relativePath = path.relative(rootDir, packageDir);

  // Determine if this is an app or package based on the path
  const type = relativePath.startsWith('apps') ? 'app' : 'package';

  return {
    name: packageJson.name,
    path: packageDir,
    version: packageJson.version,
    type,
    dependencies: [], // Will be populated by dependency analyzer
  };
}

export function getPackageDependencies(packageJsonPath: string): string[] {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson: RawPackageJson = JSON.parse(content);

  const deps = new Set<string>();

  // Collect all types of dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => deps.add(dep));
  }

  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => deps.add(dep));
  }

  if (packageJson.peerDependencies) {
    Object.keys(packageJson.peerDependencies).forEach(dep => deps.add(dep));
  }

  return Array.from(deps);
}
