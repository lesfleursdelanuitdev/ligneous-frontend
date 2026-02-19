'use client';

import BaseCard from './BaseCard';

/**
 * CardSkeleton Component
 * Loading skeleton for cards
 * 
 * @param {Object} props
 * @param {string} props.variant - Card variant
 * @param {string} props.className - Additional CSS classes
 */
export default function CardSkeleton({ variant = 'default', className = '' }) {
  return (
    <BaseCard variant={variant} className={className}>
      <div className="animate-pulse space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-base-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-base-200 rounded w-3/4" />
            <div className="h-3 bg-base-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-base-200 rounded" />
          <div className="h-3 bg-base-200 rounded w-5/6" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-base-200 rounded-full w-16" />
          <div className="h-6 bg-base-200 rounded-full w-20" />
        </div>
      </div>
    </BaseCard>
  );
}

