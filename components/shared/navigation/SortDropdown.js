'use client';

import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

/**
 * SortDropdown Component
 * Dropdown for selecting sort options. Uses Headless UI Listbox (behavior + a11y) and DaisyUI classes (styling).
 *
 * @param {Object} props
 * @param {Array} props.options - Array of { value, label } objects
 * @param {string} props.value - Current sort value
 * @param {Function} props.onChange - Callback when sort changes
 * @param {string} props.className - Additional CSS classes
 */
export default function SortDropdown({ options = [], value, onChange, className = '' }) {
  const currentOption = options.find((opt) => opt.value === value) || options[0];

  if (!options || options.length === 0) return null;

  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange}>
        <ListboxButton className="btn btn-outline btn-sm gap-2 min-h-8 h-8">
          <span className="text-sm font-medium">Sort:</span>
          <span className="text-sm">{currentOption?.label || 'Select...'}</span>
          <svg
            className="size-4 shrink-0 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          className="menu dropdown-content z-10 mt-2 w-56 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="menu-item rounded-lg px-3 py-2 text-sm outline-none data-[focus]:bg-base-200 data-[selected]:bg-primary/10 data-[selected]:text-primary"
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
