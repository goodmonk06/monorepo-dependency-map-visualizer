# Monorepo Dependency Map Visualizer

A powerful tool to analyze, visualize, and enforce architectural boundaries in JavaScript/TypeScript monorepos (including Turborepo and Nx workspaces).

## Overview

`monomap` helps you understand and maintain the architecture of your monorepo by:
- **Discovering** all packages and apps automatically
- **Analyzing** dependencies through import statement parsing
- **Detecting** circular dependencies and architectural violations
- **Visualizing** the dependency graph interactively
- **Enforcing** boundaries through configurable rules

## Tech Stack

### CLI
- **TypeScript** - Type-safe codebase
- **Commander.js** - CLI framework
- **Zod** - Runtime validation
- **Vitest** - Testing framework

### UI
- **Next.js 14** - React framework with App Router
- **Cytoscape.js** - Interactive graph visualization
- **Tailwind CSS** - Styling

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Domain Model

### Core Entities

**PackageInfo**
```typescript
{
  name: string;           // Package name from package.json
  path: string;           // Absolute path to package
  version?: string;       // Package version
  type: 'app' | 'package'; // Determined from location
  dependencies: string[]; // Internal package dependencies
}
```

**Violation**
```typescript
{
  type: 'cycle' | 'boundary';
  message: string;
  packages: string[];  // Involved packages
  rule?: string;       // Rule name (for boundary violations)
}
```

**BoundaryRule**
```typescript
{
  name: string;        // Rule identifier
  from: string;        // Source package pattern
  to: string;          // Target package pattern
  message?: string;    // Custom error message
}
```

### Key Relationships
- Packages can depend on other packages (many-to-many)
- Apps are a special type of package
- Violations reference the packages involved
- Boundary rules define forbidden dependency patterns

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- (Optional) Docker and Docker Compose

### Quick Setup

#### Option 1: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Build the CLI
npm run build

# 3. Run on the example monorepo
cd example
node ../dist/cli.js analyze

# 4. View results
cat analysis/graph.json
```

#### Option 2: Docker

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Run analysis with Docker
docker-compose up analyzer

# 3. View UI
docker-compose up ui
# Open http://localhost:3000
```

#### Option 3: Quick Start Script

```bash
# Install, build, and set up everything
npm run setup

# Run analyzer on example
npm run analyze

# Start UI in development mode
npm run ui:dev
```

## Example Flow

This repository includes a working example demonstrating the complete vertical slice:

### 1. Example Monorepo Structure

```
example/
├── packages/
│   ├── utils/          # Shared utilities
│   ├── ui/             # UI components (depends on utils)
│   └── api/            # API utilities (depends on utils)
└── apps/
    ├── web/            # Web app (depends on ui, api)
    └── mobile/         # Mobile app (depends on ui, api, web)  ⚠️  VIOLATION!
```

### 2. Run Analysis

```bash
cd example
node ../dist/cli.js analyze
```

**Output:**
```
🔍 Starting monorepo analysis...
📦 Step 1: Discovering packages...
  Total packages discovered: 5

🔗 Step 2: Analyzing dependencies...
  @example/utils - no dependencies
  @example/ui → @example/utils
  @example/api → @example/utils
  @example/web → @example/ui, @example/api
  @example/mobile → @example/ui, @example/api, @example/web

⚠️  Step 3: Detecting violations...
  Found 1 boundary violation(s)

✅ Analysis complete!

Violations found:
  - [BOUNDARY] Applications should not depend on other applications
    Rule: apps-cannot-depend-on-apps
    @example/mobile → @example/web
```

### 3. Explore Generated Files

**`analysis/graph.json`** - Complete dependency graph
```json
{
  "packages": {
    "@example/utils": {
      "name": "@example/utils",
      "type": "package",
      "dependencies": []
    },
    ...
  },
  "violations": [
    {
      "type": "boundary",
      "message": "Applications should not depend on other applications",
      "packages": ["@example/mobile", "@example/web"],
      "rule": "apps-cannot-depend-on-apps"
    }
  ],
  "metadata": {
    "analyzedAt": "2025-11-18T07:00:00.000Z",
    "totalPackages": 5,
    "totalDependencies": 7
  }
}
```

**`analysis/graph.dot`** - Graphviz visualization
```bash
# Generate PNG
dot -Tpng analysis/graph.dot -o graph.png
```

### 4. View Interactive UI

```bash
# From repository root
npm run ui:dev
```

Navigate to http://localhost:3000 to see:
- Interactive graph with pan/zoom
- Color-coded nodes (blue=apps, green=packages)
- Red edges highlighting circular dependencies
- Violations panel
- Package search
- Click nodes for details

## Configuration

### `monorepo-map.config.json`

