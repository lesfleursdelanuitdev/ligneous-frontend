'use client';

/**
 * Container for tab content within an IndividualSection.
 * Renders whatever content the parent passes as children for the active tab.
 */
export default function IndividualSectionTabsContent({ children }) {
  return <div className="space-y-3">{children}</div>;
}
