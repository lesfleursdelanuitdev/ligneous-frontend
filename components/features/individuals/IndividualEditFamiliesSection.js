'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, Heart } from 'lucide-react';
import IndividualSection from './IndividualSection';
import IndividualSectionTabs from './IndividualSectionTabs';
import IndividualSectionTabsContent from './IndividualSectionTabsContent';
import { stripSlashes } from '@/lib/individual-utils';

function PersonLink({ xref, fullName, treeId }) {
  if (!xref) return <span className="text-base-content/50">Unknown</span>;
  return (
    <Link
      href={`/trees/${treeId}/individuals/${encodeURIComponent(xref)}`}
      className="link link-primary text-sm"
    >
      {stripSlashes(fullName) || xref}
    </Link>
  );
}

export default function IndividualEditFamiliesSection({ individual, treeId }) {
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
          <IndividualSection title="Family of Origin" count={familiesOfOrigin.length} subtitle>
            {familiesOfOrigin.length === 0 ? (
              <p className="text-sm text-base-content/50">No family of origin. Link to parents to add.</p>
            ) : (
              <div className="space-y-4">
                {familiesOfOrigin.map((fam, idx) => (
                  <div
                    key={fam.id || idx}
                    className="card bg-base-200/50 border border-base-content/10 rounded-box"
                  >
                    <div className="card-body p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60 w-16 shrink-0">Father:</span>
                        <PersonLink xref={fam.husbandXref} fullName={fam.husband?.fullName} treeId={treeId} />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60 w-16 shrink-0">Mother:</span>
                        <PersonLink xref={fam.wifeXref} fullName={fam.wife?.fullName} treeId={treeId} />
                      </div>
                      {fam.marriageDateDisplay && (
                        <div className="flex items-center gap-2 text-sm text-base-content/60">
                          <Calendar size={16} />
                          <span>Married: {fam.marriageDateDisplay}</span>
                        </div>
                      )}
                      <p className="text-xs text-base-content/50">
                        Family editing (add/remove parents, spouses) — coming soon
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </IndividualSection>
        )}
        {familyTab === 'family_spouse' && (
          <IndividualSection title="Families as Spouse" count={spouseFamilies.length} subtitle>
            {spouseFamilies.length === 0 ? (
              <p className="text-sm text-base-content/50">No families as spouse. Add spouse to create.</p>
            ) : (
              <div className="space-y-4">
                {spouseFamilies.map((fam, idx) => {
                  const isHusband = fam.husbandXref === individual.xref;
                  const spouse = isHusband ? fam.wife : fam.husband;
                  const spouseXref = isHusband ? fam.wifeXref : fam.husbandXref;
                  const spouseLabel = isHusband ? 'Wife' : 'Husband';
                  return (
                    <div
                      key={fam.id || idx}
                      className="card bg-base-200/50 border border-base-content/10 rounded-box"
                    >
                      <div className="card-body p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-base-content/60 w-16 shrink-0">{spouseLabel}:</span>
                          <PersonLink xref={spouseXref} fullName={spouse?.fullName} treeId={treeId} />
                        </div>
                        {fam.marriageDateDisplay && (
                          <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <Calendar size={16} />
                            <span>Married: {fam.marriageDateDisplay}</span>
                          </div>
                        )}
                        {(fam.familyChildren || []).length > 0 && (
                          <p className="text-xs text-base-content/60">
                            {fam.familyChildren.length} child(ren) in this family
                          </p>
                        )}
                        <p className="text-xs text-base-content/50">
                          Family editing — coming soon
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </IndividualSection>
        )}
      </IndividualSectionTabsContent>
    </IndividualSection>
  );
}
