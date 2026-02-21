'use client';

/**
 * Overview section displayed below stat cards on the tree overview page.
 * Short description and interesting facts. Placeholder/dummy UI for now.
 */
export default function TreeOverviewSection() {
  const facts = [
    { label: 'Most common surname', value: 'Smith' },
    { label: 'Most common first name', value: 'John' },
    { label: 'Most common birth year', value: '1850' },
    { label: 'Most common place', value: 'London, England' },
  ];

  return (
    <section className="card bg-base-200 rounded-box p-6">
      <h2 className="text-lg font-semibold text-base-content mb-2">Overview</h2>
      <p className="text-base-content/70 mb-6">
        This tree contains family records, places, events, and sources.
        Browse individuals and families, explore connections, or filter
        by dates and locations.
      </p>
      <h3 className="text-sm font-medium text-base-content/80 mb-3">Interesting facts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {facts.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 p-3 rounded-lg bg-base-300/50"
          >
            <span className="text-xs text-base-content/60">{label}</span>
            <span className="text-base font-medium text-base-content">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
