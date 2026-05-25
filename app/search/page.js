'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardLayout,
  GlobalSearch,
  NaturalLanguageSearchPanel,
  TreeCard,
} from '@/components';
import { useExploreTrees } from '@/hooks/queries/useTreesList';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTreeId = searchParams.get('tree') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: treeListData } = useExploreTrees({ perPage: 50 });
  const trees = useMemo(() => treeListData?.trees ?? [], [treeListData]);
  const [selectedTreeId, setSelectedTreeId] = useState(initialTreeId);
  useEffect(() => {
    if (!selectedTreeId && trees.length > 0) {
      setSelectedTreeId(trees[0].id);
    }
  }, [selectedTreeId, trees]);

  // Mock search - replace with real API
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const search = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const q = query.toLowerCase();
      
      // Mock results
      setResults({
        trees: [
          {
            id: 'tree-1',
            name: 'Gonsalves Family Tree',
            description: 'A comprehensive family history spanning from British Guiana to California.',
            isPublic: true,
            individualsCount: 1247,
            familiesCount: 312,
            locations: ['Guyana', 'California'],
            owner: { name: 'Jane Smith' },
            updatedAt: new Date().toISOString(),
          },
        ].filter(t => t.name.toLowerCase().includes(q)),
        individuals: [
          {
            id: 'ind-1',
            name: 'Norman Peter Gonsalves',
            birthYear: 1928,
            deathYear: 2015,
            treeName: 'Gonsalves Family Tree',
            treeId: 'tree-1',
            isAccessible: true,
          },
          {
            id: 'ind-2',
            name: 'Guitree Raghubansie',
            birthYear: 1932,
            treeName: 'Gonsalves Family Tree',
            treeId: 'tree-1',
            isAccessible: true,
          },
          {
            id: 'ind-3',
            name: 'Alfred Gonsalves',
            birthYear: 1894,
            deathYear: 1960,
            treeName: 'Gonsalves Family Tree',
            treeId: 'tree-1',
            isAccessible: true,
          },
        ].filter(i => i.name.toLowerCase().includes(q)),
        places: [
          {
            id: 'place-1',
            name: 'Georgetown, Guyana',
            eventCount: 127,
            treeCount: 3,
          },
          {
            id: 'place-2',
            name: 'San Francisco, California',
            eventCount: 45,
            treeCount: 2,
          },
        ].filter(p => p.name.toLowerCase().includes(q)),
      });
      
      setLoading(false);
    };

    search();
  }, [query]);

  const totalResults = results 
    ? results.trees.length + results.individuals.length + results.places.length 
    : 0;

  const getFilteredResults = () => {
    if (!results) return null;
    if (activeTab === 'all') return results;
    return { [activeTab]: results[activeTab] };
  };

  const filteredResults = getFilteredResults();

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
          Search
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Find trees, people, and places across all family histories
        </p>
      </div>

      {/* Natural-language search (Groq + Python research API) */}
      <div className="mb-8 space-y-3">
        {trees.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <label htmlFor="nl-tree-select" className="font-medium">
              Tree:
            </label>
            <select
              id="nl-tree-select"
              value={selectedTreeId}
              onChange={(event) => setSelectedTreeId(event.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
            >
              {trees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <NaturalLanguageSearchPanel treeId={selectedTreeId} defaultQuery={initialQuery} />
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3 px-4 py-3
                          bg-[var(--color-bg-elevated)] 
                          border border-[var(--color-border)] rounded-xl
                          focus-within:border-[var(--color-accent)]
                          focus-within:ring-2 focus-within:ring-[var(--color-accent-soft)]
                          transition-all shadow-sm">
            <svg className="w-5 h-5 flex-shrink-0 text-[var(--color-text-muted)]" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trees, people, places..."
              className="flex-1 bg-transparent border-none outline-none text-lg
                         text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
              autoFocus
            />
            {loading && (
              <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {query && results && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All', count: totalResults },
              { key: 'trees', label: 'Trees', count: results.trees.length },
              { key: 'individuals', label: 'People', count: results.individuals.length },
              { key: 'places', label: 'Places', count: results.places.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  whitespace-nowrap transition-colors
                  ${activeTab === tab.key
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                  }
                `}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                                 ${activeTab === tab.key 
                                   ? 'bg-white/20' 
                                   : 'bg-[var(--color-bg-tertiary)]'
                                 }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Results Count */}
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            {totalResults} results for "{query}"
          </p>

          {/* Results List */}
          {totalResults === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)]
                              flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No results found
              </h3>
              <p className="text-[var(--color-text-muted)]">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trees Results */}
              {filteredResults?.trees?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
                    </svg>
                    Trees
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredResults.trees.map((tree) => (
                      <TreeCard 
                        key={tree.id} 
                        tree={tree} 
                        showPreview={false}
                        variant="compact"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* People Results */}
              {filteredResults?.individuals?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    People
                  </h2>
                  <div className="card divide-y divide-[var(--color-border)]">
                    {filteredResults.individuals.map((person) => (
                      <Link
                        key={person.id}
                        href={`/trees/${person.treeId}/individuals/${person.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)]
                                        flex items-center justify-center text-[var(--color-text-secondary)]">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {person.name}
                          </p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {person.birthYear} - {person.deathYear || 'Present'} • {person.treeName}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Places Results */}
              {filteredResults?.places?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Places
                  </h2>
                  <div className="card divide-y divide-[var(--color-border)]">
                    {filteredResults.places.map((place) => (
                      <Link
                        key={place.id}
                        href={`/places/${place.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20
                                        flex items-center justify-center text-amber-600">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {place.name}
                          </p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {place.eventCount} events across {place.treeCount} trees
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!query && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)]
                          flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            Start searching
          </h3>
          <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
            Search for family trees by name, people by their names, or places where your ancestors lived.
            All trees are discoverable - request access to explore private collections.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

