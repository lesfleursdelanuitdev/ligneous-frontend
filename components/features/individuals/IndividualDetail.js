'use client';

import { UserCircle, Users, ScrollText, Clock, Image } from 'lucide-react';
import IndividualView from './IndividualView';
import IndividualOverviewSection from './IndividualOverviewSection';
import IndividualFamiliesSection from './IndividualFamiliesSection';
import IndividualNotesSection from './IndividualNotesSection';
import IndividualEventsSection from './IndividualEventsSection';
import IndividualLinkedSection from './IndividualLinkedSection';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function IndividualDetail({ individual, treeId }) {
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
          <Icon size={18} />
        </button>
      ))}
    </div>
  );

  return (
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
}
