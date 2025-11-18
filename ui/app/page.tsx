'use client';

import { useState, useEffect } from 'react';
import GraphVisualization from '../components/GraphVisualization';
import ViolationsList from '../components/ViolationsList';
import SearchBar from '../components/SearchBar';

interface DependencyGraph {
  packages: Record<string, any>;
  violations: any[];
  metadata: {
    analyzedAt: string;
    totalPackages: number;
    totalDependencies: number;
  };
}

export default function Home() {
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    loadGraph();
  }, []);

  async function loadGraph() {
    try {
      const response = await fetch('/analysis/graph.json');
      if (!response.ok) {
        throw new Error('Failed to load graph data. Please run `monomap analyze` first.');
      }
      const data = await response.json();
      setGraph(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dependency graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-gray-700">{error}</div>
          <div className="mt-4 text-sm text-gray-600">
            Make sure you've run <code className="bg-gray-100 px-2 py-1 rounded">monomap analyze</code> first
          </div>
        </div>
      </div>
    );
  }

  if (!graph) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Monorepo Dependency Visualizer
          </h1>
          <div className="mt-2 text-sm text-gray-600">
            {graph.metadata.totalPackages} packages • {graph.metadata.totalDependencies} dependencies
            {graph.violations.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                • {graph.violations.length} violation{graph.violations.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            packages={Object.keys(graph.packages)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Dependency Graph</h2>
              <GraphVisualization
                graph={graph}
                searchQuery={searchQuery}
                selectedPackage={selectedPackage}
                onSelectPackage={setSelectedPackage}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <ViolationsList violations={graph.violations} />

            {selectedPackage && (
              <div className="mt-4 bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2">Package Details</h2>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 mb-2">{selectedPackage}</div>
                  {graph.packages[selectedPackage] && (
                    <>
                      <div className="text-gray-600 mb-1">
                        Type: <span className="font-medium">{graph.packages[selectedPackage].type}</span>
                      </div>
                      <div className="text-gray-600 mb-2">
                        Dependencies: <span className="font-medium">
                          {graph.packages[selectedPackage].dependencies.length}
                        </span>
                      </div>
                      {graph.packages[selectedPackage].dependencies.length > 0 && (
                        <div>
                          <div className="font-medium text-gray-700 mt-2 mb-1">Depends on:</div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {graph.packages[selectedPackage].dependencies.map((dep: string) => (
                              <li key={dep} className="text-sm">{dep}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
