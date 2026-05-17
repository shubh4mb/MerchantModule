import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Component to handle map clicks
const LocationMarker = ({
  position,
  onPositionChange,
}: {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const latLng = marker.getLatLng();
          onPositionChange(latLng.lat, latLng.lng);
        },
      }}
    />
  ) : null;
};

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 16); // adjust zoom if needed
  }, [lat, lng]);

  return null;
};

const MapSelector = ({ latitude, longitude, onLocationSelect }: MapSelectorProps) => {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );

  // Default center (India center or user's location)
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
  const center = position || defaultCenter;

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="map-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="map-box-header px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Location Map</span>
         <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">DRAGGABLE PIN</span>
      </div>
      <MapContainer
        center={center}
        zoom={position ? 15 : 5}
        style={{ flex: 1, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto recenter when current location is fetched */}
        {position && <RecenterMap lat={position[0]} lng={position[1]} />}

        <LocationMarker
          position={position}
          onPositionChange={handlePositionChange}
        />
      </MapContainer>
      <div className="map-instructions p-4 bg-white border-t border-gray-100 italic text-gray-500">
        <p className="flex items-center gap-2">
          <span className="text-black">📍</span> 
          Click anywhere or drag the pin to set your exact store location
        </p>
      </div>
    </div>
  );
};

export default MapSelector;