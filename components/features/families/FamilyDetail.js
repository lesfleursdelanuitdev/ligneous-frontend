'use client';

import { useState, Fragment } from 'react';
import { UserCircle, Image, ScrollText, Clock, FileText, BarChart2, MessageSquare } from 'lucide-react';
import FamilyView from './view/FamilyView';
import FamilyViewToolbar from './view/FamilyViewToolbar';
import FamilyOverviewSection from './sections/FamilyOverviewSection';
import FamilyMediaSection from './sections/FamilyMediaSection';
import FamilyNotesSection from './sections/FamilyNotesSection';
import FamilyEventsSection from './sections/FamilyEventsSection';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

const MAIN_TABS = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'chart', label: 'Chart', icon: BarChart2 },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
];

function PlaceholderContent(props) {
  return (
    <div className="rounded-t-none rounded-b-lg border border-base-content/5 bg-base-200/40 shadow-sm p-8 text-center">
      <p className="text-base-content/60">{props.label} - coming soon</p>
    </div>
  );
}

export default function FamilyDetail(props) {
  const { family, treeId } = props;
  const [activeTab, setActiveTab] = useState('details');

  if (!family) return null;

  const sections = [
    { id: 'overview', label: 'Overview', icon: UserCircle, Component: FamilyOverviewSection, props: { family, treeId } },
    { id: 'media', label: 'Media', icon: Image, Component: FamilyMediaSection, props: { family } },
    { id: 'notes', label: 'Notes', icon: ScrollText, Component: FamilyNotesSection, props: { family } },
    { id: 'events', label: 'Events', icon: Clock, Component: FamilyEventsSection, props: { family, treeId } },
  ];

  const toolbar = (
    <FamilyViewToolbar>
      <div className="flex flex-wrap items-center gap-1.5">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToId(s.id)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-base-content/70 hover:text-primary hover:bg-base-200/50 transition-colors"
              title={s.label}
            >
              <span className="shrink-0 flex items-center justify-center">
                <Icon size={20} />
              </span>
            </button>
          );
        })}
      </div>
    </FamilyViewToolbar>
  );

  const detailsContent = (
    <FamilyView toolbar={toolbar}>
      {sections.map((s) => {
        const Comp = s.Component;
        return (
          <div key={s.id} id={s.id} className="rounded-lg shadow-sm border border-base-content/5 bg-base-100 scroll-mt-4 p-6">
            <Comp {...s.props} />
          </div>
        );
      })}
    </FamilyView>
  );

  const tabContents = {
    details: detailsContent,
    chart: <PlaceholderContent label="Family chart" />,
    discussion: <PlaceholderContent label="Discussion" />,
  };

  return (
    <div className="tabs tabs-lift rounded-t-lg [--tab-border-color:color-mix(in_oklch,var(--color-base-content)_5%,transparent)]">
      {MAIN_TABS.map((t) => {
        const TabIcon = t.icon;
        return (
        <Fragment key={t.id}>
          <label className={'tab flex items-center gap-2 ' + (activeTab === t.id ? 'tab-active' : '')}>
            <input
              type="radio"
              name="family_main_tabs"
              checked={activeTab === t.id}
              onChange={() => setActiveTab(t.id)}
              aria-label={t.label}
            />
            <span className="shrink-0 flex items-center justify-center"><TabIcon size={20} /></span>
            {t.label}
          </label>
          <div className="tab-content pt-0 border-0 bg-transparent">
            {activeTab === t.id ? tabContents[t.id] : null}
          </div>
        </Fragment>
        );
      })}
    </div>
  );
}
