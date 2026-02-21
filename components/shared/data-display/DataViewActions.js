'use client';

import Link from 'next/link';

const DefaultIcons = {
  view: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  delete: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  activate: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  deactivate: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  admin: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

/**
 * DataViewActions Component
 * Renders action buttons for an entity in table rows or card footers.
 * Provides built-in icons for common actions (view, edit, delete, activate, deactivate, admin).
 *
 * Action definition:
 *   { key, label, icon?, href?: (item) => string, onClick?: (item) => void,
 *     permission?, variant?: 'default' | 'danger' }
 */
export default function DataViewActions({
  actions = [],
  item,
  userPermissions = {},
  layout = 'row',
}) {
  if (actions.length === 0) return null;

  const visibleActions = actions.filter((action) => {
    if (!action.permission) return true;
    return userPermissions[action.permission];
  });

  if (visibleActions.length === 0) return null;

  const baseBtn = layout === 'card'
    ? 'btn btn-ghost btn-square text-base-content hover:bg-base-200 p-2.5 min-h-10 min-w-10'
    : 'btn btn-ghost btn-sm btn-square min-h-10 min-w-10 text-base-content';

  const iconSize = 'w-6 h-6';
  const resolveIcon = (action) => {
    if (action.icon) return <action.icon className={iconSize} />;
    const Fallback = DefaultIcons[action.key];
    if (Fallback) return <Fallback className={iconSize} />;
    return null;
  };

  return (
    <div className={`flex items-center ${layout === 'card' ? 'gap-1 pt-2 border-t border-base-content/10 mt-2' : 'gap-0.5 justify-end'}`}>
      {visibleActions.map((action) => {
        const colorClass = action.variant === 'danger' ? 'text-error hover:bg-error/10' : '';
        const iconEl = resolveIcon(action);

        if (action.href) {
          const href = typeof action.href === 'function' ? action.href(item) : action.href;
          return (
            <Link
              key={action.key}
              href={href}
              className={`${baseBtn} ${colorClass}`}
              title={action.label}
            >
              {iconEl}
            </Link>
          );
        }

        return (
          <button
            key={action.key}
            type="button"
            onClick={() => action.onClick?.(item)}
            className={`${baseBtn} ${colorClass}`}
            title={action.label}
          >
            {iconEl}
          </button>
        );
      })}
    </div>
  );
}
