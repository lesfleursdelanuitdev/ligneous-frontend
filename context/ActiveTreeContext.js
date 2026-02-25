'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/api';

const ActiveTreeContext = createContext(null);

const STORAGE_KEY = 'ligneous_last_tree_id';

function getTreeIdFromPathname(pathname) {
  const match = pathname?.match(/^\/trees\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveTreeProvider({ children }) {
  return (
    <ActiveTreeContext.Provider value={useActiveTreeState()}>
      {children}
    </ActiveTreeContext.Provider>
  );
}

/**
 * All active-tree state logic isolated here so the provider JSX stays clean.
 */
function useActiveTreeState() {
  const pathname = usePathname();
  const router = useRouter();

  const [trees, setTrees] = useState([]);
  const [activeTree, setActiveTreeState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTreeSelectorOpen, setIsTreeSelectorOpen] = useState(false);
  const initialised = useRef(false);

  // ── Fetch all accessible trees once on mount ──────────────────────────────
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/trees');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const sorted = (data.trees || []).slice().sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setTrees(sorted);

        if (sorted.length === 0) return;

        // Resolve: URL treeId → localStorage → first alphabetically
        const urlId = getTreeIdFromPathname(pathname);
        const storedId =
          typeof window !== 'undefined'
            ? localStorage.getItem(STORAGE_KEY)
            : null;

        const resolved =
          (urlId && sorted.find((t) => t.id === urlId)) ||
          (storedId && sorted.find((t) => t.id === storedId)) ||
          sorted[0];

        if (resolved) {
          setActiveTreeState(resolved);
          localStorage.setItem(STORAGE_KEY, resolved.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync active tree when URL navigates to a different tree ───────────────
  useEffect(() => {
    if (trees.length === 0) return;
    const urlId = getTreeIdFromPathname(pathname);
    if (!urlId) return;
    const tree = trees.find((t) => t.id === urlId);
    if (tree && tree.id !== activeTree?.id) {
      setActiveTreeState(tree);
      localStorage.setItem(STORAGE_KEY, tree.id);
    }
  }, [pathname, trees]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public setActiveTree (without navigation) ─────────────────────────────
  const setActiveTree = useCallback((tree) => {
    setActiveTreeState(tree);
    localStorage.setItem(STORAGE_KEY, tree.id);
  }, []);

  // ── switchTree: update state + navigate to same page under new treeId ─────
  const switchTree = useCallback(
    (tree) => {
      setActiveTree(tree);
      setIsTreeSelectorOpen(false);

      const urlId = getTreeIdFromPathname(pathname);
      if (urlId) {
        // Replace old treeId segment in path with the new one
        const newPath = pathname.replace(
          `/trees/${urlId}`,
          `/trees/${tree.id}`
        );
        router.push(newPath);
      }
    },
    [pathname, router, setActiveTree]
  );

  return {
    activeTree,
    trees,
    loading,
    setActiveTree,
    switchTree,
    isTreeSelectorOpen,
    openTreeSelector: () => setIsTreeSelectorOpen(true),
    closeTreeSelector: () => setIsTreeSelectorOpen(false),
  };
}

export function useActiveTree() {
  const ctx = useContext(ActiveTreeContext);
  if (!ctx) throw new Error('useActiveTree must be used within ActiveTreeProvider');
  return ctx;
}
