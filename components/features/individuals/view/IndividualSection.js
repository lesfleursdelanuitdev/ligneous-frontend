'use client';

import { TOP_ID } from './IndividualView';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Base section wrapper for individual detail views.
 * Provides consistent layout and styling; content is passed via children.
 * Use subtitle={true} for nested headings (e.g. within tabs) so they appear smaller.
 * Use showBackToTop={true} to render a back-to-top link at the bottom of the section.
 */
export default function IndividualSection({ title, icon: Icon, count, children, subtitle, showBackToTop }) {
  const headingClass = subtitle
    ? 'text-[0.8125rem] font-medium text-base-content/70'
    : 'text-lg font-semibold text-base-content';
  const iconSize = subtitle ? 16 : 20;

  return (
    <section className="space-y-3">
      {(title || Icon) && (
        <div className="flex items-center gap-2">
          {Icon && <span className="shrink-0 flex items-center justify-center"><Icon size={iconSize} /></span>}
          {title && <h2 className={headingClass}>{title}</h2>}
          {count != null && (
            <span className="badge badge-ghost badge-sm">{count}</span>
          )}
        </div>
      )}
      {children}
      {showBackToTop && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => scrollToId(TOP_ID)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-base-content/70 hover:text-primary hover:bg-base-200/50 transition-colors"
          >
            <span aria-hidden>↑</span>
            Back to top
          </button>
        </div>
      )}
    </section>
  );
}
