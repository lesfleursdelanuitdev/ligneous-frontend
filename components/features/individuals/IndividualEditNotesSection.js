'use client';

import { useState } from 'react';
import IndividualSection from './IndividualSection';
import { Plus, Trash2 } from 'lucide-react';

export default function IndividualEditNotesSection({ individual }) {
  if (!individual) return null;

  const initialNotes = (individual.individualNotes || []).map((n) => n.note).filter(Boolean);
  const [newNotes, setNewNotes] = useState([]);

  const handleAddNote = () => {
    setNewNotes((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, xref: null, content: '' },
    ]);
  };

  const handleRemoveNewNote = (id) => {
    setNewNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const allNotes = [...initialNotes, ...newNotes];

  return (
    <IndividualSection title="Notes" count={allNotes.length} showBackToTop>
      {allNotes.length === 0 ? (
        <p className="text-sm text-base-content/50">No notes found. Add a note below.</p>
      ) : null}
      <div className="space-y-4">
        {initialNotes.map((note, idx) => (
          <div
            key={note.id || idx}
            className="card border border-base-content/10 rounded-box bg-base-100"
          >
            <div className="card-body p-4 space-y-2">
              {note.xref && (
                <p className="text-xs font-mono text-base-content/50">{note.xref}</p>
              )}
              <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50 block">
                Note content
              </label>
              <textarea
                className="textarea textarea-bordered w-full min-h-[120px]"
                defaultValue={note.content ?? ''}
                placeholder="Note content…"
                rows={5}
              />
            </div>
          </div>
        ))}
        {newNotes.map((note) => (
          <div
            key={note.id}
            className="card border border-base-content/10 rounded-box bg-base-100"
          >
            <div className="card-body p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50 block">
                  Note content
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveNewNote(note.id)}
                  className="btn btn-ghost btn-sm text-error bg-base-200/70 hover:bg-error/10 shrink-0 gap-1.5"
                  title="Remove note"
                  aria-label="Remove note"
                >
                  <span className="shrink-0 flex items-center justify-center"><Trash2 size={18} /></span>
                  Remove
                </button>
              </div>
              <textarea
                className="textarea textarea-bordered w-full min-h-[120px]"
                defaultValue=""
                placeholder="Note content…"
                rows={5}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddNote}
        className="btn btn-ghost btn-sm gap-1.5 text-primary mt-4"
      >
        <span className="shrink-0 flex items-center justify-center"><Plus size={20} /></span>
        Add note
      </button>
    </IndividualSection>
  );
}
