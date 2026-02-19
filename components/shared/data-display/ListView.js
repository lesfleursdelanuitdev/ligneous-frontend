'use client';

/**
 * ListView Component
 * Table-like list view
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.renderRow - Function to render each row: (item, index) => ReactNode
 * @param {Array} props.headers - Optional array of header objects: { label, key, sortable }
 * @param {Function} props.onSort - Optional sort handler
 * @param {string} props.sortKey - Current sort key
 * @param {string} props.sortDirection - 'asc' or 'desc'
 * @param {string} props.className - Additional CSS classes
 */
export default function ListView({
  items = [],
  renderRow,
  headers = [],
  onSort,
  sortKey,
  sortDirection = 'asc',
  className = '',
}) {
  if (!items || items.length === 0) return null;

  const handleSort = (key) => {
    if (onSort && headers.find((h) => h.key === key && h.sortable)) {
      const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-base-content/10">
        {headers.length > 0 && (
          <thead className="bg-base-200">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium
                    text-base-content/60 uppercase tracking-wider
                    ${header.sortable && onSort ? 'cursor-pointer hover:bg-base-200' : ''}
                  `}
                  onClick={() => header.sortable && handleSort(header.key)}
                >
                  <div className="flex items-center gap-2">
                    {header.label}
                    {header.sortable && sortKey === header.key && (
                      <svg
                        className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-base-100 divide-y divide-base-content/10">
          {items.map((item, index) => (
            <tr
              key={item.id || index}
              className="hover:bg-base-200 transition-colors"
            >
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

