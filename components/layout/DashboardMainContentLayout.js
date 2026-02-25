'use client';

import DashboardLayout from './DashboardLayout';
import TreePageHeader from '@/components/shared/TreePageHeader';
import Breadcrumbs from '@/components/shared/navigation/Breadcrumbs';
import { useActiveTree } from '@/context/ActiveTreeContext';

const MAX_WIDTH_MAP = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

function TreeName() {
  const { activeTree } = useActiveTree();
  if (!activeTree?.name) return null;
  return (
    <p className="uppercase text-sm text-secondary tracking-wide">
      {activeTree.name}
    </p>
  );
}

export default function DashboardMainContentLayout({
  treeId,
  title,
  subtitle,
  breadcrumbs,
  actions,
  maxWidth = '6xl',
  children,
}) {
  const widthClass = MAX_WIDTH_MAP[maxWidth] || MAX_WIDTH_MAP['6xl'];

  const defaultBreadcrumbs = treeId
    ? [{ label: 'Tree overview', href: `/trees/${treeId}` }, { label: title }]
    : [{ label: 'Home', href: '/dashboard' }, { label: title }];
  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <DashboardLayout>
      <div className={`p-6 ${widthClass} mx-auto space-y-6`}>
        <Breadcrumbs items={items} />
        {treeId && <TreeName />}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TreePageHeader title={title} subtitle={subtitle} />
          {actions}
        </div>
        {children}
      </div>
    </DashboardLayout>
  );
}
