'use client';

import Link from 'next/link';
import { DashboardLayout, ExploreTrees, RecentActivity, PendingRequests, GlobalSearch } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';

export default function DashboardPage() {
  const { isReady, isAuthenticated, user, isSuperuser } = useRequireAuth('/login');
  const { data: stats, isLoading: statsLoading } = useDashboardStats({
    enabled: isReady && isAuthenticated,
  });
  const safeStats = stats || { treesOwned: 0, totalIndividuals: 0, collaborators: 0, pendingRequests: 0 };

  // Show loading while checking auth
  if (!isReady) {
    console.log('[DashboardPage] Not ready, showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner text-primary loading-lg" />
          <p className="mt-4 text-base-content/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after check, the hook will redirect
  if (!isAuthenticated || !user) {
    console.warn('[DashboardPage] Not authenticated or no user, hook should redirect');
    return null;
  }

  console.log('[DashboardPage] Rendering dashboard', {
    userId: user.id,
    username: user.username,
    isSuperuser,
    statsLoading,
  });

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          Welcome back, {user?.name || user?.username}! 👋
        </h1>
        <p className="text-base-content/60 mt-1">
          {isSuperuser 
            ? "Here's your admin overview and what's happening on the platform"
            : "Here's what's happening in your family trees"
          }
        </p>
      </div>

      {/* Search Bar (Mobile) */}
      <div className="mb-6 md:hidden">
        <GlobalSearch placeholder="Search trees, people, places..." />
      </div>

      {/* SUPERUSER: Pending Requests - Most Prominent */}
      {isSuperuser && (
        <PendingRequests maxItems={5} showViewAll={true} />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          }
          label="My Trees"
          value={statsLoading ? '...' : safeStats.treesOwned.toString()}
          color="emerald"
        />
        <StatCard 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="Total People"
          value={statsLoading ? '...' : safeStats.totalIndividuals.toLocaleString()}
          color="blue"
        />
        <StatCard 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Collaborators"
          value={statsLoading ? '...' : safeStats.collaborators.toString()}
          color="purple"
        />
        <StatCard 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          label="Pending"
          value={statsLoading ? '...' : safeStats.pendingRequests.toString()}
          color="amber"
          highlight={safeStats.pendingRequests > 0}
        />
      </div>

      {/* My Trees Section */}
      <ExploreTrees 
        title="My Family Trees" 
        subtitle="Trees you own or maintain"
        filter="my"
        limit={3}
        emptyMessage="You don't have any family trees yet. Upload a GEDCOM file to get started!"
        emptyLinkText="Upload GEDCOM"
        emptyLinkHref="/upload"
      />

      {/* Explore Public Trees Section */}
      <ExploreTrees 
        title="Explore Public Trees" 
        subtitle="Discover family histories from around the world"
        filter="public"
        limit={3}
      />

      {/* Two Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <RecentActivity limit={5} />
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <section>
            <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="card p-4 space-y-2">
              <Link 
                href="/upload"
                className="flex items-center gap-3 p-3 rounded-lg
                           hover:bg-base-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary
                                group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-base-content">Upload GEDCOM</p>
                  <p className="text-xs text-base-content/60">Add a new family tree</p>
                </div>
              </Link>

              <Link 
                href="/explore"
                className="flex items-center gap-3 p-3 rounded-lg
                           hover:bg-base-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center text-info
                                group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-base-content">Search People</p>
                  <p className="text-xs text-base-content/60">Find yourself in a tree</p>
                </div>
              </Link>

              <Link 
                href="/my-connections"
                className="flex items-center gap-3 p-3 rounded-lg
                           hover:bg-base-200 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary
                                group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-base-content">My Connections</p>
                  <p className="text-xs text-base-content/60">View linked individuals</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Admin Panel (Superuser only) */}
          {isSuperuser && (
            <section>
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
                🛡️ Admin Panel
              </h3>
              <div className="card bg-base-100 p-4 border border-base-content/10 border-secondary/30 bg-secondary/5">
                <div className="space-y-2">
                  <Link 
                    href="/admin/users"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary
                                    group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-base-content">Manage Users</p>
                      <p className="text-xs text-base-content/60">View, edit, deactivate users</p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/roles"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary
                                    group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-base-content">Manage Roles</p>
                      <p className="text-xs text-base-content/60">Define roles and permissions</p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/trees"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary
                                    group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-base-content">Manage Trees</p>
                      <p className="text-xs text-base-content/60">Manage all family trees</p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/requests"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center text-warning
                                    group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-base-content">All Requests</p>
                      <p className="text-xs text-base-content/60">Review all access requests</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * StatCard component for quick stats display
 */
function StatCard({ icon, label, value, color = 'emerald', highlight = false }) {
  const colors = {
    emerald: 'bg-primary/10 text-primary',
    blue: 'bg-info/20 text-info',
    purple: 'bg-secondary/20 text-secondary',
    amber: 'bg-warning/20 text-warning',
  };

  return (
    <div className={`card bg-base-100 p-4 border border-base-content/10 ${highlight ? 'ring-2 ring-warning' : ''}`}>
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-base-content">{value}</p>
      <p className="text-sm text-base-content/60">{label}</p>
    </div>
  );
}
