'use client';

import { RichTextBlockRenderer } from './RichTextBlockRenderer';

function DividerBlock({ block }) {
  const variant = block.preset ?? block.variant ?? 'line';
  if (variant === 'spacer') return <div className="h-8" />;
  if (variant === 'ornamental') return (
    <div className="flex items-center justify-center gap-3 my-4 text-base-content/40 text-lg">
      <span>&#10022;</span><span>&#10022;</span><span>&#10022;</span>
    </div>
  );
  return <hr className="border-base-content/20 my-4" />;
}

function MediaBlock({ block }) {
  return (
    <figure className="my-4">
      <div className="rounded-lg bg-base-200 flex items-center justify-center text-base-content/40 text-sm h-40">
        {block.mediaId ? `[Media: ${block.label || block.mediaId}]` : '[No media selected]'}
      </div>
      {block.caption && !block.hideCaption && (
        <figcaption className="text-xs text-base-content/60 mt-1 text-center">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function EmbedBlock({ block }) {
  const embedKind = block.embedKind ?? block.kind ?? 'unknown';
  return (
    <div className="my-4 rounded-lg border border-base-content/10 bg-base-200/50 p-6 flex items-center justify-center text-base-content/50 text-sm">
      [{embedKind} embed]
    </div>
  );
}

function BlockRenderer({ block }) {
  if (!block?.type) return null;

  switch (block.type) {
    case 'richText':
      return <RichTextBlockRenderer block={block} />;
    case 'divider':
      return <DividerBlock block={block} />;
    case 'media':
      return <MediaBlock block={block} />;
    case 'embed':
      return <EmbedBlock block={block} />;
    case 'container':
      return (
        <div className="my-4 space-y-4">
          {(block.blocks ?? []).map((b) => (
            <BlockRenderer key={b.id} block={b} />
          ))}
        </div>
      );
    case 'columns': {
      const cols = block.columns ?? [];
      return (
        <div className="my-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length || 2}, 1fr)` }}>
          {cols.map((col, i) => (
            <div key={col.id ?? i} className="space-y-4">
              {(col.blocks ?? []).map((b) => (
                <BlockRenderer key={b.id} block={b} />
              ))}
            </div>
          ))}
        </div>
      );
    }
    case 'splitContent': {
      const main = block.mainBlocks ?? block.blocks ?? [];
      const aside = block.asideBlocks ?? [];
      return (
        <div className="my-4 grid grid-cols-[1fr_auto] gap-6">
          <div className="space-y-4">
            {main.map((b) => <BlockRenderer key={b.id} block={b} />)}
          </div>
          <div className="w-48 shrink-0 space-y-4">
            {aside.map((b) => <BlockRenderer key={b.id} block={b} />)}
          </div>
        </div>
      );
    }
    case 'table':
      return (
        <div className="my-4 overflow-x-auto">
          <div className="text-sm text-base-content/50">[Table]</div>
        </div>
      );
    default:
      return null;
  }
}

function SectionRenderer({ section, depth = 0 }) {
  return (
    <section className="mb-8">
      {!section.hideTitle && section.title && (
        <h2 className={`font-semibold mb-4 ${depth === 0 ? 'text-2xl' : 'text-xl'}`}>{section.title}</h2>
      )}
      {!section.hideSubtitle && section.subtitle && (
        <p className="text-base-content/60 mb-4 text-lg">{section.subtitle}</p>
      )}
      <div className="space-y-4">
        {(section.blocks ?? []).map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
      {(section.children ?? []).map((child) => (
        <SectionRenderer key={child.id} section={child} depth={depth + 1} />
      ))}
    </section>
  );
}

export function StoryViewer({ doc }) {
  if (!doc) return null;

  const sections = doc.sections ?? [];

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-3">{doc.title}</h1>
        {doc.excerpt && <p className="text-xl text-base-content/60">{doc.excerpt}</p>}
      </header>
      <div>
        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </article>
  );
}
