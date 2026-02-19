'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, GlobalSearch, TreeCard, TreeCardSkeleton } from '@/components';
import { authFetch } from '@/lib/api';

export default function ExplorePage() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch trees from API
  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (filter === 'public') {
        params.set('filter', 'public');
      }
      
      const response = await authFetch(`/api/trees?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trees');
      }
      
      // Transform API response
      const transformedTrees = (data.trees || []).map(tree => {
        const primaryOwner = tree.owners?.find(o => o.isPrimary)?.user || tree.owners?.[0]?.user;
        return {
          id: tree.id,
          name: tree.name,
          description: tree.description || 'No description provided',
          isPublic: tree.isPublic,
          individualsCount: tree.individualsCount || 0,
          familiesCount: tree.familiesCount || 0,
          fileId: tree.fileId,
          owner: primaryOwner ? {
            name: primaryOwner.name || primaryOwner.username,
            username: primaryOwner.username,
          } : null,
          updatedAt: tree.updatedAt,
          createdAt: tree.createdAt,
        };
      });
      
      setTrees(transformedTrees);
    } catch (err) {
      console.error('Failed to fetch trees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  // Client-side filtering and sorting
  let filteredTrees = [...trees];
  
  if (filter === 'private') {
    filteredTrees = filteredTrees.filter(t => !t.isPublic);
  }

  if (sortBy === 'recent') {
    filteredTrees.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  } else if (sortBy === 'popular') {
    filteredTrees.sort((a, b) => b.individualsCount - a.individualsCount);
  } else if (sortBy === 'name') {
    filteredTrees.sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleRequestAccess = (tree) => {
    console.log('Request access to:', tree.name);
    // TODO: Open access request modal
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          Explore Family Trees
        </h1>
        <p className="text-base-content/60 mt-1">
          Discover family histories from around the world
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <GlobalSearch placeholder="Search all trees by name, location, or family names..." />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Access Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/60">Show:</span>
          <div className="join">
            {[
              { key: 'all', label: 'All' },
              { key: 'public', label: 'Public' },
              { key: 'private', label: 'Private' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                className={`btn btn-sm join-item ${filter === opt.key ? 'btn-primary' : 'btn-ghost'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-base-content/60">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="recent">Recently Updated</option>
            <option value="popular">Most People</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-base-content/60 mb-4">
        {loading ? 'Loading...' : `Showing ${filteredTrees.length} ${filteredTrees.length === 1 ? 'tree' : 'trees'}`}
      </p>

      {/* Error State */}
      {error && (
        <div className="card bg-base-100 border border-error/30 p-8 text-center mb-6">
          <p className="text-error">{error}</p>
          <button type="button" onClick={fetchTrees} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      )}

      {/* Trees Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TreeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTrees.length === 0 ? (
        <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-base-content mb-2">
            No trees found
          </h3>
          <p className="text-base-content/60">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrees.map((tree, index) => (
            <div 
              key={tree.id}
              className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}
            >
              <TreeCard 
                tree={tree}
                onRequestAccess={handleRequestAccess}
              />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

