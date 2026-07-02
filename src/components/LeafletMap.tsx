import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Hospital } from '@/lib/mock-data';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons for Vite (ESM)
// The default icon URLs break because Leaflet tries to guess the path via
// CSS background-image introspection which doesn't work with bundlers.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  hospitals: Hospital[];
  onHospitalClick?: (hospital: Hospital) => void;
}

export const LeafletMapComponent: React.FC<Props> = ({ hospitals, onHospitalClick }) => {
  // Centre on first hospital or fall back to Bangalore centre
  const defaultPosition: [number, number] =
    hospitals.length > 0
      ? [hospitals[0].coordinates.lat, hospitals[0].coordinates.lng]
      : [12.9716, 77.5946];

  return (
    <MapContainer
      center={defaultPosition}
      zoom={12}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hospitals.map((h) => (
        <Marker
          key={h.id}
          position={[h.coordinates.lat, h.coordinates.lng]}
          eventHandlers={{
            click: () => onHospitalClick?.(h),
          }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ fontSize: 14, color: '#b45309' }}>{h.name}</strong>
              <br />
              <span style={{ fontSize: 12, color: '#78716c' }}>{h.address}</span>
              <br />
              <span style={{ fontSize: 12 }}>
                ⭐ {h.rating} &nbsp;|&nbsp; 🏥 Queue: {h.currentQueueLength} &nbsp;|&nbsp; ⏱{' '}
                {h.estimatedWaitMinutes} min
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
