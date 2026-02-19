'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Mock search results - will be replaced with real API calls
const mockSearchResults = {
  trees: [
    {
      id: 'tree-1',
      name: 'Gonsalves Family Tree',
      individualsCount: 1247,
      location: 'Guyana, California',
      isPublic: true,
    },
    {
      id: 'tree-2',
      name: 'Gonsalves-Pereira Archives',
      individualsCount: 892,
      location: 'Portugal, Brazil',
      isPublic: false,
    },
  ],
  individuals: [
    {
      id: 'ind-1',
      name: 'Norman Peter Gonsalves',
      treeName: 'Gonsalves Family Tree',
      treeId: 'tree-1',
      birthYear: 1928,
      isAccessible: true,
    },
    {
      id: 'ind-2',
      name: 'Maria Gonsalves',
      treeName: 'Gonsalves Family Tree',
      treeId: 'tree-1',
      birthYear: 1932,
      isAccessible: true,
    },
    {
      id: 'ind-3',
      name: 'Augustinho Gonsalves',
      treeName: 'Gonsalves-Pereira Archives',
      treeId: 'tree-2',
      birthYear: 1890,
      isAccessible: false,
    },
  ],
  places: [
    {
      id: 'place-1',
      name: 'Georgetown, Guyana',
      eventCount: 127,
      treeCount: 3,
    },
  ],
};

export default function GlobalSearch({ 
  isOpen, 
  onClose,
  placeholder = 'Search trees, people, places...',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const inputRef = useRef(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // This would be handled by parent component
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  const search = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    
    // TODO: Replace with real API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter mock results based on query
    const q = searchQuery.toLowerCase();
    const filtered = {
      trees: mockSearchResults.trees.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.location?.toLowerCase().includes(q)
      ),
      individuals: mockSearchResults.individuals.filter(i => 
        i.name.toLowerCase().includes(q)
      ),
      places: mockSearchResults.places.filter(p => 
        p.name.toLowerCase().includes(q)
      ),
    };

    setResults(filtered);
    setLoading(false);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose?.();
    }
  };

  const totalResults = results 
    ? results.trees.length + results.individuals.length + results.places.length 
    : 0;

  const filteredResults = results && activeFilter !== 'all'
    ? { [activeFilter]: results[activeFilter] }
    : results;

  return (
    <div className="w-full">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 px-4 py-3
                        bg-base-200 border border-base-content/10 rounded-xl
                        focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20
                        transition-all">
          <svg className="w-5 h-5 flex-shrink-0 text-base-content/50" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none
                       text-base-content placeholder-base-content/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-base-200 transition-colors"
            >
              <svg className="w-4 h-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {loading && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </form>

      {/* Results */}
      {query && results && (
        <div className="mt-4 bg-base-100 border border-base-content/10 
                        rounded-xl shadow-lg overflow-hidden animate-slide-up">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-base-content/10
                          overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All', count: totalResults },
              { key: 'trees', label: 'Trees', count: results.trees.length },
              { key: 'individuals', label: 'People', count: results.individuals.length },
              { key: 'places', label: 'Places', count: results.places.length },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  whitespace-nowrap transition-colors
                  ${activeFilter === filter.key
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/70 hover:bg-base-200'
                  }
                `}
              >
                {filter.label}
                <span className={`text-xs ${activeFilter === filter.key ? 'opacity-80' : 'opacity-60'}`}>
                  ({filter.count})
                </span>
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {totalResults === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-base-content/70">
                  No results found for "{query}"
                </p>
                <p className="text-sm text-base-content/50 mt-1">
                  Try different keywords or check your spelling
                </p>
              </div>
            ) : (
              <div className="divide-y divide-base-content/10">
                {/* Trees */}
                {filteredResults?.trees?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-base-200">
                      <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                        Trees
                      </span>
                    </div>
                    {filteredResults.trees.map((tree) => (
                      <Link
                        key={tree.id}
                        href={`/trees/${tree.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                        ${tree.isPublic ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content truncate">
                            {tree.name}
                          </p>
                          <p className="text-sm text-base-content/50">
                            {tree.individualsCount.toLocaleString()} individuals • {tree.location}
                          </p>
                        </div>
                        {tree.isPublic ? (
                          <span className="badge badge-public">Public</span>
                        ) : (
                          <span className="badge badge-private">Private</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Individuals */}
                {filteredResults?.individuals?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-base-200">
                      <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                        People
                      </span>
                    </div>
                    {filteredResults.individuals.map((individual) => (
                      <Link
                        key={individual.id}
                        href={individual.isAccessible 
                          ? `/trees/${individual.treeId}/individuals/${individual.id}`
                          : `/trees/${individual.treeId}/request-access`
                        }
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-base-200 
                                        flex items-center justify-center text-base-content/70">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${individual.isAccessible ? 'text-base-content' : 'text-base-content/50'}`}>
                            {individual.name}
                          </p>
                          <p className="text-sm text-base-content/50">
                            in {individual.treeName} • b. {individual.birthYear}
                          </p>
                        </div>
                        {!individual.isAccessible && (
                          <span className="text-xs text-base-content/50 bg-base-200 px-2 py-1 rounded">
                            Request access
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Places */}
                {filteredResults?.places?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-base-200">
                      <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                        Places
                      </span>
                    </div>
                    {filteredResults.places.map((place) => (
                      <Link
                        key={place.id}
                        href={`/places/${place.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20
                                        flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content truncate">
                            {place.name}
                          </p>
                          <p className="text-sm text-base-content/50">
                            {place.eventCount} events across {place.treeCount} trees
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-base-content/10 bg-base-200">
            <button
              onClick={handleSubmit}
              className="w-full py-2 text-center text-sm font-medium
                         link link-primary"
            >
              See all results for "{query}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


