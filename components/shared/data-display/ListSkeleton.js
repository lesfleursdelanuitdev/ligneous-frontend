'use client';

/**
 * ListSkeleton Component
 * Loading skeleton for list view
 * 
 * @param {Object} props
 * @param {number} props.rows - Number of skeleton rows
 * @param {number} props.columns - Number of columns
 * @param {string} props.className - Additional CSS classes
 */
export default function ListSkeleton({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-base-content/10">
          <thead className="bg-base-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-base-200 rounded w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-base-100 divide-y divide-base-content/10">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-base-200 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

