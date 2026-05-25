'use client';

import FamilySection from '../view/FamilySection';

export default function FamilyNotesSection({ family }) {
  if (!family) return null;

  const notes = family.notes || [];

  return (
    <FamilySection title="Notes" count={notes.length} showBackToTop>
      {notes.length === 0 ? (
        <p className="text-sm text-base-content/50">No notes found.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note, idx) => (
            <div
              key={note.id || idx}
              className="card bg-base-200/50 border border-base-content/10 rounded-box"
            >
              <div className="card-body p-4">
                {note.xref && <p className="text-xs text-base-content/50 mb-1">{note.xref}</p>}
                <p className="text-sm text-base-content/80 whitespace-pre-wrap line-clamp-6">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </FamilySection>
  );
}
