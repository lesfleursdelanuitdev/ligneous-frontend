/**
 * Type definitions for Family Tree Visualization
 * 
 * These are JSDoc comments for documentation purposes.
 * The actual types are inferred from usage.
 */

/**
 * @typedef {Object} Individual
 * @property {string} xref
 * @property {string} [name]
 * @property {string} [givenName]
 * @property {string} [surname]
 * @property {'M'|'F'|'U'} [gender]
 * @property {string} [birthDate]
 * @property {string} [birthPlace]
 * @property {string} [deathDate]
 * @property {string} [deathPlace]
 * @property {*} [key] - Allow additional properties from API
 */

/**
 * @typedef {Object} TreeNode
 * @property {number} x
 * @property {number} y
 * @property {Individual} data
 * @property {number} depth
 * @property {number} [slot] - TNG-style slot number (1, 2, 3, 4...)
 * @property {number} [generation]
 * @property {TreeNode} [parent]
 * @property {TreeNode[]} [children]
 * @property {TreeNode} [father]
 * @property {TreeNode} [mother]
 */

/**
 * @typedef {Object} Connector
 * @property {string} id
 * @property {number[]} points - [x1, y1, x2, y2, ...] for Konva Line
 * @property {TreeNode|TreeNode[]} source
 * @property {TreeNode|TreeNode[]} target
 * @property {'ancestry'|'spouse'|'progeny'} type
 * @property {boolean} [curve]
 */

/**
 * @typedef {Object} TreeLayout
 * @property {TreeNode[]} nodes
 * @property {Connector[]} links
 * @property {Object} dimensions
 * @property {number} dimensions.width
 * @property {number} dimensions.height
 * @property {number} dimensions.xOffset
 * @property {number} dimensions.yOffset
 */

/**
 * @typedef {Object} LayoutOptions
 * @property {number} [nodeSeparation] - Horizontal spacing between nodes
 * @property {number} [levelSeparation] - Vertical spacing between generations
 * @property {number} [boxWidth]
 * @property {number} [boxHeight]
 * @property {number} [leftIndent]
 * @property {'vertical'|'horizontal'} [orientation]
 */

/**
 * @typedef {Object} VisualizationState
 * @property {boolean} loading
 * @property {string|null} error
 * @property {string|null} rootPersonXref
 * @property {number} generations
 * @property {'pedigree'|'descendant'|'family'} viewType
 * @property {LayoutOptions} layout
 * @property {Object} viewport
 * @property {number} viewport.zoom
 * @property {number} viewport.panX
 * @property {number} viewport.panY
 * @property {string|null} selectedPerson
 * @property {string[]} highlightedPersons
 * @property {Object|null} treeData
 * @property {Individual[]} treeData.ancestors
 * @property {Individual|null} treeData.rootPerson
 * @property {Individual[]} treeData.personDetails
 * @property {TreeLayout|null} treeLayout
 */

// Export empty object - types are for JSDoc only
export {};

