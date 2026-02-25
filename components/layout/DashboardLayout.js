'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { ActiveTreeProvider, useActiveTree } from '@/context/ActiveTreeContext';
import { TreeSelectorModal } from '@/components/shared/trees';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';
import NotificationPanel from '../shared/notifications/NotificationPanel';
import GlobalSearch from '@/components/features/search/GlobalSearch';

/**
 * Inner layout — rendered inside ActiveTreeProvider so it can read tree context.
 */
function DashboardLayoutInner({ children }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, isAuthenticated, isSuperuser } = useAuthState();

  // ⌘K / Ctrl+K → open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when notification panel is open on mobile
  useEffect(() => {
    document.body.style.overflow = isNotificationOpen && isMobile ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isNotificationOpen, isMobile]);

  return (
    <div className="min-h-screen bg-base-200">
      <TopBar
        onNotificationClick={() => setIsNotificationOpen(true)}
        onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="flex pt-16">
        <DesktopSidebar
          user={user}
          isSuperuser={isSuperuser}
          isCollapsed={isSidebarCollapsed}
          className="hidden lg:flex"
        />

        <main
          className={`
            flex-1 min-h-[calc(100vh-4rem)]
            transition-all duration-200
            ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            pb-20 lg:pb-8
          `}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      <MobileNav
        user={user}
        isSuperuser={isSuperuser}
        onNotificationClick={() => setIsNotificationOpen(true)}
        className="lg:hidden"
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        user={user}
      />
      {isNotificationOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}

      {/* Tree Selector Modal — driven by ActiveTreeContext */}
      <TreeSelectorModal />

      {/* Global Search Modal (⌘K) */}
      {isSearchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsSearchOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <div
              className="w-full max-w-xl bg-base-100 rounded-box shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                placeholder="Search trees, people, places..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ActiveTreeProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ActiveTreeProvider>
  );
}
