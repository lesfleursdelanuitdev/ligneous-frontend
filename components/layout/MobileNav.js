'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav({ 
  user, 
  isSuperuser,
  onNotificationClick,
  className = '',
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/upload',
      label: 'Upload',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" />
        </svg>
      ),
      isPrimary: true,
    },
    {
      action: onNotificationClick,
      label: 'Alerts',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      badge: 3, // TODO: Real notification count
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 safe-bottom ${className}`}>
      <div className="bg-base-100 border-t border-base-content/10 px-2 py-2 flex items-center justify-around gap-1">
        {navItems.map((item, index) => {
          const isActive = item.href && pathname === item.href;
          
          if (item.isPrimary) {
            return (
              <Link
                key={index}
                href={item.href}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-5 rounded-full btn btn-primary shadow-lg"
                aria-label={item.label}
              >
                {item.icon}
              </Link>
            );
          }

          const Component = item.href ? Link : 'button';
          const props = item.href ? { href: item.href } : { onClick: item.action };

          return (
            <Component
              key={index}
              {...props}
              className={`
                flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 px-1 rounded-lg
                transition-colors relative btn btn-ghost btn-sm
                ${isActive ? 'text-primary' : 'text-base-content/50 hover:text-base-content'}
              `}
              aria-label={item.label}
            >
              <span className="relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-error text-error-content rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Component>
          );
        })}
      </div>
    </nav>
  );
}


