'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TreePine, Plus, Bell, User } from 'lucide-react';
import { useActiveTree } from '@/context/ActiveTreeContext';

export default function MobileNav({
  user,
  isSuperuser,
  onNotificationClick,
  className = '',
}) {
  const pathname = usePathname();
  const { openTreeSelector } = useActiveTree();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: <Home className="w-6 h-6" />,
    },
    {
      action: openTreeSelector,
      label: 'Trees',
      icon: <TreePine className="w-6 h-6" />,
    },
    {
      href: '/upload',
      label: 'Upload',
      icon: <Plus className="w-6 h-6" />,
      isPrimary: true,
    },
    {
      action: onNotificationClick,
      label: 'Alerts',
      icon: <Bell className="w-6 h-6" />,
      badge: 3, // TODO: Real notification count
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <User className="w-6 h-6" />,
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
