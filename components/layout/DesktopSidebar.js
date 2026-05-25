'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTreeCanManage } from '@/hooks/queries/useTreeCanManage';
import {
  Home,
  Upload,
  Users,
  UserCircle,
  Tag,
  Heart,
  MapPin,
  CalendarDays,
  CalendarClock,
  BookOpen,
  FileText,
  Shield,
  ClipboardList,
  FolderOpen,
  Network,
  TreePine,
  ChevronsUpDown,
  Search,
  Hash,
  Image,
  Video,
  Music,
  ScanText,
  ScrollText,
  Images,
  Tags,
  Compass,
  ChevronRight,
  LayoutDashboard,
  Library,
  FolderCog,
  Wrench,
  ShieldCheck,
  UsersRound,
  HeartHandshake,
  Globe,
  BookMarked,
  LayoutGrid,
  FolderTree,
  Lightbulb,
  MessageCircle,
  Link2,
  CookingPot,
  Rss,
  ImagePlay,
  UserSquare2,
} from 'lucide-react';
import { useActiveTree } from '@/context/ActiveTreeContext';

// ─── Nav data ─────────────────────────────────────────────────────────────────

const treeNavGroups = [
  {
    title: 'People',
    items: [
      { hrefSuffix: 'individuals', label: 'Individuals', Icon: UserCircle },
      { hrefSuffix: 'given-names', label: 'Given names', Icon: Tag },
      { hrefSuffix: 'surnames',    label: 'Surnames',    Icon: Hash },
    ],
  },
  {
    title: 'Families',
    items: [
      { hrefSuffix: 'families', label: 'Families', Icon: Heart },
    ],
  },
  {
    title: 'Context',
    items: [
      { hrefSuffix: 'places', label: 'Places', Icon: MapPin },
      { hrefSuffix: 'events', label: 'Events', Icon: CalendarDays },
      { hrefSuffix: 'dates',  label: 'Dates',  Icon: CalendarClock },
    ],
  },
  {
    title: 'Evidence',
    items: [
      { hrefSuffix: 'sources', label: 'Sources', Icon: BookOpen },
      { hrefSuffix: 'notes',   label: 'Notes',   Icon: FileText },
    ],
  },
  {
    title: 'Media',
    items: [
      { hrefSuffix: 'pictures',  label: 'Pictures',  Icon: Image },
      { hrefSuffix: 'videos',    label: 'Videos',    Icon: Video },
      { hrefSuffix: 'audio',     label: 'Audio',     Icon: Music },
      { hrefSuffix: 'documents', label: 'Documents', Icon: ScanText },
      { hrefSuffix: 'stories',   label: 'Stories',   Icon: ScrollText },
      { hrefSuffix: 'albums',    label: 'Albums',   Icon: Images },
      { hrefSuffix: 'tags',      label: 'Tags',     Icon: Tags },
    ],
  },
  {
    title: 'Research',
    items: [
      { hrefSuffix: 'research/notes',        label: 'Research notes', Icon: FileText },
      { hrefSuffix: 'research/todos',       label: 'Todo lists',    Icon: ClipboardList },
      { hrefSuffix: 'research/most-wanted',  label: 'Most wanted',   Icon: MessageCircle },
      { hrefSuffix: 'research/links',       label: 'Research links', Icon: Link2 },
    ],
  },
];

const treeSectionIcons = {
  People: UsersRound,
  Families: HeartHandshake,
  Context: Globe,
  Evidence: BookMarked,
  Media: LayoutGrid,
  Research: Lightbulb,
};

// ─── Small sub-components ─────────────────────────────────────────────────────

