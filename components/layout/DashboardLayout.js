'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import DesktopSidebar from './DesktopSidebar';
import NotificationPanel from '../shared/notifications/NotificationPanel';
import GlobalSearch from '@/components/features/search/GlobalSearch';

export default function DashboardLayout({ children }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use useAuthState hook instead of managing own listeners
  const { user, isAuthenticated, isSuperuser } = useAuthState();

  // ⌘K / Ctrl+K to open search
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when notification panel is open on mobile
  useEffect(() => {
    if (isNotificationOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNotificationOpen, isMobile]);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Bar - Fixed on all screen sizes */}
      <TopBar 
        user={user}
        isSuperuser={isSuperuser}
        onNotificationClick={() => setIsNotificationOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="flex pt-16">
        {/* Desktop Sidebar - Hidden on mobile */}
        <DesktopSidebar 
          user={user}
          isSuperuser={isSuperuser}
          isCollapsed={isSidebarCollapsed}
          className="hidden lg:flex"
        />

        {/* Main Content Area */}
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

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        user={user}
        isSuperuser={isSuperuser}
        onNotificationClick={() => setIsNotificationOpen(true)}
        className="lg:hidden"
      />

      {/* Notification Panel - Slide-in */}
      <NotificationPanel 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        user={user}
      />

      {/* Notification Panel Overlay */}
      {isNotificationOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}

      {/* Global Search Modal (command palette) */}
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

