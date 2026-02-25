'use client';

import IndividualViewToolbar from './IndividualViewToolbar';

/**
 * Main layout for individual detail views.
 * Composes toolbar at top and sections stacked vertically below.
 */
const TOP_ID = 'individual-view-top';

export default function IndividualView({ toolbar, children, topId = TOP_ID }) {
  return (
    <div
      id={topId}
      className="rounded-lg overflow-hidden border border-base-content/5 bg-base-200/40 shadow-sm"
    >
      <div className="space-y-4 p-4">
        <IndividualViewToolbar>{toolbar}</IndividualViewToolbar>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export { TOP_ID };
