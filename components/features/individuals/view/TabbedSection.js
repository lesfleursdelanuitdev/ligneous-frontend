'use client';

import { useState } from 'react';
import IndividualSection from './IndividualSection';
import IndividualSectionTabs from './IndividualSectionTabs';
import IndividualSectionTabsContent from './IndividualSectionTabsContent';

/**
 * Combines IndividualSection, IndividualSectionTabs, and IndividualSectionTabsContent
 * with built-in tab state management. Use children as a render prop: (activeTab) => content.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {boolean} [props.showBackToTop] - Show back-to-top link
 * @param {number} [props.count] - Badge count for section header
 * @param {Array<{id: string, label: string, icon?: Component, count?: number}>} props.tabs - Tab definitions
 * @param {string} [props.defaultTab] - Initial active tab (defaults to first tab's id)
 * @param {(activeTab: string) => React.ReactNode} props.children - Render prop for tab content
 */
export default function TabbedSection({
  title,
  showBackToTop,
  count,
  tabs,
  defaultTab,
  children,
}) {
  const initialTab = defaultTab ?? tabs[0]?.id ?? '';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <IndividualSection title={title} showBackToTop={showBackToTop} count={count}>
      <IndividualSectionTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
      />
      <IndividualSectionTabsContent>
        {typeof children === 'function' ? children(activeTab) : children}
      </IndividualSectionTabsContent>
    </IndividualSection>
  );
}
