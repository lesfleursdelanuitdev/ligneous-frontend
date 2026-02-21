'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Download, ImageIcon, GitFork } from 'lucide-react';

/**
 * Toolbar for tree overview page. Edit, Export, Media, Fork/Clone.
 * Icon toolbar with progressive disclosure (labels on hover).
 * Clicking an icon expands its section below. Placeholder UI for now.
 */
export default function TreeOverviewToolbar({
  treeId,
  activeSection,
  onSectionChange,
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
          ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-base-content/10 text-base-content/70 hover:text-base-content'}
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

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="w-full flex items-center gap-1 flex-wrap px-4 py-3 border-b border-base-content/10">
        <ToolbarIcon
          icon={Pencil}
          label="Edit tree"
          sectionKey="edit"
          isActive={activeSection === 'edit'}
        />
        <ToolbarIcon
          icon={Download}
          label="Export"
          sectionKey="export"
          isActive={activeSection === 'export'}
        />
        <ToolbarIcon
          icon={ImageIcon}
          label="Media"
          sectionKey="media"
          isActive={activeSection === 'media'}
        />
        <ToolbarIcon
          icon={GitFork}
          label="Fork / Clone"
          sectionKey="fork"
          isActive={activeSection === 'fork'}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'edit' && (
          <motion.div
            key="edit"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden px-4"
          >
            <div className="pt-2 pb-4 rounded-lg bg-base-200/50 p-4 text-sm text-base-content/70">
              Edit tree settings and metadata. (Coming soon)
            </div>
          </motion.div>
        )}
        {activeSection === 'export' && (
          <motion.div
            key="export"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden px-4"
          >
            <div className="pt-2 pb-4 rounded-lg bg-base-200/50 p-4 text-sm text-base-content/70">
              Export tree as GEDCOM, JSON, or CSV. (Coming soon)
            </div>
          </motion.div>
        )}
        {activeSection === 'media' && (
          <motion.div
            key="media"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden px-4"
          >
            <div className="pt-2 pb-4 rounded-lg bg-base-200/50 p-4 text-sm text-base-content/70">
              View and manage media attached to this tree. (Coming soon)
            </div>
          </motion.div>
        )}
        {activeSection === 'fork' && (
          <motion.div
            key="fork"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden px-4"
          >
            <div className="pt-2 pb-4 rounded-lg bg-base-200/50 p-4 text-sm text-base-content/70">
              Fork or clone this tree to create your own copy. (Coming soon)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

