'use client';

/**
 * Base tab bar for IndividualSection.
 * Expects tabs: [{ id, label, icon?, count? }], activeId, onChange(id).
 */
export default function IndividualSectionTabs({ tabs = [], activeId, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 -mx-6 px-4 py-1.5 -mt-1 rounded-none bg-base-200/50 border-y border-base-content/10 mb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`btn btn-sm gap-1.5 border-0 cursor-pointer ${
              isActive
                ? 'bg-base-300/80 text-base-content hover:bg-primary/40'
                : 'btn-ghost text-base-content/70 hover:bg-primary/30'
            }`}
            title={tab.label}
            aria-pressed={isActive}
          >
            {Icon && <Icon size={18} />}
            {tab.count != null && tab.count > 0 && (
              <span className="badge badge-xs">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
