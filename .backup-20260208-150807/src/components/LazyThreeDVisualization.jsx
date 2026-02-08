import { Suspense, lazy } from 'react';

/**
 * LazyThreeDVisualization - Lazy-loaded wrapper for ThreeDVisualization
 * 
 * Saves ~500KB from initial bundle by dynamically importing THREE.js
 * only when this component is rendered.
 * 
 * @example
 * import LazyThreeDVisualization from './LazyThreeDVisualization';
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h2>3D Analytics</h2>
 *       <LazyThreeDVisualization 
 *         data={[
 *           { value: 50, color: 0x4f46e5 },
 *           { value: 75, color: 0x10b981 },
 *           { value: 30, color: 0xf59e0b }
 *         ]} 
 *       />
 *     </div>
 *   );
 * }
 */

// Lazy load the heavy ThreeDVisualization component
const ThreeDVisualization = lazy(() => import('./ThreeDVisualization'));

// Loading fallback with spinner
const ThreeDLoadingFallback = () => (
  <div 
    className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700"
    style={{ height: '400px' }}
  >
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400 text-sm">Loading 3D Visualization...</p>
      <p className="text-gray-500 text-xs mt-1">(~500KB)</p>
    </div>
  </div>
);

export default function LazyThreeDVisualization(props) {
  return (
    <Suspense fallback={<ThreeDLoadingFallback />}>
      <ThreeDVisualization {...props} />
    </Suspense>
  );
}
