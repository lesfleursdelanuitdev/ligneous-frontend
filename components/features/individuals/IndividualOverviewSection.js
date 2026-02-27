'use client';

import Link from 'next/link';
import { Calendar, CalendarX, MapPin, Tag, ChevronRight } from 'lucide-react';
import IndividualSection from './IndividualSection';

export default function IndividualOverviewSection({ individual, treeId }) {
  if (!individual) return null;

  const NAME_TYPE_LABELS = { birth: '', maiden: 'Maiden', married: 'Married', aka: 'AKA', immigrant: 'Immigrant', professional: 'Professional', other: 'Other' };
  const nameForms = individual.individualNameForms || [];
  const primaryForm = nameForms.find((nf) => nf.isPrimary) || nameForms[0];
  const givenNames = (primaryForm?.givenNames || [])
    .map((gfn) => gfn.givenName)
    .filter(Boolean);
  const surnames = nameForms.flatMap((nf) =>
    (nf.surnames || []).map((sfn) => ({
      surname: sfn.surname?.surname,
      nameType: nf.nameType || 'birth',
      isPrimary: nf.isPrimary || false,
    }))
  ).filter((s) => s.surname);
  const sexLabel = individual.sex === 'M' ? 'Male' : individual.sex === 'F' ? 'Female' : 'Unknown';

  return (
    <IndividualSection title="Overview" showBackToTop>
      <div className="card border border-base-content/10 rounded-box bg-base-100">
        <div className="card-body p-6 space-y-4">
          <p className="text-xs text-base-content/50 font-mono">
            XREF: {individual.xref} &middot; UUID: {individual.id}
          </p>
          <div className="flex flex-wrap gap-6">
            {givenNames.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Given Names
                </span>
                <div className="flex flex-wrap gap-2">
                  {givenNames.map((gn) => (
                    <Link
                      key={gn.id}
                      href={`/trees/${treeId}/given-names?search=${encodeURIComponent(gn.givenName)}`}
                      className="btn btn-sm btn-ghost gap-1 text-primary"
                    >
                      <ChevronRight size={16} />
                      {gn.givenName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {surnames.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Surnames
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  {surnames.map((sn, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <Link
                        href={`/trees/${treeId}/surnames?search=${encodeURIComponent(sn.surname)}`}
                        className="btn btn-sm btn-ghost gap-1 text-primary"
                      >
                        <ChevronRight size={16} />
                        {sn.surname}
                      </Link>
                      {NAME_TYPE_LABELS[sn.nameType] && (
                        <span className="badge badge-ghost badge-sm text-base-content/60">
                          {NAME_TYPE_LABELS[sn.nameType]}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-base-content/10">
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-base-content/50 inline-flex"><Tag size={18} /></span>
              <span className="text-base-content/60">Sex:</span>
              <span className="font-medium">{sexLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-base-content/50 inline-flex"><Tag size={18} /></span>
              <span className="text-base-content/60">Status:</span>
              <span className={`badge badge-sm ${individual.isLiving ? 'badge-success' : 'badge-ghost'}`}>
                {individual.isLiving ? 'Living' : 'Deceased'}
              </span>
            </div>
            {individual.birthDateDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><Calendar size={18} /></span>
                <span className="text-base-content/60">Born:</span>
                <span>{individual.birthDateDisplay}</span>
              </div>
            )}
            {individual.birthPlaceDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><MapPin size={18} /></span>
                <span className="text-base-content/60">Birth place:</span>
                <span>{individual.birthPlaceDisplay}</span>
              </div>
            )}
            {individual.deathDateDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><CalendarX size={18} /></span>
                <span className="text-base-content/60">Died:</span>
                <span>{individual.deathDateDisplay}</span>
              </div>
            )}
            {individual.deathPlaceDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><MapPin size={18} /></span>
                <span className="text-base-content/60">Death place:</span>
                <span>{individual.deathPlaceDisplay}</span>
              </div>
            )}
            {individual.occupation && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><Tag size={18} /></span>
                <span className="text-base-content/60">Occupation:</span>
                <span>{individual.occupation}</span>
              </div>
            )}
            {individual.religion && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><Tag size={18} /></span>
                <span className="text-base-content/60">Religion:</span>
                <span>{individual.religion}</span>
              </div>
            )}
            {individual.nationality && (
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-base-content/50 inline-flex"><Tag size={18} /></span>
                <span className="text-base-content/60">Nationality:</span>
                <span>{individual.nationality}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </IndividualSection>
  );
}
