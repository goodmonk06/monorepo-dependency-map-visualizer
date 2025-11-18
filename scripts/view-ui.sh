#!/bin/bash

# Helper script to set up and view the UI

echo "🚀 Setting up Monorepo Dependency Visualizer UI..."

# Check if analysis exists
if [ ! -f "analysis/graph.json" ]; then
  echo "❌ No analysis found! Please run 'monomap analyze' first."
  exit 1
fi

cd ui

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing UI dependencies..."
  npm install
fi

# Create symlink to analysis if it doesn't exist
if [ ! -e "public/analysis" ]; then
  echo "🔗 Creating symlink to analysis output..."
  mkdir -p public
  ln -s ../../analysis public/analysis
fi

echo "✅ Setup complete!"
echo "🌐 Starting dev server..."
echo ""
npm run dev
