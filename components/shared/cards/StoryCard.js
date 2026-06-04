'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, ArrowUpDown, X } from 'lucide-react';
import Avatar from '../ui/avatars/Avatar';

// ── Entity type config — only existing CSS token colors ──────────────────────
const ENTITY_CONFIG = {
  people:   { label: 'People',   color: 'var(--color-accent)',       bg: 'var(--color-accent-soft)' },
  families: { label: 'Families', color: 'var(--color-tree-female)',   bg: 'rgba(236,72,153,0.1)' },
  events:   { label: 'Events',   color: 'var(--color-error)',         bg: 'rgba(220,38,38,0.08)' },
  places:   { label: 'Places',   color: 'var(--color-tree-male)',     bg: 'rgba(59,130,246,0.08)' },
  notes:    { label: 'Notes',    color: 'var(--color-tree-unknown)',  bg: 'rgba(107,114,128,0.08)' },
};

const ENTITY_ORDER = ['people', 'families', 'events', 'places', 'notes'];

// ── Tiny entity glyph — mirrors EntityIcon paths at 12px ────────────────────
function EntityGlyph({ type }) {
  const base = { className: 'w-3 h-3 shrink-0', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 };
  switch (type) {
    case 'people':
      return <svg {...base}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    case 'families':
      return <svg {...base}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'events':
      return <svg {...base}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'places':
      return <svg {...base}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'notes':
      return <svg {...base}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    default:
      return null;
  }
}

// ── Linked-records modal — portaled to body to escape CSS transforms ──────────
function LinkedRecordsModal({ title, entities, total, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleKey = useCallback((e) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (typeof document === 'undefined') return null;

  const dialog = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lr-title"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
        }}
        className="animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 id="lr-title" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>
              Linked Records
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '3px 0 0' }}>
              {title} · {total} record{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-square btn-sm"
            aria-label="Close"
            style={{ marginTop: -4, marginRight: -8 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {ENTITY_ORDER.map((key) => {
              const cfg = ENTITY_CONFIG[key];
              const names = entities[key]?.names ?? [];
              if (!names.length) return null;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: cfg.color }}>
                    <EntityGlyph type={key} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      {cfg.label} · {names.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {names.map((name, i) => (
                      <span
                        key={i}
                        style={{ padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

// ── StoryCard ─────────────────────────────────────────────────────────────────
/**
 * StoryCard
 *
 * @param {Object}   props.story
 * @param {string}   props.story.title
 * @param {string}   [props.story.cover]       - Background image URL for the banner
 * @param {string}   [props.story.description]
 * @param {string[]} [props.story.tags]
 * @param {string}   [props.story.date]        - Pre-formatted date string
 * @param {string}   [props.story.readTime]    - e.g. "12 min read"
 * @param {string}   [props.story.ref]         - Reference ID, e.g. "F0297"
 * @param {Array}    [props.story.credits]     - { role, name, type:'author'|'publisher' }[]
 * @param {Object}   [props.story.entities]    - { people?, families?, events?, places?, notes? }
 *                                               each: { names: string[] }
 * @param {Function} [props.onReadStory]
 * @param {string}   [props.className]
 */
export default function StoryCard({ story, onReadStory, className = '' }) {
  const {
    title,
    cover,
    description,
    tags = [],
    date,
    readTime,
    ref: storyRef,
    credits = [],
    entities = {},
  } = story;

  const [modalOpen, setModalOpen] = useState(false);
  const openModal  = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const authors    = credits.filter((c) => c.type === 'author');
  const publishers = credits.filter((c) => c.type === 'publisher');

  const entityCounts = ENTITY_ORDER
    .map((key) => ({ key, count: entities[key]?.names?.length ?? 0 }))
    .filter((e) => e.count > 0);
  const total = entityCounts.reduce((sum, e) => sum + e.count, 0);

  return (
    <>
      <article
        className={`overflow-hidden ${className}`}
        style={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 16,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* ── Cover banner ── */}
        <div
          style={{
            position: 'relative',
            height: 290,
            backgroundImage: cover ? `url(${cover})` : undefined,
            backgroundColor: cover ? undefined : 'var(--color-bg-tertiary)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
          }}
        >
          {/* Glass STORY pill */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9999,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--color-text-inverted)',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <LayoutGrid size={11} strokeWidth={2.2} />
            Story
          </div>

          {/* Ref chip */}
          {storyRef && (
            <div style={{
              position: 'absolute', top: 16, right: 16,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 9999,
              background: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              color: 'var(--color-text-inverted)',
              fontSize: 11, fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              <ArrowUpDown size={11} strokeWidth={2.2} />
              {storyRef}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px 20px' }}>

          {/* Title + description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{
              fontFamily: 'var(--font-lora), Georgia, "Times New Roman", serif',
              fontSize: 27, fontWeight: 600, lineHeight: 1.25,
              color: 'var(--color-text-primary)', margin: 0,
            }}>
              {title}
            </h2>
            {description && (
              <p className="truncate-3" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
                {description}
              </p>
            )}
          </div>

          {/* Authors */}
          {authors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {authors.map((credit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={credit.name} size="sm" />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>
                      {credit.role}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                      {credit.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag) => (
                <span key={tag} style={{
                  padding: '5px 14px', borderRadius: 9999, fontSize: 12,
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-secondary)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Linked records */}
          {entityCounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  Linked Records · {total}
                </span>
                <button
                  onClick={openModal}
                  style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  View all →
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {entityCounts.map(({ key, count }) => {
                  const cfg = ENTITY_CONFIG[key];
                  return (
                    <button
                      key={key}
                      onClick={openModal}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 9999,
                        fontSize: 12, fontWeight: 500,
                        background: cfg.bg, color: cfg.color,
                        border: 'none', cursor: 'pointer',
                        transition: 'opacity 150ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      <EntityGlyph type={key} />
                      <span>{count}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Publishers */}
          {publishers.length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {publishers.map((credit, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={credit.name} size="sm" />
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                      Published by{' '}
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{credit.name}</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          borderTop: '1px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {date}{readTime ? ` · ${readTime}` : ''}
          </span>
          <button
            className="btn btn-primary"
            onClick={onReadStory}
            style={{ minHeight: 40, padding: '0 20px', fontSize: 14, borderRadius: 8 }}
          >
            Read Story →
          </button>
        </div>
      </article>

      {modalOpen && (
        <LinkedRecordsModal
          title={title}
          entities={entities}
          total={total}
          onClose={closeModal}
        />
      )}
    </>
  );
}
