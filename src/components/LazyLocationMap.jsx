import { Suspense, lazy } from 'react';

/**
 * LazyLocationMap - Lazy-loaded wrapper for LocationMap
 * 
 * Saves ~150KB from initial bundle by dynamically importing react-leaflet
 * only when this component is rendered.
 * 
 * @example
 * import LazyLocationMap from './LazyLocationMap';
 * 
 * function BusinessLocator() {
 *   return (
 *     <div>
 *       <h2>Our Locations</h2>
 *       <LazyLocationMap 
 *         center={[40.7128, -74.0060]}
 *         markers={[
 *           { lat: 40.7128, lng: -74.0060, popup: { title: 'Main Office' } }
 *         ]}
 *       />
 *     </div>
 *   );
 * }
 */

// Lazy load the heavy LocationMap component
// This splits react-leaflet and leaflet into a separate chunk
const LocationMap = lazy(() => import('./LocationMap'));

// Loading fallback
const MapLoadingFallback = () => (
  <div 
    className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg"
    style={{ height: '400px' }}
  >
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500 text-sm">Loading Map...</p>
      <p className="text-gray-400 text-xs mt-1">(~150KB)</p>
    </div>
  </div>
);

export default function LazyLocationMap(props) {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <LocationMap {...props} />
    </Suspense>
  );
}
