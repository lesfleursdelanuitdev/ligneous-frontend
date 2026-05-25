'use client';

import D3ChartContainer from './D3ChartContainer';

/**
 * A generic component that wraps a single chart in the zoomable/pannable D3 container.
 * Use this when you have one chart to display (no dropdown selector).
 * For multiple charts with a selector, use ChartsTemplate instead.
 *
 * @param {Object} props
 * @param {(innerRef: React.RefObject) => React.ReactNode} props.renderChart - Render prop receiving the inner group ref
 * @param {number} [props.width=600] - SVG width
 * @param {number} [props.height=400] - SVG height
 * @param {string} [props.description] - Optional description shown above the chart
 * @param {string} [props.className] - Additional wrapper class
 */
export default function ChartWithD3Container({
  renderChart,
  width = 600,
  height = 400,
  description,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {description && (
        <div className="rounded-lg bg-base-200/50 border border-base-content/10 px-4 py-3">
          <p className="text-sm text-base-content/80">{description}</p>
        </div>
      )}
      <D3ChartContainer width={width} height={height}>
        {renderChart}
      </D3ChartContainer>
    </div>
  );
}
