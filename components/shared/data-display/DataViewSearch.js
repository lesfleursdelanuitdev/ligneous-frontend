'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * DataViewSearch Component
 * Debounced search input for DataViewContainer
 *
 * @param {string}   value        - Current search value (external / controlled)
 * @param {Function} onChange     - Called with debounced value
 * @param {string}   placeholder  - Placeholder text
 * @param {string}   searchLabel  - Explicit label for what field is being searched (e.g. "Name")
 * @param {number}   debounceMs   - Debounce delay in milliseconds
 */
export default function DataViewSearch({
  value = '',
  onChange,
  placeholder = 'Search...',
  searchLabel = '',
  debounceMs = 300,
  className = '',
}) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    timerRef.current = setTimeout(() => {
      if (onChange) onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timerRef.current);
  }, [localValue, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setLocalValue('');
    if (onChange) onChange('');
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              clearTimeout(timerRef.current);
              if (onChange) onChange(localValue);
            }
          }}
          placeholder={placeholder}
          className="input input-bordered input-sm w-full pl-9 pr-8"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4 text-base-content/40 hover:text-base-content/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {searchLabel && (
        <p className="mt-1 text-xs text-base-content/40">
          Searching by: <span className="font-medium text-base-content/60">{searchLabel}</span>
        </p>
      )}
    </div>
  );
}
