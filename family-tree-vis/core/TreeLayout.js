/**
 * Tree Layout Calculation using d3.js
 * 
 * Calculates positions for pedigree tree nodes using d3.tree() algorithm
 * Adapted from family-chart and TNG pedigree.php
 */

import * as d3 from 'd3';

/**
 * Calculate tree layout positions using d3.js
 * @param {Object} params
 * @param {Array} params.ancestors
 * @param {Object} params.rootPerson
 * @param {number} params.generations
 * @param {Object} [params.layout]
 * @returns {Object} TreeLayout object with nodes, links, and dimensions
 */
export function calculateTreeLayout({
  ancestors,
  rootPerson,
  generations,
  layout = {}
}) {
  const {
    nodeSeparation = 250,
    levelSeparation = 150,
    leftIndent = 50
  } = layout;

  // Build hierarchy from ancestors
  const hierarchy = buildHierarchy(rootPerson, ancestors, generations);
  
  // Create d3 tree layout
  const tree = d3.tree()
    .nodeSize([nodeSeparation, levelSeparation])
    .separation((a, b) => {
      // Custom separation function
      // For pedigree, we want consistent spacing
      return 1;
    });

  // Calculate positions
  tree(hierarchy);

  // Extract nodes with positions and relationships
  const nodes = hierarchy.descendants().map((d, index) => {
    const node = {
      x: d.x + leftIndent,
      y: d.y,
      data: d.data,
      depth: d.depth,
      generation: d.depth + 1,
      slot: calculateSlot(d.depth, index)
    };

    return node;
  });

  // Now establish relationships between nodes
  // Create a map for quick lookup
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.data.xref, node);
  });

  // Set parent, father, mother relationships
  hierarchy.descendants().forEach((d, index) => {
    const node = nodes[index];
    
    if (!node) return;

    // Add parent reference
    if (d.parent) {
      const parentNode = nodeMap.get(d.parent.data.xref);
      if (parentNode) {
        node.parent = parentNode;
      }
    }

    // Identify father and mother from children (in d3, children are actually parents in pedigree)
    if (d.children && d.children.length >= 2) {
      // In pedigree, children array contains the parents
      const child1 = d.children[0];
      const child2 = d.children[1];
      
      const node1 = nodeMap.get(child1.data.xref);
      const node2 = nodeMap.get(child2.data.xref);
      
      if (node1 && node2) {
        // Determine which is father and which is mother based on gender
        if (child1.data.gender === 'M' || (!child1.data.gender && child2.data.gender === 'F')) {
          node.father = node1;
          node.mother = node2;
        } else {
          node.father = node2;
          node.mother = node1;
        }
      }
    } else if (d.children && d.children.length === 1) {
      // Single parent
      const child = d.children[0];
      const childNode = nodeMap.get(child.data.xref);
      if (childNode) {
        if (child.data.gender === 'M') {
          node.father = childNode;
        } else {
          node.mother = childNode;
        }
      }
    }
  });

  // Calculate dimensions
  const xExtent = d3.extent(nodes, d => d.x);
  const yExtent = d3.extent(nodes, d => d.y);
  
  const dimensions = {
    width: (xExtent[1] - xExtent[0]) + nodeSeparation,
    height: (yExtent[1] - yExtent[0]) + levelSeparation,
    xOffset: -xExtent[0] + nodeSeparation / 2,
    yOffset: -yExtent[0] + levelSeparation / 2
  };

  // Apply offsets to nodes
  nodes.forEach(node => {
    node.x += dimensions.xOffset;
    node.y += dimensions.yOffset;
  });

  return {
    nodes,
    links: [], // Links will be calculated separately by ConnectorGenerator
    dimensions
  };
}

/**
 * Build d3 hierarchy from ancestors data
 * 
 * Ancestors API returns ancestors with a `generation` field:
 * - generation: 1 = parents, 2 = grandparents, etc.
 * 
 * For pedigree, we need to build parent-child relationships.
 * Since the API doesn't explicitly provide parent links, we'll use
 * the generation field and group by generation.
 * 
 * @param {Object} rootPerson
 * @param {Array} ancestors
 * @param {number} maxGenerations
 * @returns {Object} d3.HierarchyNode
 */
function buildHierarchy(rootPerson, ancestors, maxGenerations) {
  // Group ancestors by generation
  const byGeneration = new Map();
  ancestors.forEach(anc => {
    // API returns generation field (1 = parents, 2 = grandparents, etc.)
    const gen = anc.generation || 0;
    if (!byGeneration.has(gen)) {
      byGeneration.set(gen, []);
    }
    byGeneration.get(gen).push(anc);
  });

  // Build hierarchy: root (gen 0) -> parents (gen 1) -> grandparents (gen 2) -> etc.
  function buildNode(person, currentGen) {
    const node = d3.hierarchy(person);
    
    if (currentGen >= maxGenerations) {
      return node;
    }

    // Get parents from next generation
    const parentGen = currentGen + 1;
    const parents = byGeneration.get(parentGen) || [];

    if (parents.length > 0) {
      // For pedigree, we expect 2 parents per person
      // Take first 2 ancestors from next generation
      node.children = parents.slice(0, 2).map(parent => 
        buildNode(parent, parentGen)
      );
    }

    return node;
  }

  return buildNode(rootPerson, 0);
}

/**
 * Calculate TNG-style slot number
 * Slot 1 = root person
 * Slot 2 = father (slot 1 * 2)
 * Slot 3 = mother (slot 1 * 2 + 1)
 * Slot 4 = paternal grandfather (slot 2 * 2)
 * etc.
 * 
 * @param {number} depth
 * @param {number} index
 * @returns {number}
 */
function calculateSlot(depth, index) {
  if (depth === 0) return 1;
  
  // For depth > 0, calculate based on binary tree structure
  // This is a simplified version - will be enhanced
  return Math.pow(2, depth) + index;
}

