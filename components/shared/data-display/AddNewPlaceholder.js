'use client';

/**
 * AddNewPlaceholder — Placeholder content for "Add New" tab.
 * UI only; real form to be wired up later.
 */
export default function AddNewPlaceholder({ message = 'Add new form coming soon.' }) {
  return (
    <div className="card bg-base-200 rounded-box p-8 text-center">
      <p className="text-base-content/70">{message}</p>
    </div>
  );
}
