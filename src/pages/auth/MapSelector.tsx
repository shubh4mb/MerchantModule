import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, LocateFixed, Loader2 } from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        handlePositionChange(newLat, newLng);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionChange(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get current location. Please check your browser permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="map-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="map-box-header px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col gap-3">
         <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Location Map</span>
           <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">DRAGGABLE PIN</span>
         </div>
         
         <div className="flex gap-2 w-full">
           <form onSubmit={handleSearch} className="flex-1 relative">
             <input
               type="text"
               placeholder="Search for a location or address..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-16 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <button 
               type="submit" 
               disabled={isSearching || !searchQuery.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-700 disabled:opacity-50 transition-colors"
             >
               {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
             </button>
           </form>
           
           <button
             type="button"
             onClick={handleCurrentLocation}
             disabled={isLocating}
             className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70 whitespace-nowrap"
             title="Use Current Location"
           >
             {isLocating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
             <span className="hidden sm:inline">Locate Me</span>
           </button>
         </div>
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