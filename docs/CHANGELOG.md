# Changelog

All notable changes to the Monorepo Dependency Map Visualizer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-18

### Added - Phase 3: Comprehensive Platform Expansion

#### Plugin System
- **Plugin Architecture** with 4 plugin types:
  - `AnalyzerPlugin`: Extend dependency analysis (CSS modules, assets, etc.)
  - `RulePlugin`: Custom boundary rules and validations
  - `ExporterPlugin`: Custom output formats
  - `MetricCollectorPlugin`: Custom metrics collection
- **PluginRegistry** for centralized plugin management
- Complete **Plugin Development Guide** (docs/PLUGIN_DEVELOPMENT.md)

#### New Export Formats
- **Mermaid diagrams** (.mmd) - GitHub/GitLab compatible
- **HTML reports** (.html) - Standalone, beautiful reports with statistics
- **Format selection** via `--format` CLI flag

#### Observability
- **Structured logging system** (lib/logger.ts):
  - Log levels: DEBUG, INFO, WARN, ERROR
  - Contextual logging with metadata
  - Child loggers for modular code
- **Metrics collection system** (lib/metrics.ts):
  - Counters, gauges, histograms
  - Analysis duration tracking
  - Metrics summary endpoint

#### Enhanced CLI
- **New commands**:
  - `monomap validate` - Validate config without running analysis
  - `monomap report` - Generate HTML report from existing analysis
  - `monomap metrics` - Display collected metrics
- **Global flags**: `--debug`, `--quiet` for log control
- **Force flag** for init command

#### Testing
- Expanded from 17 to **36 tests**
- New test suites for:
  - Logger functionality
  - Metrics collection
  - Plugin registry
- 100% test pass rate

#### Documentation
- **PHASE3_OVERVIEW.md**: Vision and implementation plan
- **PLUGIN_DEVELOPMENT.md**: Complete plugin development guide
- **CHANGELOG.md**: This file

### Changed
- **Version bumped to 2.0.0** (breaking: plugin system architecture)
- **Analyzer now returns** `DependencyGraph` for programmatic use
- **CLI version updated** to 2.0.0
- **Enhanced error messages** throughout the application

### Technical
- Integrated logging throughout analysis pipeline
- Metrics collection at each analysis stage
- Plugin execution hooks at appropriate lifecycle points
- Performance timing for all operations
- TypeScript strict mode maintained
- Backwards compatible for non-plugin usage

## [1.0.0] - 2025-11-18

### Added - Phase 2: Production Ready

#### Core Features
- **Zod validation** for configuration with detailed error messages
- **Vitest testing** framework with 17 unit tests
- **Docker support**:
  - Multi-stage Dockerfile for CLI
  - Dockerfile for Next.js UI
  - docker-compose.yml with analyzer and UI services

#### Developer Experience
- **Enhanced package.json scripts**:
  - `test:watch`, `test:ui`, `test:coverage`
  - `ui:dev`, `ui:build`, `ui:install`
  - `setup` for one-command initialization
- **Environment configuration** via .env.example

#### Documentation
- **Complete README rewrite** with:
  - Overview and tech stack
  - Domain model documentation
  - Multiple getting started paths
  - Example flow walkthrough
  - Troubleshooting section

### Changed
- **Config validation** now uses Zod schemas
- **Test exclusion** from TypeScript compilation
- **Error handling** centralized in config loader

## [0.1.0] - Initial Release

### Added
- Package discovery using glob patterns
- Dependency analysis via import statement parsing
- Circular dependency detection (DFS algorithm)
- Boundary violation detection with pattern matching
- JSON and DOT output formats
- Next.js-based interactive UI with Cytoscape.js
- CLI with `analyze` and `init` commands
- Example monorepo for testing

### Core Algorithms
- Depth-first search for cycle detection
- Pattern matching for boundary rules (wildcards, type shortcuts)
- Regex-based import parsing (ES6, CommonJS, dynamic imports)

---

## Upgrade Guide

### From 1.x to 2.x

**Breaking Changes:**
- None for basic usage
- Plugin system is new, not a breaking change

**New Features:**
- Update your analysis scripts to use new output formats:
  ```bash
  # Old
  monomap analyze

  # New - specify formats
  monomap analyze --format json mermaid html
  ```

- Use new CLI commands:
  ```bash
  monomap validate  # Check config before running
  monomap report    # Generate HTML from existing analysis
  monomap metrics   # View collected metrics
  ```

- Enable logging:
  ```bash
  monomap analyze --debug  # Detailed logs
  monomap analyze --quiet  # Errors only
  ```

**Migration Steps:**
1. Update to version 2.0.0: `npm install monomap@2.0.0`
2. Rebuild your project: `npm run build`
3. (Optional) Try new export formats
4. (Optional) Enable debug logging to see what's happening
5. (Optional) Write plugins for custom analysis

### Writing Plugins

See [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) for complete documentation.

Quick example:
```typescript
import { pluginRegistry, RulePlugin } from 'monomap/plugins';

const myRule: RulePlugin = {
  name: 'my-custom-rule',
  version: '1.0.0',
  async evaluateRules(packages, config) {
    // Your custom rule logic
    return [];
  },
};

pluginRegistry.registerRule(myRule);
```
