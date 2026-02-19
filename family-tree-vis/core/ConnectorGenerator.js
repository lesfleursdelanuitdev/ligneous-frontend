/**
 * Connector Generator
 * 
 * Generates connector paths between nodes for TNG-style T-junction connectors
 * Adapted from family-chart create-links.ts
 */

/**
 * Generate connectors for all nodes in the tree
 * @param {Object} params
 * @param {Array} params.nodes
 * @param {Object} [params.layout]
 * @param {number} [params.layout.nodeSeparation]
 * @param {number} [params.layout.levelSeparation]
 * @returns {Array} Array of Connector objects
 */
export function generateConnectors({
  nodes,
  layout = {}
}) {
  const connectors = [];
  const { nodeSeparation = 250 } = layout;

  // Group nodes by depth/generation
  const nodesByDepth = new Map();
  nodes.forEach(node => {
    const depth = node.depth || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth).push(node);
  });

  // Generate connectors for each node
  nodes.forEach(node => {
    // Ancestry connectors (child -> parents)
    if (node.parent || (node.father && node.mother)) {
      const parents = node.father && node.mother 
        ? [node.father, node.mother]
        : node.parent 
        ? [node.parent]
        : [];

      if (parents.length > 0) {
        connectors.push(createAncestryConnector(node, parents, nodeSeparation));
      }
    }

    // Spouse connectors (horizontal between father and mother)
    if (node.father && node.mother) {
      connectors.push(createSpouseConnector(node.father, node.mother));
    }
  });

  return connectors;
}

/**
 * Create ancestry connector (child -> parents) with T-junction
 * @param {Object} child - TreeNode
 * @param {Array} parents - Array of TreeNode
 * @param {number} nodeSeparation
 * @returns {Object} Connector object
 */
function createAncestryConnector(child, parents, nodeSeparation) {
  if (parents.length === 1) {
    // Single parent - simple vertical line
    return {
      id: `ancestry-${child.data.xref}-${parents[0].data.xref}`,
      points: [child.x, child.y, parents[0].x, parents[0].y],
      source: child,
      target: parents[0],
      type: 'ancestry',
      curve: false
    };
  }

  // Two parents - T-junction style
  const father = parents.find(p => p.data.gender === 'M') || parents[0];
  const mother = parents.find(p => p.data.gender === 'F') || parents[1] || parents[0];
  
  // Calculate midpoint between parents
  const midpointX = (father.x + mother.x) / 2;
  const midpointY = (father.y + mother.y) / 2;
  
  // T-junction connector: child -> midpoint -> father & mother
  // Format: [x1, y1, x2, y2, x3, y3, ...] for Konva Line
  const points = [
    // From child center to midpoint
    child.x,
    child.y,
    child.x,
    midpointY,
    midpointX,
    midpointY,
    // To father
    father.x,
    midpointY,
    father.x,
    father.y,
    // Back to midpoint, then to mother
    midpointX,
    midpointY,
    mother.x,
    midpointY,
    mother.x,
    mother.y
  ];

  return {
    id: `ancestry-${child.data.xref}-${father.data.xref}-${mother.data.xref}`,
    points,
    source: child,
    target: parents,
    type: 'ancestry',
    curve: false
  };
}

/**
 * Create spouse connector (horizontal line between spouses)
 * @param {Object} father - TreeNode
 * @param {Object} mother - TreeNode
 * @returns {Object} Connector object
 */
function createSpouseConnector(father, mother) {
  return {
    id: `spouse-${father.data.xref}-${mother.data.xref}`,
    points: [father.x, father.y, mother.x, mother.y],
    source: father,
    target: mother,
    type: 'spouse',
    curve: false
  };
}

