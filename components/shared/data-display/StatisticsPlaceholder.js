'use client';

/**
 * Placeholder content for "Statistics" tab.
 * UI only; real statistics to be wired up later.
 */
export default function StatisticsPlaceholder({ message = 'Statistics coming soon.' }) {
  return (
    <div className="card bg-base-200 rounded-box p-8 text-center">
      <p className="text-base-content/70">{message}</p>
    </div>
  );
}
