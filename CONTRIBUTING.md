# Contributing to Monorepo Dependency Map Visualizer

Thank you for your interest in contributing!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/monorepo-dependency-map-visualizer.git
   cd monorepo-dependency-map-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the CLI**
   ```bash
   npm run build
   ```

4. **Test with the example**
   ```bash
   cd example
   node ../dist/cli.js analyze
   ```

## Project Structure

```
.
├── src/                    # CLI source code
│   ├── analyzer/          # Core analysis logic
│   ├── config/            # Configuration loader
│   ├── output/            # Output generators (JSON, DOT)
│   └── types/             # TypeScript type definitions
├── ui/                    # Next.js visualization UI
│   ├── app/              # Next.js app directory
│   └── components/       # React components
├── example/              # Example monorepo for testing
└── scripts/              # Helper scripts
```

## Making Changes

1. Create a feature branch
2. Make your changes
3. Run `npm run build` to ensure it compiles
4. Test with the example monorepo
5. Update documentation if needed
6. Submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Keep functions focused and testable

## Testing

Currently, testing is done manually using the example monorepo. We welcome contributions to add automated tests!

## Adding Features

Some ideas for contributions:
- Additional output formats
- More sophisticated pattern matching
- Performance optimizations
- Better error messages
- CI/CD integrations
- Additional visualization options

## Questions?

Open an issue for questions or discussions!
