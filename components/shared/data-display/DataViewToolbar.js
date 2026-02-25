'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ArrowUpDown, LayoutGrid, List, MousePointerClick } from 'lucide-react';

/**
 * DataViewToolbar — Icon toolbar with progressive disclosure.
 * Icons for Search, Filter, Sort, and ViewToggle.
 * Sections are hidden by default; clicking an icon reveals its section below.
 * Hover/click on an icon slides out to reveal its label (using Motion).
 */
export default function DataViewToolbar({
  // Which section is currently expanded (null = none)
  activeSection,
  onSectionChange,

  // View toggle (card vs list)
  view = 'card',
  onViewChange,

  // Feature flags — show icon only if the feature is available
  hasSearch = true,
  hasFilters = false,
  hasSort = false,
  hasSelectionMode = true,

  // Render props: when a section is active, parent provides the content
  renderSearchSection,
  renderFilterSection,
  renderSortSection,
  renderSelectionSection,

  className = '',
}) {
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const toggleSection = (section) => {
    onSectionChange?.(activeSection === section ? null : section);
  };

  const ToolbarIcon = ({ icon: Icon, label, sectionKey, isActive }) => {
    const isHovered = hoveredIcon === sectionKey;
    const showLabel = isHovered || isActive;

    return (
      <motion.button
        type="button"
        onClick={() => sectionKey && toggleSection(sectionKey)}
        onMouseEnter={() => setHoveredIcon(sectionKey)}
        onMouseLeave={() => setHoveredIcon(null)}
        className={`
          flex items-center gap-2 rounded-lg px-2 py-1.5
          transition-colors
          ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}
        `}
        aria-label={label}
        aria-expanded={sectionKey ? isActive : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence initial={false}>
          {showLabel && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap text-sm font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  const ViewToggleButton = ({ icon: Icon, label, viewKey, isActive }) => {
    const isHovered = hoveredIcon === viewKey;
    const showLabel = isHovered || isActive;

    return (
      <motion.button
        type="button"
        onMouseEnter={() => setHoveredIcon(viewKey)}
        onMouseLeave={() => setHoveredIcon(null)}
        onClick={() => onViewChange?.(viewKey)}
        className={`btn btn-sm join-item ${isActive ? 'btn-primary' : 'btn-ghost'} gap-1.5`}
        aria-label={`${label} view`}
        aria-pressed={isActive}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <AnimatePresence initial={false}>
          {showLabel && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden whitespace-nowrap text-sm"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Icon toolbar row */}
      <div className="flex items-center gap-1 flex-wrap">
        {hasSearch && (
          <ToolbarIcon
            icon={Search}
            label="Search"
            sectionKey="search"
            isActive={activeSection === 'search'}
          />
        )}
        {hasFilters && (
          <ToolbarIcon
            icon={SlidersHorizontal}
            label="Filter"
            sectionKey="filter"
            isActive={activeSection === 'filter'}
          />
        )}
        {hasSort && (
          <ToolbarIcon
            icon={ArrowUpDown}
            label="Sort"
            sectionKey="sort"
            isActive={activeSection === 'sort'}
          />
        )}
        {hasSelectionMode && (
          <ToolbarIcon
            icon={MousePointerClick}
            label="Selection mode"
            sectionKey="selection"
            isActive={activeSection === 'selection'}
          />
        )}

        {/* View toggle — always visible, no section to expand */}
        <div className="flex items-center ml-auto">
          <div className="join">
            <ViewToggleButton icon={LayoutGrid} label="Cards" viewKey="card" isActive={view === 'card'} />
            <ViewToggleButton icon={List} label="List" viewKey="list" isActive={view === 'list'} />
          </div>
        </div>
      </div>

      {/* Expanded section content */}
      <AnimatePresence mode="wait">
        {activeSection === 'search' && renderSearchSection && (
          <motion.div
            key="search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {renderSearchSection()}
            </div>
          </motion.div>
        )}
        {activeSection === 'filter' && renderFilterSection && (
          <motion.div
            key="filter"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {renderFilterSection()}
            </div>
          </motion.div>
        )}
        {activeSection === 'sort' && renderSortSection && (
          <motion.div
            key="sort"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {renderSortSection()}
            </div>
          </motion.div>
        )}
        {activeSection === 'selection' && renderSelectionSection && (
          <motion.div
            key="selection"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {renderSelectionSection()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
