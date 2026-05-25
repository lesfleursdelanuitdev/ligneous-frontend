'use client';

import Link from 'next/link';
import { Users, UserCircle, Heart, Calendar, MapPin } from 'lucide-react';
import FamilySection from '../view/FamilySection';
import { stripSlashes } from '@/lib/individual-utils';

export default function FamilyOverviewSection({ family, treeId }) {
  if (!family) return null;

  const husband = family.husband;
  const wife = family.wife;
  const children = family.children || [];
  const husbandName = husband ? stripSlashes(husband.fullName) : null;
  const wifeName = wife ? stripSlashes(wife.fullName) : null;

  return (
    <FamilySection title="Overview" showBackToTop>
      <div className="card border border-base-content/10 rounded-box bg-base-100">
        <div className="card-body p-6 space-y-4">
          <p className="text-xs text-base-content/50 font-mono">
            XREF: {family.xref} &middot; UUID: {family.id}
          </p>

          <div className="space-y-3">
            {husband && (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-base-content/50 inline-flex"><UserCircle size={18} /></span>
                <span className="text-base-content/60 text-sm">Husband:</span>
                <Link
                  href={`/trees/${treeId}/individuals/${encodeURIComponent(husband.xref)}`}
                  className="link link-primary font-medium"
                >
                  {husbandName || husband.xref}
                </Link>
              </div>
            )}
            {wife && (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-base-content/50 inline-flex"><UserCircle size={18} /></span>
                <span className="text-base-content/60 text-sm">Wife:</span>
                <Link
                  href={`/trees/${treeId}/individuals/${encodeURIComponent(wife.xref)}`}
                  className="link link-primary font-medium"
                >
                  {wifeName || wife.xref}
                </Link>
              </div>
            )}
          </div>

          {children.length > 0 && (
            <div className="pt-2 border-t border-base-content/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 text-base-content/50 inline-flex"><Users size={18} /></span>
                <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Children ({children.length})
                </span>
              </div>
              <ul className="space-y-1">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/trees/${treeId}/individuals/${encodeURIComponent(child.xref)}`}
                      className="link link-primary text-sm"
                    >
                      {stripSlashes(child.fullName) || child.xref}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-base-content/10">
            {(family.marriageDateDisplay || family.marriagePlaceDisplay) && (
              <>
                {family.marriageDateDisplay && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 text-base-content/50 inline-flex"><Calendar size={18} /></span>
                    <span className="text-base-content/60">Marriage:</span>
                    <span>{family.marriageDateDisplay}</span>
                  </div>
                )}
                {family.marriagePlaceDisplay && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 text-base-content/50 inline-flex"><MapPin size={18} /></span>
                    <span className="text-base-content/60">Marriage place:</span>
                    <span>{family.marriagePlaceDisplay}</span>
                  </div>
                )}
              </>
            )}
            {(family.divorceDateDisplay || family.divorcePlaceDisplay) && (
              <>
                {family.divorceDateDisplay && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 text-base-content/50 inline-flex"><Calendar size={18} /></span>
                    <span className="text-base-content/60">Divorce:</span>
                    <span>{family.divorceDateDisplay}</span>
                  </div>
                )}
                {family.divorcePlaceDisplay && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 text-base-content/50 inline-flex"><MapPin size={18} /></span>
                    <span className="text-base-content/60">Divorce place:</span>
                    <span>{family.divorcePlaceDisplay}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </FamilySection>
  );
}
