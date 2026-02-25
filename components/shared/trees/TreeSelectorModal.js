'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { X, Search, Check, Users, TreePine } from 'lucide-react';
import { useActiveTree } from '@/context/ActiveTreeContext';

export default function TreeSelectorModal() {
  const { trees, activeTree, switchTree, isTreeSelectorOpen, closeTreeSelector } =
    useActiveTree();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  // Reset query and focus search whenever modal opens
  useEffect(() => {
    if (isTreeSelectorOpen) {
      setQuery('');
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isTreeSelectorOpen]);

  if (!isTreeSelectorOpen) return null;

  const filtered = query.trim()
    ? trees.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase())
      )
    : trees;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeTreeSelector}
        aria-hidden
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-base-100 rounded-box shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
          style={{ maxHeight: '75vh' }}
          role="dialog"
          aria-modal
          aria-label="Switch tree"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10 shrink-0">
            <div className="flex items-center gap-2">
              <TreePine size={18} className="text-primary shrink-0" />
              <h2 className="text-base font-semibold text-base-content">Switch Tree</h2>
            </div>
            <button
              type="button"
              onClick={closeTreeSelector}
              className="btn btn-ghost btn-square btn-sm"
              aria-label="Close"
            >
              <X size={18} className="shrink-0" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-base-content/10 shrink-0">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none shrink-0"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter trees..."
                className="input input-bordered input-sm w-full pl-9"
              />
            </div>
          </div>

          {/* Tree list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-base-content/50 text-sm">
                No trees found
              </div>
            ) : (
              <ul>
                {filtered.map((tree) => {
                  const isActive = activeTree?.id === tree.id;
                  return (
                    <li key={tree.id}>
                      <button
                        type="button"
                        onClick={() => {
                          switchTree(tree);
                          toast.success(`Switched to ${tree.name}`);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left group ${
                          isActive ? 'bg-primary/5' : ''
                        }`}
                      >
                        {/* Tree icon */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-primary text-primary-content'
                              : 'bg-base-200 text-base-content/50 group-hover:bg-base-300'
                          }`}
                        >
                          <TreePine size={16} className="shrink-0" />
                        </div>

                        {/* Name + stats */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium truncate ${
                                isActive ? 'text-primary' : 'text-base-content'
                              }`}
                            >
                              {tree.name}
                            </span>
                            <span
                              className={`badge badge-xs shrink-0 ${
                                tree.isPublic ? 'badge-success' : 'badge-ghost'
                              }`}
                            >
                              {tree.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-base-content/50">
                            <Users size={11} className="shrink-0" />
                            <span>
                              {(tree.individualsCount ?? 0).toLocaleString()} people
                            </span>
                          </div>
                        </div>

                        {/* Active checkmark */}
                        {isActive && (
                          <Check size={16} className="text-primary shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-base-content/10 flex items-center justify-between shrink-0">
            <span className="text-xs text-base-content/50">
              {trees.length} tree{trees.length !== 1 ? 's' : ''} available
            </span>
            <Link
              href="/explore"
              onClick={closeTreeSelector}
              className="text-xs link link-primary"
            >
              Explore trees →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
