'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { UserCircle, Users, ScrollText, Clock, Image, Eye } from 'lucide-react';
import IndividualViewToolbar from './view/IndividualViewToolbar';
import IndividualEditOverviewSection from './edit/IndividualEditOverviewSection';
import IndividualEditFamiliesSection from './edit/IndividualEditFamiliesSection';
import IndividualEditNotesSection from './edit/IndividualEditNotesSection';
import IndividualEditEventsSection from './edit/IndividualEditEventsSection';
import IndividualEditLinkedSection from './edit/IndividualEditLinkedSection';

const EDIT_TABS = [
  { id: 'overview', label: 'Overview', icon: UserCircle },
  { id: 'families', label: 'Families', icon: Users },
  { id: 'notes', label: 'Notes', icon: ScrollText },
  { id: 'events', label: 'Events', icon: Clock },
  { id: 'linked', label: 'Linked', icon: Image },
];

export default function IndividualEdit({ individual, treeId }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!individual) return null;

  const viewHref = `/trees/${treeId}/individuals/${encodeURIComponent(individual.xref)}`;

  const tabContents = {
    overview: <IndividualEditOverviewSection individual={individual} treeId={treeId} />,
    families: <IndividualEditFamiliesSection individual={individual} treeId={treeId} />,
    notes: <IndividualEditNotesSection individual={individual} />,
    events: <IndividualEditEventsSection individual={individual} treeId={treeId} />,
    linked: <IndividualEditLinkedSection individual={individual} />,
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={viewHref}
        className="btn btn-sm btn-outline gap-2"
        title="View individual"
      >
        <span className="shrink-0 flex items-center justify-center"><Eye size={20} /></span>
        View
      </Link>
    </div>
  );

  return (
    <div className="rounded-lg overflow-hidden border border-base-content/5 bg-base-200/40 shadow-sm">
      <div className="space-y-4 p-4">
        <IndividualViewToolbar>{toolbar}</IndividualViewToolbar>
        <div className="tabs tabs-lift rounded-t-lg [--tab-border-color:color-mix(in_oklch,var(--color-base-content)_5%,transparent)]">
          {EDIT_TABS.map(({ id, label, icon: Icon }) => (
            <Fragment key={id}>
              <label
                className={`tab flex items-center gap-2 ${activeTab === id ? 'tab-active' : ''}`}
              >
                <input
                  type="radio"
                  name="individual_edit_tabs"
                  checked={activeTab === id}
                  onChange={() => setActiveTab(id)}
                  aria-label={label}
                />
                <span className="shrink-0 flex items-center justify-center"><Icon size={20} /></span>
                {label}
              </label>
              <div className="tab-content pt-0 border-0 bg-transparent">
                {activeTab === id ? (
                  <div className="rounded-t-none rounded-b-lg border border-base-content/5 bg-base-100 shadow-sm p-6 mt-0">
                    {tabContents[id]}
                  </div>
                ) : null}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
