'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphVisualizationProps {
  graph: any;
  searchQuery: string;
  selectedPackage: string | null;
  onSelectPackage: (packageName: string | null) => void;
}

export default function GraphVisualization({
  graph,
  searchQuery,
  selectedPackage,
  onSelectPackage,
}: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Build cytoscape elements from graph data
    const elements: any[] = [];

    // Add nodes
    Object.entries(graph.packages).forEach(([name, pkg]: [string, any]) => {
      elements.push({
        data: {
          id: name,
          label: name,
          type: pkg.type,
        },
      });
    });

    // Add edges
    Object.entries(graph.packages).forEach(([name, pkg]: [string, any]) => {
      pkg.dependencies.forEach((dep: string) => {
        if (graph.packages[dep]) {
          elements.push({
            data: {
              id: `${name}-${dep}`,
              source: name,
              target: dep,
            },
          });
        }
      });
    });

    // Check which edges are part of cycles
    const cycleEdges = new Set<string>();
    graph.violations
      .filter((v: any) => v.type === 'cycle')
      .forEach((violation: any) => {
        for (let i = 0; i < violation.packages.length - 1; i++) {
          cycleEdges.add(`${violation.packages[i]}-${violation.packages[i + 1]}`);
        }
      });

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) =>
              ele.data('type') === 'app' ? '#60a5fa' : '#34d399',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            width: 60,
            height: 60,
            'border-width': 2,
            'border-color': '#374151',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': (ele: any) =>
              cycleEdges.has(ele.data('id')) ? '#ef4444' : '#9ca3af',
            'target-arrow-color': (ele: any) =>
              cycleEdges.has(ele.data('id')) ? '#ef4444' : '#9ca3af',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
            'border-width': 4,
          },
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.3,
          },
        },
      ],
      layout: {
        name: 'circle',
        spacingFactor: 1.5,
      },
    });

    // Handle node selection
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      onSelectPackage(node.data('id'));
    });

    // Handle background tap to deselect
    cy.on('tap', (event) => {
      if (event.target === cy) {
        onSelectPackage(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graph, onSelectPackage]);

  // Handle search highlighting
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    cy.nodes().removeClass('highlighted dimmed');

    if (searchQuery) {
      const matches = cy.nodes().filter((node) =>
        node.data('id').toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matches.length > 0) {
        matches.addClass('highlighted');
        cy.nodes().not(matches).addClass('dimmed');
      }
    }
  }, [searchQuery]);

  // Handle package selection
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    cy.nodes().unselect();

    if (selectedPackage) {
      const node = cy.getElementById(selectedPackage);
      if (node.length > 0) {
        node.select();
        cy.animate({
          center: { eles: node },
          zoom: 1.5,
        });
      }
    }
  }, [selectedPackage]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border border-gray-200 rounded"
    />
  );
}
