'use client';

import { useState } from 'react';

const DEFAULT_OPERATORS = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
];

/**
 * DataViewSearchAdvanced Component
 * Toggleable panel for building complex multi-condition searches.
 * Hidden by default; expand to add conditions (field + operator + value).
 *
 * @param {Array}   fields    - [{ key, label, operators? }] — operators override defaults
 * @param {Array}   value     - Current conditions: [{ id, field, operator, value }]
 * @param {Function} onChange  - Called with updated conditions array
 */
export default function DataViewSearchAdvanced({
  fields = [],
  value = [],
  onChange,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  if (fields.length === 0) return null;

  const activeCount = value.filter((c) => c.value?.trim?.()).length;

  const addCondition = () => {
    const first = fields[0];
    const next = [
      ...value,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        field: first.key,
        operator: 'contains',
        value: '',
      },
    ];
    if (onChange) onChange(next);
    if (!expanded) setExpanded(true);
  };

  const updateCondition = (id, updates) => {
    const next = value.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    if (onChange) onChange(next);
  };

  const removeCondition = (id) => {
    const next = value.filter((c) => c.id !== id);
    if (onChange) onChange(next);
  };

  const clearAll = () => {
    if (onChange) onChange([]);
  };

  const getOperatorsForField = (fieldKey) => {
    const def = fields.find((f) => f.key === fieldKey);
    return (def?.operators && def.operators.length > 0)
      ? def.operators
      : DEFAULT_OPERATORS;
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`btn btn-sm btn-ghost gap-1.5 ${activeCount > 0 ? 'text-primary' : ''}`}
        aria-expanded={expanded}
      >
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Advanced search
        {activeCount > 0 && (
          <span className="badge badge-xs badge-primary">{activeCount}</span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-base-200 rounded-box border border-base-content/10 space-y-3">
          <p className="text-xs text-base-content/60 mb-2">
            Add conditions to refine your search. All conditions must match (AND).
          </p>

          <div className="space-y-2">
            {value.map((cond) => (
              <div
                key={cond.id}
                className="flex flex-wrap items-center gap-2"
              >
                <select
                  value={cond.field}
                  onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                  className="select select-bordered select-sm w-32"
                >
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}
                  className="select select-bordered select-sm w-36"
                >
                  {getOperatorsForField(cond.field).map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={cond.value ?? ''}
                  onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                  placeholder="Value..."
                  className="input input-bordered input-sm flex-1 min-w-[120px]"
                />
                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error"
                  aria-label="Remove condition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addCondition}
              className="btn btn-sm btn-ghost gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add condition
            </button>
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="btn btn-ghost btn-xs"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
