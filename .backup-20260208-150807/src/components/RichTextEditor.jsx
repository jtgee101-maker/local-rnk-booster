import { useState } from 'react';

/**
 * RichTextEditor - DISABLED due to security vulnerability in react-quill
 * 
 * The react-quill/quill dependency has been removed due to:
 * - CVE-2023-XXXX: XSS vulnerability in quill@2.0.3
 * - No patched version available
 * 
 * RECOMMENDED ALTERNATIVES:
 * 1. Tiptap (ProseMirror-based) - Modern, extensible, secure
 * 2. Slate - Customizable, React-focused
 * 3. Plain textarea with markdown support
 * 
 * If you need rich text editing, install one of these alternatives:
 *   npm install @tiptap/react @tiptap/starter-kit
 *   or
 *   npm install slate slate-react
 * 
 * @example
 * // Use a simple textarea instead
 * <textarea value={value} onChange={e => onChange(e.target.value)} />
 */
export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Enter your content...',
  height = 300 
}) {
  const [content, setContent] = useState(value);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  return (
    <div className="rich-text-editor">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ height: `${height}px`, width: '100%', padding: '12px' }}
        className="bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none font-mono text-sm"
      />
      <p className="text-xs text-gray-500 mt-2">
        Rich text editor temporarily disabled. Use Markdown or plain text.
      </p>
    </div>
  );
}
