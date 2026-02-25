'use client';

/**
 * Updates section displayed below the overview on the tree overview page.
 * Activity/updates feed. Placeholder/dummy data for now.
 */
export default function TreeUpdatesSection() {
  const updates = [
    { id: 1, text: 'Added 12 new individuals from census records', date: '2 days ago' },
    { id: 2, text: 'Updated birth date for Margaret Johnson', date: '5 days ago' },
    { id: 3, text: 'Linked 3 new families', date: '1 week ago' },
    { id: 4, text: 'Imported 8 sources from archive', date: '2 weeks ago' },
    { id: 5, text: 'Corrected place name: London → London, England', date: '3 weeks ago' },
  ];

  return (
    <section className="card bg-base-200 rounded-box p-6">
      <h2 className="text-lg font-semibold text-base-content mb-4">Updates</h2>
      <ul className="space-y-3">
        {updates.map(({ id, text, date }) => (
          <li
            key={id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-base-content/5 last:border-0"
          >
            <span className="text-sm text-base-content/80">{text}</span>
            <span className="text-xs text-base-content/50">{date}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
