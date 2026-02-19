'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TreeCard, TreeCardSkeleton } from '../trees';
import { authFetch } from '@/lib/api';

export default function ExploreTrees({ 
  title = 'Explore Trees',
  subtitle = 'Discover family histories from around the world',
  showViewAll = true,
  limit = 6,
  filter = 'all', // 'all', 'public', 'my' (my trees only)
  emptyMessage = 'No trees found',
  emptyLinkText = 'Upload GEDCOM',
  emptyLinkHref = '/upload',
}) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (filter === 'public') {
        params.set('filter', 'public');
      } else if (filter === 'my') {
        params.set('filter', 'owned');
      }
      
      // Fetch trees from API
      const response = await authFetch(`/api/trees?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trees');
      }
      
      // Transform API response to component format
      const transformedTrees = (data.trees || []).map(tree => {
        const primaryOwner = tree.owners?.find(o => o.isPrimary)?.user || tree.owners?.[0]?.user;
        return {
          id: tree.id,
          name: tree.name,
          description: tree.description || 'No description provided',
          isPublic: tree.isPublic,
          individualsCount: tree.individualsCount || 0,
          familiesCount: tree.familiesCount || 0,
          parseStatus: tree.parseStatus,
          fileId: tree.fileId,
          owner: primaryOwner ? {
            name: primaryOwner.name || primaryOwner.username,
            username: primaryOwner.username,
          } : null,
          updatedAt: tree.updatedAt,
          createdAt: tree.createdAt,
          ownersCount: tree._count?.owners || 0,
          maintainersCount: tree._count?.treeMaintainers || 0,
        };
      });
      
      setTrees(transformedTrees.slice(0, limit));
    } catch (err) {
      console.error('Failed to fetch trees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, limit]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const handleRequestAccess = (tree) => {
    // TODO: Implement access request modal
    console.log('Request access to:', tree.name);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-base-content">{title}</h2>
            <p className="text-sm text-base-content/60">{subtitle}</p>
          </div>
        </div>
        {showViewAll && (
          <Link href="/explore" className="link link-primary text-sm font-medium flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="card bg-base-100 border border-base-content/10 p-8 text-center rounded-box">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-base-content/80">Failed to load trees</p>
          <p className="text-sm text-base-content/60 mt-1">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <TreeCardSkeleton key={i} />
          ))}
        </div>
      ) : trees.length === 0 ? (
        <div className="card bg-base-100 border border-base-content/10 p-8 text-center rounded-box">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-base-content/80">{emptyMessage}</p>
          <Link href={emptyLinkHref} className="btn btn-primary mt-4">{emptyLinkText}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trees.map((tree, index) => (
            <div 
              key={tree.id}
              className={`animate-slide-up stagger-${index + 1}`}
            >
              <TreeCard 
                tree={tree}
                variant={index === 0 ? 'featured' : 'default'}
                onRequestAccess={handleRequestAccess}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

