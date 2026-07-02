import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import type { Hospital } from '@/lib/mock-data';

interface Props {
  hospitals: Hospital[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // fallback center (city centre)

export const GoogleMapComponent: React.FC<Props> = ({ hospitals }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  return (
    <LoadScript googleMapsApiKey={apiKey || ''}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={12}>
        {hospitals.map((h) => (
          <Marker key={h.id} position={h.coordinates} title={h.name} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};
