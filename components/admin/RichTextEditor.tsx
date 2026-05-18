'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect } from 'react';
import {
  Bold, Italic, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Heading2, Heading3, Undo, Redo, Minus
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[140px] px-4 py-3 focus:outline-none text-gray-800',
      },
    },
  });

  // Sync external value changes (e.g. on villa load)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const btnBase = 'p-1.5 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed';
  const btnActive = 'bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#B08B52]/30 focus-within:border-[#B08B52] transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {/* History */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={btnBase} title="Annuler">
          <Undo size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={btnBase} title="Rétablir">
          <Redo size={14} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Headings */}
        <button type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? btnActive : ''}`}
          title="Titre H2">
          <Heading2 size={14} />
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btnBase} ${editor.isActive('heading', { level: 3 }) ? btnActive : ''}`}
          title="Titre H3">
          <Heading3 size={14} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Bold / Italic */}
        <button type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive('bold') ? btnActive : ''}`}
          title="Gras">
          <Bold size={14} />
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} ${editor.isActive('italic') ? btnActive : ''}`}
          title="Italique">
          <Italic size={14} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Lists */}
        <button type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive('bulletList') ? btnActive : ''}`}
          title="Liste à puces">
          <List size={14} />
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive('orderedList') ? btnActive : ''}`}
          title="Liste numérotée">
          <ListOrdered size={14} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'left' }) ? btnActive : ''}`}
          title="Aligner à gauche">
          <AlignLeft size={14} />
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'center' }) ? btnActive : ''}`}
          title="Centrer">
          <AlignCenter size={14} />
        </button>
        <button type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`${btnBase} ${editor.isActive({ textAlign: 'right' }) ? btnActive : ''}`}
          title="Aligner à droite">
          <AlignRight size={14} />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Divider */}
        <button type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnBase} title="Séparateur">
          <Minus size={14} />
        </button>
      </div>

      {/* Editor area */}
      <div className="bg-white">
        {!editor.getText() && placeholder && (
          <p className="absolute px-4 py-3 text-sm text-gray-400 pointer-events-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
