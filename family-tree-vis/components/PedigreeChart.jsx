/**
 * Pedigree Chart Component
 * 
 * React component that renders a pedigree chart using Konva.js
 * Uses the useFamilyTreeVisualizer facet for state management
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Line, Group, Rect, Text } from 'react-konva';
import { useFacet } from '@/mycelia/MyceliaProvider';

/**
 * @param {Object} props
 * @param {string} props.fileId
 * @param {string} props.rootXref
 * @param {number} [props.width]
 * @param {number} [props.height]
 */
export default function PedigreeChart({
  fileId,
  rootXref,
  width = 1200,
  height = 800
}) {
  const visualizer = useFacet('familyTreeVisualizer');
  const [state, setState] = useState(null);
  const stageRef = useRef(null);

  // Load tree on mount or when props change
  useEffect(() => {
    if (!visualizer || !fileId || !rootXref) return;

    const loadTree = async () => {
      try {
        await visualizer.loadTree(fileId, rootXref, {
          generations: 4
        });
      } catch (error) {
        console.error('Failed to load tree:', error);
      }
    };

    loadTree();
  }, [visualizer, fileId, rootXref]);

  // Listen to state changes
  useEffect(() => {
    if (!visualizer) return;

    const updateState = () => {
      setState(visualizer.getState());
    };

    // Initial state
    updateState();

    // Listen to state change events
    const handleStateChange = () => updateState();
    
    // Note: In a real implementation, we'd use useListener hook
    // For now, we'll poll or use a subscription mechanism
    const interval = setInterval(updateState, 100);

    return () => clearInterval(interval);
  }, [visualizer]);

  if (!state || !state.treeLayout) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-500">
          {state?.loading ? 'Loading tree...' : 'No tree data'}
        </div>
      </div>
    );
  }

  const { nodes, links, dimensions } = state.treeLayout;
  const { zoom, panX, panY } = state.viewport;

  // Apply viewport transform
  const scaleX = zoom;
  const scaleY = zoom;
  const offsetX = panX;
  const offsetY = panY;

  return (
    <div className="w-full h-full border border-gray-300 rounded">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
      >
        <Layer>
          {/* Render connectors first (behind nodes) */}
          {links.map((link) => (
            <Line
              key={link.id}
              points={link.points}
              stroke="#666"
              strokeWidth={2}
              tension={link.curve ? 0.5 : 0}
              lineCap="round"
              lineJoin="round"
            />
          ))}

          {/* Render nodes (person cards) */}
          {nodes.map((node) => {
            const isSelected = state.selectedPerson === node.data.xref;
            const isHighlighted = state.highlightedPersons.includes(node.data.xref);

            return (
              <Group
                key={node.data.xref}
                x={node.x * scaleX + offsetX}
                y={node.y * scaleY + offsetY}
                onClick={() => visualizer?.selectPerson(node.data.xref)}
                onTap={() => visualizer?.selectPerson(node.data.xref)}
              >
                {/* Card background */}
                <Rect
                  width={200}
                  height={80}
                  x={-100}
                  y={-40}
                  fill={isSelected ? '#e3f2fd' : isHighlighted ? '#fff3e0' : '#ffffff'}
                  stroke={isSelected ? '#2196f3' : '#ccc'}
                  strokeWidth={isSelected ? 3 : 1}
                  cornerRadius={4}
                  shadowBlur={4}
                  shadowColor="rgba(0,0,0,0.2)"
                  shadowOffset={{ x: 2, y: 2 }}
                />

                {/* Person name */}
                <Text
                  x={-90}
                  y={-30}
                  width={180}
                  text={node.data.name || `${node.data.givenName || ''} ${node.data.surname || ''}`.trim() || node.data.xref}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#333"
                  ellipsis={true}
                />

                {/* Birth date */}
                {node.data.birthDate && (
                  <Text
                    x={-90}
                    y={-10}
                    width={180}
                    text={`b. ${node.data.birthDate}`}
                    fontSize={11}
                    fill="#666"
                  />
                )}

                {/* Death date */}
                {node.data.deathDate && (
                  <Text
                    x={-90}
                    y={5}
                    width={180}
                    text={`d. ${node.data.deathDate}`}
                    fontSize={11}
                    fill="#666"
                  />
                )}

                {/* Generation indicator */}
                <Text
                  x={80}
                  y={-35}
                  text={`G${node.generation || node.depth + 1}`}
                  fontSize={10}
                  fill="#999"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

