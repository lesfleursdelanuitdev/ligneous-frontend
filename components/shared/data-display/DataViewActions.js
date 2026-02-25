'use client';

import Link from 'next/link';
import { Eye, Pencil, Trash2, CircleCheck, CircleX, ShieldCheck } from 'lucide-react';

const DefaultIcons = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
  activate: CircleCheck,
  deactivate: CircleX,
  admin: ShieldCheck,
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

  const iconSize = 20;
  const iconClass = 'shrink-0';
  const resolveIcon = (action) => {
    if (action.icon) return <action.icon size={iconSize} className={iconClass} />;
    const IconComponent = DefaultIcons[action.key];
    if (IconComponent) return <IconComponent size={iconSize} className={iconClass} />;
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