```json
{
  "rootPatterns": [
    "packages/*",
    "apps/*",
    "libs/*"
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
      "name": "no-internal-from-public",
      "from": "@myorg/public-*",
      "to": "@myorg/internal-*",
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

### Pattern Matching

**Type Shortcuts:**
- `apps/*` - Matches all applications
- `packages/*` - Matches all packages

**Wildcards:**
- `@myorg/public-*` - Matches `@myorg/public-api`, `@myorg/public-utils`, etc.
- `*-internal` - Matches any package ending with `-internal`

### Schema Validation

Configuration is validated using Zod schemas:
- `rootPatterns` must have at least one pattern
- Boundary rules require `name`, `from`, and `to`
- Invalid configs show detailed error messages

## Available Scripts

### Root Level

```bash
# Development
npm run dev          # Watch mode for TypeScript
npm run build        # Build CLI
npm run clean        # Remove build artifacts

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report

# Analysis
npm run analyze      # Run analyzer (must be in analyzed repo)

# UI
npm run ui:dev       # Start UI in dev mode
npm run ui:build     # Build UI for production
npm run ui:install   # Install UI dependencies

# Setup
npm run setup        # Full setup (install + build + ui)
```

### Docker Commands

```bash
# Run analyzer
docker-compose up analyzer

# Run production UI
docker-compose up ui

# Development UI with hot reload
docker-compose --profile dev up ui-dev

# Build images
docker-compose build

# Clean up
docker-compose down
```

## Development Workflow

### 1. Make Changes

```bash
# Edit source files in src/
# Tests are in src/**/__tests__/
```

### 2. Run Tests

```bash
npm test          # Run all tests
npm run test:watch # Watch mode during development
```

### 3. Build

```bash
npm run build     # Compile TypeScript
```

### 4. Test Locally

```bash
cd example
node ../dist/cli.js analyze
```

### 5. Commit

All changes are tracked with git. The example monorepo demonstrates the tool's capabilities.

## Testing

### Unit Tests

Tests use **Vitest** for fast, modern testing:

```bash
npm test                 # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

**Test Coverage:**
- Config validation (zod schemas)
- Cycle detection algorithm (DFS)
- Boundary violation detection
- Pattern matching logic

### Example Test

```typescript
it('should detect circular dependency', () => {
  const packages = new Map([
    ['pkg-a', {name: 'pkg-a', dependencies: ['pkg-b']}],
    ['pkg-b', {name: 'pkg-b', dependencies: ['pkg-a']}],
  ]);

  const violations = detectCycles(packages);

  expect(violations).toHaveLength(1);
  expect(violations[0].type).toBe('cycle');
});
```

### Integration Testing

The `example/` directory serves as an integration test:
- Real monorepo structure
- Actual violation (app→app dependency)
- Tests full vertical slice

## Docker Deployment

### Build and Run

```bash
# Build CLI image
docker build -t monomap .

# Run on a monorepo
docker run -v /path/to/your/monorepo:/workspace monomap analyze
```

### Docker Compose

```bash
# Analyze + UI
docker-compose up

# Development mode with hot reload
docker-compose --profile dev up ui-dev
```

## Future Extensions

### Planned Features
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Dependency impact analysis ("what breaks if I change this?")
- [ ] Historical trend tracking
- [ ] Export to Mermaid diagrams
- [ ] Plugin system for custom analyzers
- [ ] Performance optimizations for large monorepos (>100 packages)
- [ ] Support for more module systems (AMD, UMD)
- [ ] Integration with popular monorepo tools (Nx, Lerna)

### Potential Enhancements
- **Advanced Analysis**
  - Transitive dependency chains
  - Orphaned package detection
  - Version mismatch detection

- **Visualization**
  - Multiple layout algorithms
  - Filtering by package type
  - Dependency depth visualization
  - Timeline view of changes

- **Enforcement**
  - Pre-commit hooks
  - CI/CD gates
  - Auto-fix suggestions
  - Migration guides

## Architecture Decisions

### Why TypeScript?
Type safety is crucial for analyzing code structure. TypeScript provides:
- Compile-time validation
- Better IDE support
- Self-documenting code

### Why Regex for Import Parsing?
Instead of full AST parsing:
- **Faster** - No need to parse entire files
- **Simpler** - Fewer dependencies
- **Sufficient** - Captures 95%+ of import patterns
- **Extensible** - Easy to add new patterns

### Why Zod?
- Runtime validation with type inference
- Better error messages than manual validation
- Schema serves as documentation
- Composable validators

### Why Cytoscape.js?
- Designed for graph visualization
- Performant with large graphs
- Rich interaction API
- Extensive layout options

## Troubleshooting

### No packages found
- Check `rootPatterns` in config
- Verify package.json files exist
- Ensure you're in the monorepo root

### UI not loading
- Run `monomap analyze` first
- Check `analysis/graph.json` exists
- Verify port 3000 is available

### Tests failing
- Run `npm run clean && npm run build`
- Check Node version (requires 20+)
- Delete `node_modules` and reinstall

### Docker issues
- Ensure Docker daemon is running
- Check volume mounts in docker-compose.yml
- Verify file permissions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

---

**Built with ❤️ for better monorepo architecture**
