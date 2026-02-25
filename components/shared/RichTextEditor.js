'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';

/**
 * Rich text editor (TipTap) for discussion content.
 * Use in forms; pass value (HTML string) and onChange(html).
 * Set immediatelyRender: false for Next.js to avoid hydration issues.
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write something…',
  minHeight = '100px',
  className = '',
  disabled = false,
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChangeRef.current?.(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = value || '';
    const existing = editor.getHTML();
    if (current !== existing) {
      editor.commands.setContent(current, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) return null;

  return (
    <div
      className={`rounded-lg border border-base-content/20 bg-base-100 ${className}`}
      style={{ minHeight }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
