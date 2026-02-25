'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Baby, Users, Heart } from 'lucide-react';
import IndividualSection from './IndividualSection';
import IndividualSectionTabs from './IndividualSectionTabs';
import IndividualSectionTabsContent from './IndividualSectionTabsContent';
import { stripSlashes } from '@/lib/individual-utils';

function PersonLink({ xref, fullName, treeId }) {
  if (!xref) return <span className="text-base-content/50">Unknown</span>;
  return (
    <Link
      href={`/trees/${treeId}/individuals/${encodeURIComponent(xref)}`}
      className="link link-primary font-medium"
    >
      {stripSlashes(fullName) || xref}
    </Link>
  );
}

function PersonChip({ person, treeId }) {
  if (!person?.xref) return null;
  const label = stripSlashes(person.fullName) || person.xref;
  const sexBadge = person.sex === 'M' ? 'badge-info' : person.sex === 'F' ? 'badge-secondary' : 'badge-ghost';

  return (
    <Link
      href={`/trees/${treeId}/individuals/${encodeURIComponent(person.xref)}`}
      className="flex items-center gap-2 p-2 rounded-lg bg-base-200/50 border border-base-content/10 hover:bg-base-200 transition-colors"
    >
      <span className={`badge badge-sm ${sexBadge}`}>
        {person.sex === 'M' ? 'M' : person.sex === 'F' ? 'F' : '?'}
      </span>
      <span className="text-sm font-medium text-primary truncate underline">{label}</span>
      {person.birthDateDisplay && (
        <span className="text-xs text-base-content/50 shrink-0">b. {person.birthDateDisplay}</span>
      )}
    </Link>
  );
}

function FamilyOriginCard({ family, treeId, label }) {
  const father = family.husband;
  const mother = family.wife;
  const siblings = (family.familyChildren || [])
    .map((fc) => fc.child)
    .filter(Boolean);

  return (
    <div className="card bg-base-200/50 border border-base-content/10 rounded-box">
      <div className="card-body p-4 space-y-3">
        {label && (
          <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            {label}
          </span>
        )}
        <div className="space-y-1 text-sm">
          {father && (
            <div className="flex items-center gap-2">
              <span className="text-base-content/60 w-16 shrink-0">Father:</span>
              <PersonLink xref={family.husbandXref} fullName={father.fullName} treeId={treeId} />
            </div>
          )}
          {mother && (
            <div className="flex items-center gap-2">
              <span className="text-base-content/60 w-16 shrink-0">Mother:</span>
              <PersonLink xref={family.wifeXref} fullName={mother.fullName} treeId={treeId} />
            </div>
          )}
          {family.marriageDateDisplay && (
            <div className="flex items-center gap-2 text-base-content/60">
              <Calendar size={14} />
              <span>Married: {family.marriageDateDisplay}</span>
            </div>
          )}
        </div>
        {siblings.length > 0 && (
          <div className="pt-2 border-t border-base-content/10 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Children in this family ({siblings.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {siblings.map((sib) => (
                <PersonChip key={sib.xref} person={sib} treeId={treeId} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpouseFamilyCard({ family, treeId, currentXref }) {
  const isHusband = family.husbandXref === currentXref || (!family.husbandXref && family.wifeXref);
  const spouse = isHusband ? family.wife : family.husband;
  const spouseXref = isHusband ? family.wifeXref : family.husbandXref;
  const spouseLabel = isHusband ? 'Wife' : 'Husband';
  const children = (family.familyChildren || [])
    .map((fc) => fc.child)
    .filter(Boolean);

  return (
    <div className="card bg-base-200/50 border border-base-content/10 rounded-box">
      <div className="card-body p-4 space-y-3">
        <div className="space-y-1 text-sm">
          {spouse && (
            <div className="flex items-center gap-2">
              <span className="text-base-content/60 w-16 shrink-0">{spouseLabel}:</span>
              <PersonLink xref={spouseXref} fullName={spouse.fullName} treeId={treeId} />
            </div>
          )}
          {family.marriageDateDisplay && (
            <div className="flex items-center gap-2 text-base-content/60">
              <Calendar size={14} />
              <span>Married: {family.marriageDateDisplay}</span>
            </div>
          )}
        </div>
        {children.length > 0 && (
          <div className="pt-2 border-t border-base-content/10 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Children ({children.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {children.map((child) => (
                <PersonChip key={child.xref} person={child} treeId={treeId} />
              ))}
            </div>
          </div>
        )}
        {children.length === 0 && family.childrenCount > 0 && (
          <div className="flex items-center gap-2 text-base-content/60 text-sm">
            <Baby size={14} />
            <span>{family.childrenCount} {family.childrenCount === 1 ? 'child' : 'children'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IndividualFamiliesSection({ individual, treeId }) {
  const [familyTab, setFamilyTab] = useState('family_origin');

  if (!individual) return null;

  const familiesOfOrigin = (individual.familyChildAsChild || []).map((fc) => fc.family).filter(Boolean);
  const spouseFamilies = [
    ...(individual.husbandInFamilies || []),
    ...(individual.wifeInFamilies || []),
  ];

  const familyTabs = [
    { id: 'family_origin', label: 'Family of Origin', icon: Users, count: familiesOfOrigin.length },
    { id: 'family_spouse', label: 'Family As Spouse', icon: Heart, count: spouseFamilies.length },
  ];

  return (
    <IndividualSection title="Families" showBackToTop>
      <IndividualSectionTabs tabs={familyTabs} activeId={familyTab} onChange={setFamilyTab} />
      <IndividualSectionTabsContent>
        {familyTab === 'family_origin' && (
          <IndividualSection
            title="Family of Origin"
            count={familiesOfOrigin.length}
            subtitle
          >
            {familiesOfOrigin.length === 0 ? (
              <p className="text-sm text-base-content/50">No family of origin found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {familiesOfOrigin.map((fam, idx) => (
                  <FamilyOriginCard
                    key={fam.id || idx}
                    family={fam}
                    treeId={treeId}
                    label={familiesOfOrigin.length > 1 ? `Family ${idx + 1}` : undefined}
                  />
                ))}
              </div>
            )}
          </IndividualSection>
        )}
        {familyTab === 'family_spouse' && (
          <IndividualSection
            title="Families as Spouse"
            count={spouseFamilies.length}
            subtitle
          >
            {spouseFamilies.length === 0 ? (
              <p className="text-sm text-base-content/50">No families as spouse found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {spouseFamilies.map((fam, idx) => (
                  <SpouseFamilyCard
                    key={fam.id || idx}
                    family={fam}
                    treeId={treeId}
                    currentXref={individual.xref}
                  />
                ))}
              </div>
            )}
          </IndividualSection>
        )}
      </IndividualSectionTabsContent>
    </IndividualSection>
  );
}
