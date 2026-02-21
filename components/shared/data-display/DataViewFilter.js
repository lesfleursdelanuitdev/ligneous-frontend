'use client';

/**
 * DataViewFilter Component
 * Filter panel with declarative filter config.
 * Revealed via toolbar; no internal expand/collapse.
 *
 * Filter definition types:
 *   { key, label, type: 'select', options: [{ value, label }] }
 *   { key, label, type: 'toggle' }
 *   { key, label, type: 'text', placeholder? }
 *   { key, label, type: 'range', min, max }
 *
 * @param {Array}    filters   - Array of filter definitions
 * @param {Object}   values    - Current filter values { [key]: value }
 * @param {Function} onChange  - Called with updated values object
 * @param {Function} onClear   - Called to reset all filters
 */
export default function DataViewFilter({
  filters = [],
  values = {},
  onChange,
  onClear,
  className = '',
}) {
  if (filters.length === 0) return null;

  const activeCount = Object.values(values).filter((v) => v !== '' && v !== null && v !== undefined && v !== false).length;

  const handleChange = (key, val) => {
    if (onChange) onChange({ ...values, [key]: val });
  };

  const renderFilter = (filter) => {
    const val = values[filter.key];
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={val ?? ''}
            onChange={(e) => handleChange(filter.key, e.target.value || '')}
            className="select select-bordered select-sm w-full"
          >
            <option value="">All</option>
            {(filter.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'toggle':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => handleChange(filter.key, e.target.checked ? 'true' : '')}
              className="toggle toggle-sm toggle-primary"
            />
            <span className="text-sm">{val ? 'Yes' : 'Any'}</span>
          </label>
        );
      case 'text':
        return (
          <input
            type="text"
            value={val ?? ''}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
            className="input input-bordered input-sm w-full"
          />
        );
      case 'range':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={val ?? ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              min={filter.min}
              max={filter.max}
              placeholder={filter.label}
              className="input input-bordered input-sm w-full"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="p-3 bg-base-200 rounded-box grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-base-content/60 mb-1 block">{f.label}</label>
            {renderFilter(f)}
          </div>
        ))}
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {filters.map((f) => {
            const val = values[f.key];
            if (!val && val !== 0) return null;
            let label = val;
            if (f.type === 'select') {
              label = f.options?.find((o) => String(o.value) === String(val))?.label || val;
            } else if (f.type === 'toggle') {
              label = 'Yes';
            }
            return (
              <span key={f.key} className="badge badge-sm badge-outline gap-1">
                {f.label}: {label}
                <button
                  type="button"
                  onClick={() => handleChange(f.key, '')}
                  className="text-base-content/60 hover:text-base-content"
                  aria-label={`Remove ${f.label} filter`}
                >
                  &times;
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={onClear}
            className="btn btn-ghost btn-xs"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
