import { Suspense, lazy } from 'react';

/**
 * LazyRichTextEditor - Lazy-loaded wrapper for RichTextEditor
 * 
 * Saves ~200KB from initial bundle by dynamically importing react-quill
 * only when this component is rendered.
 * 
 * @example
 * import LazyRichTextEditor from './LazyRichTextEditor';
 * 
 * function BlogPostEditor() {
 *   return (
 *     <div>
 *       <h2>Edit Post</h2>
 *       <LazyRichTextEditor 
 *         value={content}
 *         onChange={setContent}
 *         placeholder="Write your post..."
 *       />
 *     </div>
 *   );
 * }
 */

// Lazy load the heavy RichTextEditor component
// This splits react-quill into a separate chunk
const RichTextEditor = lazy(() => import('./RichTextEditor'));

// Loading fallback
const EditorLoadingFallback = () => (
  <div 
    className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
    style={{ height: '300px' }}
  >
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-500 text-sm">Loading Rich Text Editor...</p>
      <p className="text-gray-400 text-xs mt-1">(~200KB)</p>
    </div>
  </div>
);

export default function LazyRichTextEditor(props) {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <RichTextEditor {...props} />
    </Suspense>
  );
}
