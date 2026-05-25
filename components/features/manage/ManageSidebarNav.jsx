'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UsersRound,
  UserCheck,
  Link2,
  Tag,
  GitMerge,
  MapPin,
  ShieldAlert,
  Inbox,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

const NAV_ITEMS = [
  { suffix: '', label: 'Overview', Icon: LayoutDashboard, exact: true },
  { suffix: 'members', label: 'Members', Icon: UsersRound },
  { suffix: 'access-requests', label: 'Access Requests', Icon: UserCheck },
  { suffix: 'relationships', label: 'Relationships', Icon: Link2 },
  { suffix: 'attribute-types', label: 'Attribute Types', Icon: Tag },
  { suffix: 'merge', label: 'Merge Records', Icon: GitMerge },
  { suffix: 'places', label: 'Place Resolution', Icon: MapPin },
  { suffix: 'health', label: 'Health', Icon: ShieldAlert },
  { suffix: 'contact-inbox', label: 'Contact Inbox', Icon: Inbox },
  { suffix: 'settings', label: 'Settings', Icon: Settings },
];

export default function ManageSidebarNav({ treeId }) {
  const pathname = usePathname();
  const base = `/trees/${treeId}/manage`;

  return (
    <nav className="w-52 shrink-0 space-y-0.5">
      {NAV_ITEMS.map(({ suffix, label, Icon, exact }) => {
        const href = suffix ? `${base}/${suffix}` : base;
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={suffix || 'overview'}
            href={href}
            className={`
              flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}
            `}
          >
            <Icon size={16} className="shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