function NavItem({ item, activeStartsWith, pathname, isCollapsed, indent = false }) {
  const isActive = activeStartsWith
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 rounded-lg transition-colors
        ${indent ? 'pl-9 pr-3 py-2' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-primary/10 text-primary'
          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}
      `}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={`shrink-0 ${isActive ? 'text-primary' : ''}`}>
        {item.icon}
      </span>
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
    </Link>
  );
}

/** Expandable section: click header to show/hide children. */
function ExpandableSection({
  id,
  label,
  icon: Icon,
  items,
  isCollapsed,
  isOpen,
  onToggle,
  pathname,
}) {
  const hasActiveChild = useMemo(
    () => items.some((item) => pathname === item.href || (item.activeStartsWith && pathname.startsWith(item.href + '/'))),
    [items, pathname]
  );

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center gap-3 rounded-lg transition-colors text-left
          ${isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5'}
          text-base-content/70 hover:bg-base-200 hover:text-base-content
          ${hasActiveChild ? 'text-primary' : ''}
        `}
        title={isCollapsed ? label : undefined}
        aria-expanded={isOpen}
        aria-controls={`sidebar-section-${id}`}
      >
        <span className="shrink-0">
          {React.isValidElement(Icon) ? Icon : (typeof Icon === 'function' || (Icon && typeof Icon === 'object' && Icon.$$typeof)) ? <Icon size={20} /> : Icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium truncate flex-1">{label}</span>
            <ChevronRight
              size={16}
              className={`shrink-0 text-base-content/40 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
          </>
        )}
      </button>
      {isOpen && (
        <div id={`sidebar-section-${id}`} className="space-y-0.5">
          {items.map((item) => (
            <NavItem
              key={item.key || item.href}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
              activeStartsWith={item.activeStartsWith}
              indent={!isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline widget in the sidebar to show & switch the active tree. */
function TreeSelectorWidget({ isCollapsed }) {
  const { activeTree, loading, openTreeSelector } = useActiveTree();

  return (
    <div className="px-1 mb-4">
      <button
        type="button"
        onClick={openTreeSelector}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
          bg-base-200/60 hover:bg-base-200 border border-base-content/10
          transition-colors text-left group
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? (activeTree?.name ?? 'Select tree') : undefined}
        aria-label="Switch tree"
      >
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <TreePine size={14} className="text-primary" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-base-content/40 font-medium leading-none mb-1">
                Active tree
              </div>
              <div className="text-sm font-semibold text-base-content truncate leading-tight">
                {loading ? (
                  <span className="loading loading-dots loading-xs opacity-50" />
                ) : (
                  activeTree?.name ?? (
                    <span className="text-base-content/40 font-normal italic">
                      No tree selected
                    </span>
                  )
                )}
              </div>
            </div>
            <ChevronsUpDown
              size={14}
              className="shrink-0 text-base-content/30 group-hover:text-base-content/50 transition-colors"
            />
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

const SECTION_IDS = {
  MY_TREES: 'my-trees',
  USER_DATA: 'user-data',
  CURRENT_TREE: 'current-tree',
  PEOPLE: 'people',
  FAMILIES: 'families',
  CONTEXT: 'context',
  EVIDENCE: 'evidence',
  MEDIA: 'media',
  RESEARCH: 'research',
  MANAGE: 'manage',
  ADMIN: 'administration',
};

function getSectionForPath(pathname, treeId) {
  if (!pathname) return null;
  if (pathname.startsWith('/admin')) return SECTION_IDS.ADMIN;
  if (pathname.startsWith('/my-trees') || pathname.startsWith('/my-connections') || pathname.startsWith('/upload')) return SECTION_IDS.MY_TREES;
  if (pathname.startsWith('/me/')) return SECTION_IDS.USER_DATA;
  if (!treeId || !pathname.startsWith(`/trees/${treeId}`)) return null;
  const rest = pathname.slice(`/trees/${treeId}`.length) || '/';
  if (rest === '' || rest === '/') return SECTION_IDS.CURRENT_TREE;
  if (rest.startsWith('/individuals') || rest.startsWith('/given-names') || rest.startsWith('/surnames')) return SECTION_IDS.PEOPLE;
  if (rest.startsWith('/families')) return SECTION_IDS.FAMILIES;
  if (rest.startsWith('/places') || rest.startsWith('/events') || rest.startsWith('/dates')) return SECTION_IDS.CONTEXT;
  if (rest.startsWith('/sources') || rest.startsWith('/notes')) return SECTION_IDS.EVIDENCE;
  if (rest.startsWith('/pictures') || rest.startsWith('/videos') || rest.startsWith('/audio') || rest.startsWith('/documents') || rest.startsWith('/stories') || rest.startsWith('/albums') || rest.startsWith('/tags')) return SECTION_IDS.MEDIA;
  if (rest.startsWith('/research')) return SECTION_IDS.RESEARCH;
  if (rest.startsWith('/manage')) return SECTION_IDS.MANAGE;
  return null;
}

export default function DesktopSidebar({
  user,
  isSuperuser,
  isCollapsed = false,
  className = '',
}) {
  const pathname = usePathname();
  const { activeTree } = useActiveTree();
  const treeId = activeTree?.id;
  const { canManage } = useTreeCanManage(treeId);

  const [openSections, setOpenSections] = useState(() => new Set([SECTION_IDS.MY_TREES]));

  // Include section containing current path so active item is visible
  const effectiveOpenSections = useMemo(() => {
    const section = getSectionForPath(pathname, treeId);
    const next = new Set(openSections);
    if (section) next.add(section);
    return next;
  }, [pathname, treeId, openSections]);

  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mainNavItems = [
    { href: '/dashboard', label: 'Home', icon: <Home size={20} /> },
    { href: '/explore', label: 'Explore Trees', icon: <Compass size={20} /> },
    { href: '/upload', label: 'Upload GEDCOM', icon: <Upload size={20} /> },
  ];

  const myTreesItems = [
    { key: 'my-trees', href: '/my-trees', label: 'My Trees', icon: <FolderOpen size={20} /> },
    { key: 'connections', href: '/my-connections', label: 'My Connections', icon: <Network size={20} /> },
  ];

  const userDataItems = [
    { key: 'recipes', href: '/me/recipes', label: 'My Recipes', icon: <CookingPot size={20} /> },
    { key: 'feed', href: '/me/feed', label: 'My Feed', icon: <Rss size={20} /> },
    { key: 'media', href: '/me/media', label: 'My Media', icon: <ImagePlay size={20} /> },
  ];

  const adminItems = [
    { key: 'users', href: '/admin/users', label: 'Manage Users', icon: <Users size={20} /> },
    { key: 'roles', href: '/admin/roles', label: 'Manage Roles', icon: <Shield size={20} /> },
    { key: 'requests', href: '/admin/requests', label: 'Access Requests', icon: <ClipboardList size={20} /> },
    { key: 'trees', href: '/admin/trees', label: 'Manage Trees', icon: <FolderCog size={20} /> },
  ];

  const currentTreeItems = useMemo(() => {
    if (!treeId) return null;
    return [
      { key: 'overview', href: `/trees/${treeId}`, label: 'Overview', icon: <LayoutDashboard size={20} /> },
    ];
  }, [treeId]);

  const treeNavItemsByGroup = useMemo(() => {
    if (!treeId) return null;
    return treeNavGroups.map((group) => ({
      id: group.title.toLowerCase().replace(/\s+/, '-'),
      label: group.title,
      Icon: treeSectionIcons[group.title] ?? group.items[0]?.Icon ?? TreePine,
      items: group.items.map((navItem) => ({
        key: navItem.hrefSuffix,
        href: `/trees/${treeId}/${navItem.hrefSuffix}`,
        label: navItem.label,
        icon: <navItem.Icon size={20} />,
        activeStartsWith: true,
      })),
    }));
  }, [treeId]);

  const sectionIdByGroup = {
    People: SECTION_IDS.PEOPLE,
    Families: SECTION_IDS.FAMILIES,
    Context: SECTION_IDS.CONTEXT,
    Evidence: SECTION_IDS.EVIDENCE,
    Media: SECTION_IDS.MEDIA,
    Research: SECTION_IDS.RESEARCH,
  };

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
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

        <TreeSelectorWidget isCollapsed={isCollapsed} />

        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} />
          ))}
        </nav>

        <ExpandableSection
          id={SECTION_IDS.MY_TREES}
          label="My Trees"
          icon={Library}
          items={myTreesItems}
          isCollapsed={isCollapsed}
          isOpen={effectiveOpenSections.has(SECTION_IDS.MY_TREES)}
          onToggle={() => toggleSection(SECTION_IDS.MY_TREES)}
          pathname={pathname}
        />

        <ExpandableSection
          id={SECTION_IDS.USER_DATA}
          label="User Data"
          icon={UserSquare2}
          items={userDataItems}
          isCollapsed={isCollapsed}
          isOpen={effectiveOpenSections.has(SECTION_IDS.USER_DATA)}
          onToggle={() => toggleSection(SECTION_IDS.USER_DATA)}
          pathname={pathname}
        />

        {treeId && currentTreeItems && (
          <nav className="space-y-1">
            <ExpandableSection
              id={SECTION_IDS.CURRENT_TREE}
              label="Current Tree"
              icon={FolderTree}
              items={currentTreeItems}
              isCollapsed={isCollapsed}
              isOpen={effectiveOpenSections.has(SECTION_IDS.CURRENT_TREE)}
              onToggle={() => toggleSection(SECTION_IDS.CURRENT_TREE)}
              pathname={pathname}
            />
            {treeNavItemsByGroup && treeNavItemsByGroup.map((group) => (
              <ExpandableSection
                key={group.label}
                id={sectionIdByGroup[group.label] ?? group.id}
                label={group.label}
                icon={group.Icon}
                items={group.items}
                isCollapsed={isCollapsed}
                isOpen={effectiveOpenSections.has(sectionIdByGroup[group.label] ?? group.id)}
                onToggle={() => toggleSection(sectionIdByGroup[group.label] ?? group.id)}
                pathname={pathname}
              />
            ))}
            <NavItem
              item={{ href: '/search', label: 'Search', icon: <Search size={20} /> }}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
            {canManage && (
              <NavItem
                item={{
                  href: `/trees/${treeId}/manage`,
                  label: 'Manage tree',
                  icon: <Wrench size={20} />,
                  activeStartsWith: true,
                }}
                activeStartsWith
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            )}
          </nav>
        )}

        {!treeId && !isCollapsed && (
          <div className="px-3 py-4 rounded-lg bg-base-200/50 border border-base-content/10 text-center space-y-2">
            <TreePine size={24} className="mx-auto text-base-content/30" />
            <p className="text-xs text-base-content/50">
              No tree selected. Click the widget above to pick one.
            </p>
          </div>
        )}

        {isSuperuser && (
          <ExpandableSection
            id={SECTION_IDS.ADMIN}
            label="Administration"
            icon={ShieldCheck}
            items={adminItems}
            isCollapsed={isCollapsed}
            isOpen={effectiveOpenSections.has(SECTION_IDS.ADMIN)}
            onToggle={() => toggleSection(SECTION_IDS.ADMIN)}
            pathname={pathname}
          />
        )}
      </div>
    </aside>
  );
}
