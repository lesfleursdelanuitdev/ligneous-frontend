'use client';

import { useState } from 'react';
import { ChevronDown, Search, Plus, X } from 'lucide-react';

// Operators grouped by field type
const TYPE_OPERATORS = {
  text: [
    { value: 'contains',     label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals',       label: 'equals' },
    { value: 'not_equals',   label: 'does not equal' },
    { value: 'starts_with',  label: 'starts with' },
    { value: 'ends_with',    label: 'ends with' },
    { value: 'is_empty',     label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals',       label: 'is' },
    { value: 'not_equals',   label: 'is not' },
    { value: 'is_empty',     label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals',     label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'gt',         label: 'greater than' },
    { value: 'gte',        label: 'greater than or equal' },
    { value: 'lt',         label: 'less than' },
    { value: 'lte',        label: 'less than or equal' },
    { value: 'is_empty',     label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'equals', label: 'on' },
    { value: 'before', label: 'before' },
    { value: 'after',  label: 'after' },
    { value: 'is_empty',     label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
};

// Operators that need no value input
const VALUE_LESS_OPERATORS = new Set(['is_empty', 'is_not_empty']);

function getFieldType(fieldDef) {
  return fieldDef?.type || 'text';
}

function getOperatorsForField(fieldDef) {
  if (fieldDef?.operators?.length > 0) return fieldDef.operators;
  return TYPE_OPERATORS[getFieldType(fieldDef)] || TYPE_OPERATORS.text;
}

function getDefaultOperator(fieldDef) {
  const ops = getOperatorsForField(fieldDef);
  return ops[0]?.value ?? 'contains';
}

function getDefaultValue(fieldDef) {
  if (getFieldType(fieldDef) === 'select') {
    return fieldDef?.options?.[0]?.value ?? '';
  }
  return '';
}

/**
 * DataViewSearchAdvanced Component
 * Toggleable panel for building complex multi-condition searches.
 *
 * Field definition:
 *   { key, label, type?, options?, operators? }
 *
 * type: 'text' (default) | 'select' | 'number' | 'date'
 * options: [{ value, label }]  — required when type='select'
 * operators: override the type-default operators
 *
 * Condition shape: { id, field, operator, value }
 */
export default function DataViewSearchAdvanced({
  fields = [],
  value = [],
  onChange,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  if (fields.length === 0) return null;

  // A condition is "active" if it has a value OR uses a value-less operator
  const activeCount = value.filter(
    (c) => VALUE_LESS_OPERATORS.has(c.operator) || c.value?.toString().trim()
  ).length;

  const addCondition = () => {
    const first = fields[0];
    const next = [
      ...value,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        field: first.key,
        operator: getDefaultOperator(first),
        value: getDefaultValue(first),
      },
    ];
    if (onChange) onChange(next);
    if (!expanded) setExpanded(true);
  };

  const updateCondition = (id, updates) => {
    const next = value.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };

      // When the field changes, reset operator + value to match the new type
      if ('field' in updates && updates.field !== c.field) {
        const newFieldDef = fields.find((f) => f.key === updates.field);
        updated.operator = getDefaultOperator(newFieldDef);
        updated.value = getDefaultValue(newFieldDef);
      }

      // When operator becomes value-less, wipe the value to avoid stale state
      if ('operator' in updates && VALUE_LESS_OPERATORS.has(updates.operator)) {
        updated.value = '';
      }

      return updated;
    });
    if (onChange) onChange(next);
  };

  const removeCondition = (id) => {
    if (onChange) onChange(value.filter((c) => c.id !== id));
  };

  const clearAll = () => {
    if (onChange) onChange([]);
  };

  const renderValueInput = (cond) => {
    if (VALUE_LESS_OPERATORS.has(cond.operator)) return null;

    const fieldDef = fields.find((f) => f.key === cond.field);
    const type = getFieldType(fieldDef);

    if (type === 'select') {
      return (
        <select
          value={cond.value ?? ''}
          onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
          className="select select-bordered select-sm flex-1 min-w-[120px]"
        >
          {(fieldDef?.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (type === 'number') {
      return (
        <input
          type="number"
          value={cond.value ?? ''}
          onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
          placeholder="Value..."
          className="input input-bordered input-sm flex-1 min-w-[100px]"
        />
      );
    }

    if (type === 'date') {
      return (
        <input
          type="date"
          value={cond.value ?? ''}
          onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
          className="input input-bordered input-sm flex-1 min-w-[140px]"
        />
      );
    }

    // Default: text
    return (
      <input
        type="text"
        value={cond.value ?? ''}
        onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
        placeholder="Value..."
        className="input input-bordered input-sm flex-1 min-w-[120px]"
      />
    );
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`btn btn-sm btn-ghost gap-1.5 ${activeCount > 0 ? 'text-primary' : ''}`}
        aria-expanded={expanded}
      >
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
        <Search size={16} className="shrink-0" />
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
              <div key={cond.id} className="flex flex-wrap items-center gap-2">
                {/* Field selector */}
                <select
                  value={cond.field}
                  onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                  className="select select-bordered select-sm w-36"
                >
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={cond.operator}
                  onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}
                  className="select select-bordered select-sm w-40"
                >
                  {getOperatorsForField(fields.find((f) => f.key === cond.field)).map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {/* Value input — hidden for value-less operators */}
                {renderValueInput(cond)}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error"
                  aria-label="Remove condition"
                >
                  <X size={16} className="shrink-0" />
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
              <Plus size={16} className="shrink-0" />
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
