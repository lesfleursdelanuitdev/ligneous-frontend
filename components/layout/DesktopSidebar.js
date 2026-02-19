'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Match /trees/[treeId] or /trees/[treeId]/anything
function getTreeIdFromPathname(pathname) {
  const match = pathname?.match(/^\/trees\/([^/]+)/);
  return match ? match[1] : null;
}

const treeNavGroups = [
  {
    title: 'People',
    items: [
      { hrefSuffix: '', label: 'Overview', icon: 'tree' },
      { hrefSuffix: 'individuals', label: 'Individuals', icon: 'people' },
      { hrefSuffix: 'given-names', label: 'Given names', icon: 'tag' },
      { hrefSuffix: 'surnames', label: 'Surnames', icon: 'tag' },
    ],
  },
  {
    title: 'Families',
    items: [
      { hrefSuffix: 'families', label: 'Families', icon: 'family' },
    ],
  },
  {
    title: 'Context',
    items: [
      { hrefSuffix: 'places', label: 'Places', icon: 'place' },
      { hrefSuffix: 'events', label: 'Events', icon: 'event' },
      { hrefSuffix: 'dates', label: 'Dates', icon: 'calendar' },
    ],
  },
  {
    title: 'Evidence',
    items: [
      { hrefSuffix: 'sources', label: 'Sources', icon: 'source' },
      { hrefSuffix: 'notes', label: 'Notes', icon: 'note' },
    ],
  },
];

function SectionTitle({ children, isCollapsed }) {
  if (isCollapsed) return null;
  return (
    <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
      {children}
    </h3>
  );
}

function NavItem({ item, activeStartsWith, pathname, isCollapsed }) {
  const isActive = activeStartsWith
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-colors group
          ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
          }
        `}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-primary' : ''}`}>
        {item.icon}
      </span>
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
    </Link>
  );
}

const iconSvg = (name) => {
  const cls = 'w-5 h-5';
  switch (name) {
    case 'tree':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'people':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'tag':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case 'family':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'place':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'event':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'source':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'note':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
};

export default function DesktopSidebar({ 
  user, 
  isSuperuser,
  isCollapsed = false,
  className = '',
}) {
  const pathname = usePathname();
  const treeId = getTreeIdFromPathname(pathname);

  const mainNavItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/explore',
      label: 'Explore Trees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/search',
      label: 'Search',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
  ];

  const myTreesItems = [
    {
      href: '/my-trees',
      label: 'My Trees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/my-connections',
      label: 'My Connections',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: '/upload',
      label: 'Upload GEDCOM',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
    },
  ];

  const adminItems = [
    {
      href: '/admin/users',
      label: 'Manage Users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/requests',
      label: 'Access Requests',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      href: '/admin/trees',
      label: 'Manage Trees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <aside 
      className={`
        fixed top-16 left-0 bottom-0 z-30
        flex flex-col
        bg-base-100 border-r border-base-content/10
        transition-all duration-200
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main Navigation */}
        <nav className="space-y-1 mb-6">
          {mainNavItems.map((item, index) => (
            <NavItem key={index} item={item} pathname={pathname} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* My Trees Section */}
        <div className="mb-6">
          <SectionTitle isCollapsed={isCollapsed}>My Trees</SectionTitle>
          <nav className="space-y-1">
            {myTreesItems.map((item, index) => (
              <NavItem key={index} item={item} pathname={pathname} isCollapsed={isCollapsed} />
            ))}
          </nav>
        </div>

        {/* Tree-scoped section: People, Families, Context, Evidence */}
        {treeId && (
          <div className="mb-6">
            <SectionTitle isCollapsed={isCollapsed}>Tree</SectionTitle>
            <nav className="space-y-1">
              {treeNavGroups.map((group) => (
                <div key={group.title} className="mb-3">
                  {!isCollapsed && (
                    <h4 className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
                      {group.title}
                    </h4>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((navItem) => {
                      const href = `/trees/${treeId}${navItem.hrefSuffix ? `/${navItem.hrefSuffix}` : ''}`;
                      return (
                        <NavItem
                          key={navItem.hrefSuffix || 'overview'}
                          item={{
                            href,
                            label: navItem.label,
                            icon: iconSvg(navItem.icon),
                          }}
                          activeStartsWith
                          pathname={pathname}
                          isCollapsed={isCollapsed}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        )}

        {/* Admin Section - Only for superusers */}
        {isSuperuser && (
          <div className="mb-6">
            <SectionTitle isCollapsed={isCollapsed}>Administration</SectionTitle>
            <nav className="space-y-1">
              {adminItems.map((item, index) => (
                <NavItem key={index} item={item} pathname={pathname} isCollapsed={isCollapsed} />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Quick Stats (expanded mode only) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-base-content/10">
          <div className="px-3 py-3 rounded-lg bg-base-200">
            <div className="text-xs text-base-content/50 mb-1">Quick Stats</div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">My trees</span>
              <span className="font-medium text-base-content">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Total people</span>
              <span className="font-medium text-base-content">1,247</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

