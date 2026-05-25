'use client';

import { useState, useRef } from 'react';
import D3ChartContainer from './D3ChartContainer';

/**
 * A reusable charts template with three rows:
 * 1. Dropdown to select which chart to display
 * 2. Description of the selected chart (what it shows, how to use it)
 * 3. The chart itself, inside a zoomable/pannable D3 container
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string, description: string, renderChart: (innerRef) => React.ReactNode, renderLegend?: () => React.ReactNode, width?: number, height?: number }>} props.charts - Chart definitions
 * @param {string} [props.defaultChartId] - Initial selected chart (defaults to first)
 * @param {string} [props.dropdownLabel] - Label for the dropdown
 * @param {string} [props.className] - Additional wrapper class
 */
export default function ChartsTemplate({
  charts,
  defaultChartId,
  dropdownLabel = 'Select chart',
  className = '',
}) {
  const firstId = charts[0]?.id;
  const [selectedId, setSelectedId] = useState(defaultChartId ?? firstId ?? '');
  const selectedChart = charts.find((c) => c.id === selectedId) || charts[0];

  if (!charts?.length) {
    return (
      <div className="rounded-box border border-base-content/10 bg-base-200/50 p-12 text-center">
        <p className="text-base-content/60">No charts available.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Row 1: Chart selector dropdown */}
      <div className="flex items-center gap-3">
        <label htmlFor="chart-select" className="text-sm font-medium text-base-content/80 shrink-0">
          {dropdownLabel}
        </label>
        <select
          id="chart-select"
          value={selectedId || firstId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="select select-bordered select-sm max-w-xs"
          aria-label={dropdownLabel}
        >
          {charts.map((chart) => (
            <option key={chart.id} value={chart.id}>
              {chart.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: Description */}
      {selectedChart?.description && (
        <div className="rounded-lg bg-base-200/50 border border-base-content/10 px-4 py-3">
          <p className="text-sm text-base-content/80">{selectedChart.description}</p>
        </div>
      )}

      {/* Row 3: Chart in D3 container */}
      <div className="min-h-[300px]">
        {selectedChart ? (
          <D3ChartContainer
            width={selectedChart.width ?? 600}
            height={selectedChart.height ?? 400}
          >
            {selectedChart.renderChart}
          </D3ChartContainer>
        ) : (
          <div className="rounded-box border border-base-content/10 bg-base-200/50 p-12 text-center">
            <p className="text-base-content/60">Select a chart above.</p>
          </div>
        )}
      </div>

      {/* Row 4: Legend below the chart */}
      {selectedChart?.renderLegend && (
        <div className="rounded-lg bg-base-200/50 border border-base-content/10 px-4 py-3 pt-4">
          <p className="text-xs font-medium text-base-content/60 mb-2 uppercase tracking-wide">Legend</p>
          {selectedChart.renderLegend()}
        </div>
      )}
    </div>
  );
}
