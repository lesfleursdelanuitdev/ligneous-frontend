'use client';

import Link from 'next/link';

/**
 * Breadcrumbs Component
 * Hierarchical breadcrumb navigation
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of { label, href } objects
 * @param {string} props.className - Additional CSS classes
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ul>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index}>
              {isLast ? (
                <span className="font-medium text-base-content">{item.label}</span>
              ) : (
                <Link href={item.href} className="text-base-content/60 hover:text-base-content">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

