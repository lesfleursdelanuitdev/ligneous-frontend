'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import {
  Menu as MenuIcon,
  TreePine,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { ThemeToggle } from '../shared/theme';

const iconClass = 'size-5 shrink-0';
const iconClassMuted = 'size-5 shrink-0 text-base-content/70';

export default function TopBar({
  onNotificationClick,
  onSearchClick,
  onSidebarToggle,
  isSidebarCollapsed,
  notificationCount = 3, // TODO: Get from real data
}) {
  const router = useRouter();
  const { user, isAuthenticated, isSuperuser, authFacet } = useAuthState();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 safe-top">
      <div className="h-full px-4 flex items-center justify-between gap-4 bg-base-100 border-b border-base-content/10 shadow-sm">
        {/* Left: Logo & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-base-200 transition-colors"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <MenuIcon className={iconClassMuted} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-content">
              <TreePine className="size-5" />
            </div>
            <span className="font-semibold text-lg text-base-content hidden sm:inline">Ligneous</span>
          </Link>
        </div>

        {/* Center: Search - opens GlobalSearch modal when onSearchClick provided, else link to /search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          {onSearchClick ? (
            <button
              type="button"
              onClick={onSearchClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-base-200 border border-base-content/10 text-base-content/60 hover:border-base-content/20 transition-colors cursor-pointer text-left"
              aria-label="Open search"
            >
              <Search className={iconClass} />
              <span className="text-sm">Search trees, people, places...</span>
              <kbd className="hidden lg:inline-flex ml-auto items-center gap-1 px-2 py-0.5 text-xs text-base-content/50 bg-base-300 rounded border border-base-content/10">⌘K</kbd>
            </button>
          ) : (
            <Link
              href="/search"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-base-200 border border-base-content/10 text-base-content/60 hover:border-base-content/20 transition-colors cursor-pointer"
            >
              <Search className={iconClass} />
              <span className="text-sm">Search trees, people, places...</span>
              <kbd className="hidden lg:inline-flex ml-auto items-center gap-1 px-2 py-0.5 text-xs text-base-content/50 bg-base-300 rounded border border-base-content/10">⌘K</kbd>
            </Link>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={onNotificationClick}
            className="btn btn-ghost btn-square btn-sm relative"
            aria-label="Notifications"
          >
            <Bell className={iconClassMuted} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-error text-error-content rounded-full">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* User Menu - Headless UI Menu + DaisyUI */}
          <Menu as="div" className="relative">
            <MenuButton className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-base-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium text-sm">
                {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-base-content max-w-[120px] truncate">
                {user?.name || user?.username || 'User'}
              </span>
              <ChevronDown className="size-4 text-base-content/50 group-data-[open]:rotate-180 transition-transform" />
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-50 mt-2 w-56 origin-top-right rounded-box border border-base-content/10 bg-base-100 py-2 shadow-lg outline-none"
            >
              <div className="px-4 py-3 border-b border-base-content/10">
                <p className="text-sm font-medium text-base-content">{user?.name || user?.username}</p>
                <p className="text-xs text-base-content/60 truncate">{user?.email}</p>
                {isSuperuser && (
                  <span className="badge badge-error badge-sm mt-1">Superuser</span>
                )}
              </div>
              <div className="py-1">
                <MenuItem>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content data-[active]:bg-base-200 data-[active]:text-base-content"
                  >
                    <User className="size-4" />
                    Profile
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content data-[active]:bg-base-200 data-[active]:text-base-content"
                  >
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </MenuItem>
              </div>
              {isSuperuser && (
                <div className="py-1 border-t border-base-content/10">
                  <MenuItem>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 data-[active]:bg-error/10"
                    >
                      <Shield className="size-4" />
                      Admin Panel
                    </Link>
                  </MenuItem>
                </div>
              )}
              <div className="py-1 border-t border-base-content/10">
                <MenuItem>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content data-[active]:bg-base-200 data-[active]:text-base-content"
                    onClick={async () => {
                      if (authFacet) {
                        await authFacet.logout();
                        router.push('/login');
                      }
                    }}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
}
