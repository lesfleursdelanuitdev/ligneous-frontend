'use client';

import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

const EXTENSIONS = [StarterKit];

export function RichTextBlockRenderer({ block }) {
  const doc = block.doc;
  if (!doc || typeof doc !== 'object') return null;

  let html = '';
  try {
    html = generateHTML(doc, EXTENSIONS);
  } catch {
    return null;
  }

  const preset = block.preset ?? block.textPreset ?? 'paragraph';

  const className = [
    'prose prose-base max-w-none',
    preset === 'quote' ? 'border-l-4 border-base-content/20 pl-4 italic' : '',
    preset === 'verse' ? 'font-serif whitespace-pre-wrap' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
