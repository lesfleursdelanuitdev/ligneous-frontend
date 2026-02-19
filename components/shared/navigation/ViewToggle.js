'use client';

/**
 * ViewToggle Component
 * Toggle between list and card views
 * 
 * @param {Object} props
 * @param {string} props.view - Current view: 'list' or 'card'
 * @param {Function} props.onViewChange - Callback when view changes
 * @param {string} props.className - Additional CSS classes
 */
export default function ViewToggle({ view = 'card', onViewChange, className = '' }) {
  return (
    <div className={`join ${className}`}>
      <button
        type="button"
        onClick={() => onViewChange('card')}
        className={`btn btn-sm join-item ${view === 'card' ? 'btn-primary' : 'btn-ghost'}`}
        aria-label="Card view"
        aria-pressed={view === 'card'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`btn btn-sm join-item ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}

