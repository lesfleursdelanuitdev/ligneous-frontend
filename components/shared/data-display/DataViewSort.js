'use client';

import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

/**
 * DataViewSort Component
 * Sort dropdown with ascending/descending toggle.
 *
 * @param {Array}    options       - Array of { value, label }
 * @param {string}   sortKey       - Current sort field
 * @param {string}   sortDirection - 'asc' or 'desc'
 * @param {Function} onChange      - Called with (key, direction)
 */
export default function DataViewSort({
  options = [],
  sortKey,
  sortDirection = 'asc',
  onChange,
  className = '',
}) {
  if (options.length === 0) return null;

  const currentLabel = options.find((o) => o.value === sortKey)?.label || 'Sort';

  const handleKeyChange = (newKey) => {
    if (onChange) onChange(newKey, sortDirection);
  };

  const toggleDirection = () => {
    if (onChange) onChange(sortKey, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Listbox value={sortKey} onChange={handleKeyChange}>
        <ListboxButton className="btn btn-ghost btn-sm gap-1 min-h-8 h-8">
          <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span className="text-sm">{currentLabel}</span>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="menu dropdown-content z-10 mt-2 w-48 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.value}
              value={opt.value}
              className="menu-item rounded-lg px-3 py-2 text-sm outline-none data-[focus]:bg-base-200 data-[selected]:bg-primary/10 data-[selected]:text-primary"
            >
              {opt.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>

      <button
        type="button"
        onClick={toggleDirection}
        className="btn btn-ghost btn-sm btn-square min-h-8 h-8 w-8"
        aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
