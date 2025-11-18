# Monorepo Dependency Map Visualizer

A powerful tool to analyze, visualize, and enforce architectural boundaries in JavaScript/TypeScript monorepos (including Turborepo).

## Features

- 🔍 **Automatic Package Discovery** - Scans your monorepo for packages and apps
- 📊 **Dependency Analysis** - Builds a complete dependency graph by analyzing imports
- 🔄 **Cycle Detection** - Identifies circular dependencies
- 🚧 **Boundary Enforcement** - Detect violations of architectural rules
- 📈 **Interactive Visualization** - Beautiful web UI with search and filtering
- 📄 **Multiple Output Formats** - JSON graph and Graphviz DOT files

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/monorepo-dependency-map-visualizer.git
cd monorepo-dependency-map-visualizer

# Install CLI dependencies
npm install

# Build the CLI
npm run build

# Optionally link globally
npm link
```

## Quick Start

### 1. Initialize Configuration

Create a config file in your monorepo root:

```bash
monomap init
```

This creates a `monorepo-map.config.json` file with default settings.

### 2. Run Analysis

```bash
monomap analyze
```

This will:
- Discover all packages in your monorepo
- Analyze dependencies between packages
- Detect circular dependencies and boundary violations
- Generate output files in `./analysis/`

### 3. View Results

#### Option A: CLI Output
The analysis results are printed to the console.

#### Option B: Interactive UI

```bash
# Navigate to the UI directory
cd ui

# Install dependencies (first time only)
npm install

# Create symlink to analysis output
ln -s ../analysis public/analysis

# Start the dev server
npm run dev
```

Open http://localhost:3000 to view the interactive dependency graph.

## Configuration

Edit `monorepo-map.config.json` to customize the analysis:

```json
{
  "rootPatterns": [
    "packages/*",
    "apps/*"
  ],
  "detectCycles": true,
  "boundaryRules": [
    {
      "name": "apps-cannot-depend-on-apps",
      "from": "apps/*",
      "to": "apps/*",
      "message": "Applications should not depend on other applications"
    },
    {
      "name": "no-internal-dependencies",
      "from": "packages/*",
      "to": "packages/internal-*",
      "message": "Public packages cannot depend on internal packages"
    }
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    ".next"
  ]
}
```

### Configuration Options

- **`rootPatterns`** (required): Glob patterns to find package.json files
- **`detectCycles`** (default: true): Whether to detect circular dependencies
- **`boundaryRules`**: Array of rules defining forbidden dependencies
  - `name`: Rule identifier
  - `from`: Source package pattern (supports wildcards)
  - `to`: Target package pattern (supports wildcards)
  - `message`: Custom error message
- **`exclude`**: Patterns to exclude from analysis
- **`rootDir`**: Root directory of the monorepo (defaults to config file location)

## CLI Commands

### `monomap analyze`

Analyze the monorepo and generate dependency graph.

```bash
monomap analyze [options]
```

Options:
- `-c, --config <path>` - Path to config file (default: monorepo-map.config.json)
- `-o, --output <path>` - Output directory for analysis results (default: ./analysis)

### `monomap init`

Create a new configuration file with defaults.

```bash
monomap init
```

## Output Files

The analyzer generates the following files in the `./analysis/` directory:

### `graph.json`

Complete dependency graph in JSON format:

```json
{
  "packages": {
    "@myorg/package-a": {
      "name": "@myorg/package-a",
      "path": "/path/to/packages/package-a",
      "version": "1.0.0",
      "type": "package",
      "dependencies": ["@myorg/package-b"]
    }
  },
  "violations": [
    {
      "type": "cycle",
      "message": "Circular dependency detected: ...",
      "packages": ["package-a", "package-b", "package-a"]
    }
  ],
  "metadata": {
    "analyzedAt": "2025-01-01T00:00:00.000Z",
    "totalPackages": 10,
    "totalDependencies": 25
  }
}
```

### `graph.dot`

Graphviz DOT file for static visualization:

```bash
# Generate PNG image
dot -Tpng analysis/graph.dot -o graph.png

# Generate SVG
dot -Tsvg analysis/graph.dot -o graph.svg
```

## Interactive UI Features

The web UI (`ui/`) provides:

- **Interactive Graph** - Pan, zoom, and click nodes to explore
- **Search** - Filter packages by name
- **Package Details** - View dependencies and dependents
- **Violations Panel** - See all detected issues
- **Color Coding**:
  - Blue nodes = Applications
  - Green nodes = Packages
  - Red edges = Circular dependencies
  - Orange highlights = Selected packages

## Example: Analyzing a Turborepo

For a typical Turborepo structure:

```
my-monorepo/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── utils/
│   └── config/
└── monorepo-map.config.json
```

Config:

```json
{
  "rootPatterns": ["apps/*", "packages/*"],
  "detectCycles": true,
  "boundaryRules": [
    {
      "name": "apps-isolated",
      "from": "apps/*",
      "to": "apps/*",
      "message": "Apps should not depend on other apps"
    }
  ]
}
```

Run:

```bash
monomap analyze
```

## How It Works

1. **Package Discovery**: Scans the monorepo using glob patterns to find all `package.json` files
2. **Dependency Analysis**:
   - Reads package.json dependencies
   - Parses source files (`.ts`, `.tsx`, `.js`, `.jsx`) to extract import statements
   - Builds an adjacency list of package dependencies
3. **Violation Detection**:
   - **Cycles**: Uses depth-first search (DFS) to detect circular dependencies
   - **Boundaries**: Matches dependencies against configured boundary rules
4. **Output Generation**: Exports results as JSON and Graphviz DOT formats

## Use Cases

- **Architecture Enforcement** - Prevent packages from crossing architectural boundaries
- **Refactoring** - Identify tightly coupled packages
- **Documentation** - Visualize package relationships
- **CI/CD** - Fail builds on policy violations
- **Code Review** - Understand impact of dependency changes

## Troubleshooting

### No packages found

- Verify `rootPatterns` in your config match your directory structure
- Check that packages have `package.json` files
- Ensure you're running the command from the monorepo root

### UI not loading graph

- Run `monomap analyze` first to generate the graph.json file
- Create symlink: `ln -s ../analysis ui/public/analysis`
- Check browser console for errors

### Missing dependencies in graph

- Ensure source files are in standard locations (src/, app/, pages/, lib/)
- Check that imports use the package name (not relative paths across packages)
- Verify package.json includes all dependencies

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Roadmap

- [ ] Support for more import patterns (dynamic imports, require.resolve)
- [ ] Integration with popular CI/CD platforms
- [ ] Dependency change impact analysis
- [ ] Export to other graph formats (Mermaid, PlantUML)
- [ ] Performance optimizations for large monorepos
- [ ] Plugin system for custom analyzers
