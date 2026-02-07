import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

/**
 * RichTextEditor - A rich text editor component using react-quill
 * 
 * ORIGINAL: Direct import adds ~200KB to bundle
 * OPTIMIZED: Use LazyRichTextEditor wrapper for dynamic import
 * 
 * @example
 * // ❌ Bad - Direct import adds 200KB to initial bundle
 * import RichTextEditor from './RichTextEditor';
 * 
 * // ✅ Good - Lazy loaded only when needed
 * import LazyRichTextEditor from './LazyRichTextEditor';
 */
export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Enter your content...',
  height = 300 
}) {
  const [content, setContent] = useState(value);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image'
  ];

  const handleChange = (newContent) => {
    // Sanitize content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(newContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 
                     'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 
                     'img', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
    });
    setContent(sanitizedContent);
    if (onChange) {
      onChange(sanitizedContent);
    }
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: `${height}px`, marginBottom: '42px' }}
        className="bg-white rounded-lg"
      />
    </div>
  );
}
