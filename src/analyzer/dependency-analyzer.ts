import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { PackageInfo } from '../types/graph';

/**
 * Analyzes source files to extract import statements and build dependency graph
 */
export async function analyzeDependencies(
  packages: Map<string, PackageInfo>
): Promise<void> {
  console.log('\nAnalyzing dependencies...');

  // Create a map of package names for quick lookup
  const packageNames = new Set(packages.keys());

  for (const [packageName, packageInfo] of packages.entries()) {
    console.log(`\nAnalyzing: ${packageName}`);
    const dependencies = new Set<string>();

    // Find all source files in the package
    const sourceFiles = await findSourceFiles(packageInfo.path);
    console.log(`  Found ${sourceFiles.length} source files`);

    // Also check package.json dependencies
    const packageJsonPath = path.join(packageInfo.path, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJsonDeps = getPackageJsonDependencies(packageJsonPath);
      packageJsonDeps.forEach(dep => {
        if (packageNames.has(dep)) {
          dependencies.add(dep);
        }
      });
    }

    // Parse each source file for imports
    for (const file of sourceFiles) {
      try {
        const imports = extractImports(file);
        imports.forEach(imp => {
          // Check if this import matches any of our packages
          const matchedPackage = findMatchingPackage(imp, packageNames);
          if (matchedPackage) {
            dependencies.add(matchedPackage);
          }
        });
      } catch (error) {
        console.warn(`  Warning: Failed to parse ${file}: ${error}`);
      }
    }

    packageInfo.dependencies = Array.from(dependencies);
    console.log(`  Dependencies: ${packageInfo.dependencies.join(', ') || 'none'}`);
  }
}

async function findSourceFiles(packagePath: string): Promise<string[]> {
  const patterns = [
    path.join(packagePath, 'src/**/*.{ts,tsx,js,jsx}'),
    path.join(packagePath, 'app/**/*.{ts,tsx,js,jsx}'),
    path.join(packagePath, 'pages/**/*.{ts,tsx,js,jsx}'),
    path.join(packagePath, 'lib/**/*.{ts,tsx,js,jsx}'),
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    });
    files.push(...found);
  }

  return files;
}

/**
 * Extract import statements from a source file using regex
 * This is a simple approach that works for most cases without full AST parsing
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  // Match ES6 imports: import ... from 'package'
  const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = es6ImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match require statements: require('package')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match dynamic imports: import('package')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function findMatchingPackage(importPath: string, packageNames: Set<string>): string | null {
  // Check for exact match
  if (packageNames.has(importPath)) {
    return importPath;
  }

  // Check if import starts with a package name (for scoped packages)
  // e.g., "@myorg/package/subpath" should match "@myorg/package"
  for (const packageName of packageNames) {
    if (importPath === packageName || importPath.startsWith(packageName + '/')) {
      return packageName;
    }
  }

  return null;
}

function getPackageJsonDependencies(packageJsonPath: string): string[] {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content);

  const deps = new Set<string>();

  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => deps.add(dep));
  }

  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => deps.add(dep));
  }

  return Array.from(deps);
}
