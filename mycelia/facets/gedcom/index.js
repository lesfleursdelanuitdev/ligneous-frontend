/**
 * GEDCOM Facets - Central Export
 * 
 * All GEDCOM-related facets for the Ligneous application.
 * This provides a single import point for all GEDCOM functionality.
 * 
 * Organized by domain:
 * - core: Core data operations (files, individuals, families, graph)
 * - metadata: Metadata operations (dates, events, notes, sources, places)
 * - analysis: Analysis operations (duplicates)
 * - visualization: Visualization operations (family tree visualizer)
 */

// Core data facets
export * from './core/index.js';

// Metadata facets
export * from './metadata/index.js';

// Analysis facets
export * from './analysis/index.js';

// Visualization facets
export * from './visualization/index.js';

