import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, MapPin, CheckCircle2, Navigation, AlertCircle, X, Plus, Minus } from 'lucide-react';

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

interface SearchSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Sync map panning with center state:
 * - Detects when user starts moving/dragging the map (lifts pin)
 * - When moving stops (moveend), updates the pinned coordinates to the exact map center
 */
const MapCenterTracker = ({
  onCenterChange,
  setIsMoving,
  readOnly,
}: {
  onCenterChange: (lat: number, lng: number) => void;
  setIsMoving: (moving: boolean) => void;
  readOnly?: boolean;
}) => {
  const map = useMapEvents({
    movestart() {
      if (!readOnly) setIsMoving(true);
    },
    moveend() {
      if (!readOnly) {
        setIsMoving(false);
        const center = map.getCenter();
        onCenterChange(center.lat, center.lng);
      }
    },
  });

  return null;
};

/**
 * Controller component for smooth programmatic camera moves
 */
const MapCameraController = ({
  target,
}: {
  target: { lat: number; lng: number; zoom?: number } | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom || map.getZoom() || 16, {
        duration: 1.2,
      });
    }
  }, [target, map]);

  return null;
};

/**
 * Floating Zoom In / Zoom Out Controls
 */
const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute top-3 left-3 z-[500] flex flex-col bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
        title="Zoom In"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        title="Zoom Out"
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

const MapSelector = ({ latitude, longitude, onLocationSelect, readOnly }: MapSelectorProps) => {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );

  const [isMoving, setIsMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Default fallback center: India center if none specified
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const initialCenter = position || defaultCenter;

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCenterChange = useCallback(
    (lat: number, lng: number) => {
      if (readOnly) return;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
      setSearchError(null);
    },
    [readOnly, onLocationSelect]
  );

  // Search places using OSM Nominatim with autocomplete
  const performSearch = async (query: string) => {
    if (!query.trim() || readOnly) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setSearchError('No matching places found. Try entering area or landmark.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Check your network.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const selectSuggestion = (s: SearchSuggestion) => {
    const newLat = parseFloat(s.lat);
    const newLng = parseFloat(s.lon);
    setPosition([newLat, newLng]);
    onLocationSelect(newLat, newLng);
    setCameraTarget({ lat: newLat, lng: newLng, zoom: 16 });
    setSearchQuery(s.display_name.split(',')[0]);
    setShowSuggestions(false);
  };

  const handleCurrentLocation = () => {
    if (readOnly) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
        setCameraTarget({ lat, lng, zoom: 17 });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not detect location. Please enable browser GPS permissions or search.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-50 select-none">
      {/* ── Top Header & Autocomplete Search Bar ── */}
      <div className="p-3 bg-white border-b border-slate-200 shadow-sm z-20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
              <MapPin size={13} className="stroke-[2.5]" />
            </span>
            <span className="text-xs font-bold text-slate-800 tracking-tight">Pin Store Location</span>
          </div>

          {/* Status Badge */}
          {position ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Location Pinned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle size={13} className="text-amber-600" />
              Pin Required
            </span>
          )}
        </div>

        {/* Search Bar + Single 'Detect My GPS' Action */}
        <div className="flex items-center gap-2" ref={searchContainerRef}>
          <div className="relative flex-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder={readOnly ? 'Location is locked' : 'Search area, market, street or pincode...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 3) {
                    performSearch(e.target.value);
                  } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                disabled={readOnly}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                {isSearching ? (
                  <Loader2 size={15} className="animate-spin text-slate-400" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[1000] divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 group"
                  >
                    <MapPin size={15} className="text-slate-400 group-hover:text-slate-900 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 group-hover:text-slate-900 line-clamp-2">
                      {item.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary GPS button */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLocating || readOnly}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-60 whitespace-nowrap shrink-0"
            title="Auto-detect current store location using device GPS"
          >
            {isLocating ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span className="hidden sm:inline text-xs">Locating...</span>
              </>
            ) : (
              <>
                <Navigation size={15} className="text-emerald-400 fill-emerald-400" />
                <span className="hidden sm:inline text-xs">Detect My GPS</span>
              </>
            )}
          </button>
        </div>

        {searchError && (
          <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-0.5">
            <AlertCircle size={13} />
            {searchError}
          </p>
        )}
      </div>

      {/* ── Interactive Map Canvas ── */}
      <div className="relative flex-1 w-full overflow-hidden">
        <MapContainer
          center={initialCenter}
          zoom={position ? 16 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControls />

          {/* Map center change handler on pan/drag */}
          <MapCenterTracker
            onCenterChange={handleCenterChange}
            setIsMoving={setIsMoving}
            readOnly={readOnly}
          />

          {/* Smooth camera animation handler */}
          <MapCameraController target={cameraTarget} />
        </MapContainer>

        {/* ── Uber/Swiggy-Style Center Pin with Lift Effect on Pan ── */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[450]">
          <div className="relative flex flex-col items-center">
            {/* Animated Pin Marker: Lifts up when user pans the map */}
            <div
              className={`flex flex-col items-center transition-transform duration-200 ease-out ${
                isMoving ? '-translate-y-4 scale-110' : 'translate-y-0 scale-100'
              }`}
            >
              {/* Store Name Pill */}
              <div className="bg-slate-900 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Store Entrance
              </div>

              {/* Pin Head & Pointer */}
              <div className="relative flex items-center justify-center">
                <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17 0C7.61116 0 0 7.61116 0 17C0 27.2 14.5 40.5 16.1 41.9C16.6 42.3 17.4 42.3 17.9 41.9C19.5 40.5 34 27.2 34 17C34 7.61116 26.3888 0 17 0Z"
                    fill="#0F172A"
                  />
                  <circle cx="17" cy="17" r="7" fill="#FFFFFF" />
                  <circle cx="17" cy="17" r="4" fill="#10B981" />
                </svg>
              </div>
            </div>

            {/* Dynamic Ground Shadow: Expands/shrinks as pin lifts */}
            <div
              className={`h-2 rounded-full bg-black/25 blur-[1px] transition-all duration-200 ease-out -mt-1 ${
                isMoving ? 'w-3 opacity-30 scale-75' : 'w-5 opacity-70 scale-100'
              }`}
            />
          </div>
        </div>

        {/* ── Dynamic Helper Guidance Pill at Bottom ── */}
        {!readOnly && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
            <div
              className={`transition-all duration-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border text-xs font-semibold whitespace-nowrap ${
                isMoving
                  ? 'bg-slate-900 text-white border-white/20 scale-105'
                  : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200/80 shadow-md'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isMoving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              {isMoving ? 'Move map to position store under the pin...' : 'Pan map to place pin at exact store location'}
            </div>
          </div>
        )}

        {/* Current Live Coordinates Pill (Top Right) */}
        {position && (
          <div className="absolute top-3 right-3 z-[500] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 px-2.5 py-1 rounded-md shadow-sm text-[11px] font-mono text-slate-600">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSelector;