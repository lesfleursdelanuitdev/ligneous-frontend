'use client';

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const NAME_TYPE_OPTIONS = [
  { value: 'birth', label: 'Birth' },
  { value: 'maiden', label: 'Maiden' },
  { value: 'married', label: 'Married' },
  { value: 'aka', label: 'Also known as' },
  { value: 'immigrant', label: 'Immigrant' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
];

function PartList({ items, onChange, onAdd, onRemove, onMoveUp, onMoveDown, placeholder, addLabel }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={item.key} className="flex gap-2 items-center">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onMoveUp(item.key)}
              disabled={index === 0}
              className="btn btn-ghost btn-xs btn-square p-0 min-h-5 h-5 disabled:opacity-30"
              title="Move up"
              aria-label="Move up"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(item.key)}
              disabled={index === items.length - 1}
              className="btn btn-ghost btn-xs btn-square p-0 min-h-5 h-5 disabled:opacity-30"
              title="Move down"
              aria-label="Move down"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          <input
            type="text"
            className="input input-bordered input-sm flex-1 min-w-0"
            value={item.value}
            onChange={(e) => onChange(item.key, e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10 shrink-0"
            title="Remove"
            aria-label="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="btn btn-ghost btn-xs gap-1 text-primary"
      >
        <Plus size={14} />
        {addLabel}
      </button>
    </div>
  );
}

/**
 * A single name block: primary checkbox, name type, given names, surnames.
 * Each name block represents one GEDCOM NAME structure.
 */
export default function NameBlock({
  block,
  onPrimaryChange,
  onTypeChange,
  onGivenChange,
  onGivenAdd,
  onGivenRemove,
  onGivenMoveUp,
  onGivenMoveDown,
  onSurnameChange,
  onSurnameAdd,
  onSurnameRemove,
  onSurnameMoveUp,
  onSurnameMoveDown,
  onRemove,
  canRemove,
}) {
  const { key, isPrimary, nameType, givenNames, surnames } = block;

  return (
    <div className="rounded-lg border border-base-content/10 bg-base-200/30 p-4 space-y-4">
      {/* Row 1: Primary checkbox */}
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={() => onPrimaryChange(key)}
            className="checkbox checkbox-sm"
          />
          <span className="text-sm font-medium text-base-content/80">Primary name</span>
        </label>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(key)}
            className="btn btn-ghost btn-xs text-error hover:bg-error/10"
            title="Remove this name"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Row 2: Name type */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Name type
        </label>
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={nameType || 'birth'}
          onChange={(e) => onTypeChange(key, e.target.value)}
        >
          {NAME_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Row 3: Given names and Surnames */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Given names
          </label>
          <PartList
            items={givenNames}
            onChange={onGivenChange}
            onAdd={onGivenAdd}
            onRemove={onGivenRemove}
            onMoveUp={onGivenMoveUp}
            onMoveDown={onGivenMoveDown}
            placeholder="Given name"
            addLabel="Add given name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Surnames
          </label>
          <PartList
            items={surnames}
            onChange={onSurnameChange}
            onAdd={onSurnameAdd}
            onRemove={onSurnameRemove}
            onMoveUp={onSurnameMoveUp}
            onMoveDown={onSurnameMoveDown}
            placeholder="Surname"
            addLabel="Add surname"
          />
        </div>
      </div>
    </div>
  );
}

export { NAME_TYPE_OPTIONS };
