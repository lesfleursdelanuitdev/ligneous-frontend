'use client';

import { useState } from 'react';

/**
 * DataViewTabs Component
 * Tab container using DaisyUI tab styling.
 *
 * @param {Array}    tabs       - Array of { key, label, content, icon? }
 * @param {string}   defaultTab - Default active tab key (defaults to first tab)
 * @param {Function} onChange   - Optional callback when tab changes
 */
export default function DataViewTabs({
  tabs = [],
  defaultTab,
  onChange,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');

  if (tabs.length === 0) return null;

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (onChange) onChange(key);
  };

  const current = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className={className}>
      <div className="tabs tabs-lifted tabs-sm" role="tablist">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;
          const roundedClasses = tabs.length === 1
            ? 'rounded-t-box'
            : isFirst
              ? 'rounded-tl-box'
              : isLast
                ? 'rounded-tr-box'
                : '';
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              className={`tab text-sm gap-1.5 px-3 py-2 ${roundedClasses} ${activeTab === tab.key ? 'tab-active bg-primary text-primary-content border-primary' : 'bg-base-200 text-base-content/70 border border-base-content/15 border-b-0'}`}
              onClick={() => handleTabChange(tab.key)}
              aria-selected={activeTab === tab.key}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        className="rounded-b-box border-x border-b border-base-content/10 bg-base-100 p-4 pt-5 -mt-px"
      >
        {current.content}
      </div>
    </div>
  );
}
