import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LocationMap - An interactive map component using react-leaflet
 * 
 * ORIGINAL: Direct import adds ~150KB to bundle
 * OPTIMIZED: Use LazyLocationMap wrapper for dynamic import
 * 
 * @example
 * // ❌ Bad - Direct import adds 150KB to initial bundle
 * import LocationMap from './LocationMap';
 * 
 * // ✅ Good - Lazy loaded only when needed
 * import LazyLocationMap from './LazyLocationMap';
 */
export default function LocationMap({ 
  center = [40.7128, -74.0060], // Default: NYC
  zoom = 13,
  markers = [],
  height = 400 
}) {
  // Custom marker icon
  const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="location-map rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: `${height}px`, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={[marker.lat, marker.lng]}
            icon={marker.icon || defaultIcon}
          >
            {marker.popup && (
              <Popup>
                <div className="text-sm">
                  <strong>{marker.popup.title}</strong>
                  {marker.popup.description && (
                    <p className="mt-1 text-gray-600">{marker.popup.description}</p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
