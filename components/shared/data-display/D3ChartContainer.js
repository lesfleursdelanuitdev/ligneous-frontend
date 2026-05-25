'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

/**
 * A generic D3 chart container with zoom, pan, and on-screen controls.
 * Renders an SVG with a transformable inner group. Children receive the inner group ref
 * via render prop and draw their chart content into it.
 *
 * @param {Object} props
 * @param {number} [props.width=600] - SVG width
 * @param {number} [props.height=400] - SVG height
 * @param {number} [props.minZoom=0.25] - Minimum zoom scale
 * @param {number} [props.maxZoom=4] - Maximum zoom scale
 * @param {number} [props.zoomStep=0.25] - Zoom increment for button controls
 * @param {(innerRef: React.RefObject) => React.ReactNode} props.children - Render prop receiving the inner group ref
 * @param {string} [props.className] - Additional class for the wrapper
 */
export default function D3ChartContainer({
  width = 600,
  height = 400,
  minZoom = 0.25,
  maxZoom = 4,
  zoomStep = 0.25,
  children,
  className = '',
}) {
  const svgRef = useRef(null);
  const innerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);

  const handleZoom = useCallback((event) => {
    setTransform(event.transform);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !innerRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(innerRef.current);

    const zoom = d3
      .zoom()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        handleZoom(event);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
      zoomBehaviorRef.current = null;
    };
  }, [minZoom, maxZoom, handleZoom]);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.scaleBy, 1 + zoomStep);
  }, [zoomStep]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.scaleBy, 1 - zoomStep);
  }, [zoomStep]);

  const reset = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  return (
    <div className={`relative rounded-lg border border-base-content/10 bg-base-100 overflow-hidden ${className}`.trim()}>
      <div
        className="absolute top-2 right-2 z-10 flex flex-col gap-1 rounded-lg shadow-sm border border-base-content/10 p-1"
        style={{ backgroundColor: 'hsl(var(--b1) / 0.95)', backdropFilter: 'blur(4px)' }}
      >
        <button
          type="button"
          onClick={zoomIn}
          title="Zoom in"
          aria-label="Zoom in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--b3))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom out"
          aria-label="Zoom out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--b3))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ZoomOut size={18} />
        </button>
        <button
          type="button"
          onClick={reset}
          title="Reset zoom"
          aria-label="Reset zoom"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--b3))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <div
        className="absolute bottom-2 left-2 z-10"
        style={{ fontSize: 12, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <Move size={14} />
        <span>Drag to pan • Scroll to zoom</span>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block cursor-grab active:cursor-grabbing"
        style={{ minHeight: 300 }}
      >
        <g ref={innerRef} className="chart-content" />
      </svg>
      {typeof children === 'function' ? children(innerRef) : children}
    </div>
  );
}
