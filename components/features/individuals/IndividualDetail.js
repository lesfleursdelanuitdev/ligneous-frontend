'use client';

import { useState, Fragment } from 'react';
import { UserCircle, Users, ScrollText, Clock, Image, FileText, GitBranch, UsersRound, UserSearch, MessageSquare } from 'lucide-react';
import IndividualView from './IndividualView';
import IndividualOverviewSection from './IndividualOverviewSection';
import IndividualFamiliesSection from './IndividualFamiliesSection';
import IndividualNotesSection from './IndividualNotesSection';
import IndividualEventsSection from './IndividualEventsSection';
import IndividualLinkedSection from './IndividualLinkedSection';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

const MAIN_TABS = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'pedigree', label: 'Pedigree', icon: GitBranch },
  { id: 'descendants', label: 'Descendants', icon: UsersRound },
  { id: 'find_similar', label: 'Find similar', icon: UserSearch },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
];

function PlaceholderContent({ label }) {
  return (
    <div className="rounded-t-none rounded-b-lg border border-base-content/5 bg-base-200/40 shadow-sm p-8 text-center">
      <p className="text-base-content/60">{label} — coming soon</p>
    </div>
  );
}

export default function IndividualDetail({ individual, treeId }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!individual) return null;

  const sections = [
    { id: 'overview', label: 'Overview', icon: UserCircle, Component: IndividualOverviewSection, props: { individual, treeId } },
    { id: 'families', label: 'Families', icon: Users, Component: IndividualFamiliesSection, props: { individual, treeId } },
    { id: 'notes', label: 'Notes', icon: ScrollText, Component: IndividualNotesSection, props: { individual } },
    { id: 'events', label: 'Events', icon: Clock, Component: IndividualEventsSection, props: { individual, treeId } },
    { id: 'linked', label: 'Linked', icon: Image, Component: IndividualLinkedSection, props: { individual } },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      {sections.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollToId(id)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-base-content/70 hover:text-primary hover:bg-base-200/50 transition-colors"
          title={label}
        >
          <span className="shrink-0 flex items-center justify-center"><Icon size={20} /></span>
        </button>
      ))}
    </div>
  );

  const detailsContent = (
    <IndividualView toolbar={toolbar}>
      {sections.map(({ id, Component, props }) => (
        <div
          key={id}
          id={id}
          className="rounded-lg shadow-sm border border-base-content/5 bg-base-100 scroll-mt-4 p-6"
        >
          <Component {...props} />
        </div>
      ))}
    </IndividualView>
  );

  const tabContents = {
    details: detailsContent,
    pedigree: <PlaceholderContent label="Pedigree chart" />,
    descendants: <PlaceholderContent label="Descendants" />,
    find_similar: <PlaceholderContent label="Find similar" />,
    discussion: <PlaceholderContent label="Discussion" />,
  };

  return (
    <div className="tabs tabs-lift rounded-t-lg [--tab-border-color:color-mix(in_oklch,var(--color-base-content)_5%,transparent)]">
      {MAIN_TABS.map(({ id, label, icon: Icon }) => (
        <Fragment key={id}>
          <label className={`tab flex items-center gap-2 ${activeTab === id ? 'tab-active' : ''}`}>
            <input
              type="radio"
              name="individual_main_tabs"
              checked={activeTab === id}
              onChange={() => setActiveTab(id)}
              aria-label={label}
            />
            <span className="shrink-0 flex items-center justify-center"><Icon size={20} /></span>
            {label}
          </label>
          <div className="tab-content pt-0 border-0 bg-transparent">
            {activeTab === id ? tabContents[id] : null}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
