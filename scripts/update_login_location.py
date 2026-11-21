import os

def update_login_page():
    path = "frontend/src/components/LoginPage.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update imports
    old_imports = """import React, { useState } from 'react';
import { 
  Flower2, 
  Sparkles, 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  KeyRound,
  RefreshCw,
  Send
} from 'lucide-react';"""

    new_imports = """import React, { useState, useRef, useEffect } from 'react';
import { 
  Flower2, 
  Sparkles, 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  KeyRound,
  RefreshCw,
  Send,
  Navigation,
  MapPin,
  Map,
  Search,
  X,
  Crosshair,
  Check
} from 'lucide-react';"""

    if old_imports not in content:
        print("Error: old_imports not found")
        return False
    content = content.replace(old_imports, new_imports)

    # 2. Add state and map logic inside LoginPage component
    target_state = "  const [address, setAddress] = useState(currentUser?.address || '');"
    new_state_and_functions = """  const [address, setAddress] = useState(currentUser?.address || '');

  // Geolocation & Map Pinning State
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState({ lat: 12.9141, lng: 74.8560 }); // Mangaluru / Coastal Karnataka baseline
  const [pinnedAddress, setPinnedAddress] = useState(currentUser?.address || '');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [permissionNoticeDismissed, setPermissionNoticeDismissed] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Format reverse-geocoded address into standard delivery address
  function formatNominatimAddress(data) {
    if (!data || !data.address) return data?.display_name || '';
    const a = data.address;
    const parts = [];
    if (a.house_number || a.building) parts.push(a.house_number || a.building);
    if (a.road || a.street) parts.push(a.road || a.street);
    if (a.suburb || a.neighbourhood || a.residential) parts.push(a.suburb || a.neighbourhood || a.residential);
    if (a.city || a.town || a.village || a.county) parts.push(a.city || a.town || a.village || a.county);
    if (a.state_district && a.state_district !== a.city) parts.push(a.state_district);
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);
    return parts.length > 0 ? parts.join(', ') : data.display_name;
  }

  // Reverse geocodes given coordinates to address
  const reverseGeocode = async (lat, lng) => {
    setGeocodingLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = formatNominatimAddress(data);
        setPinnedAddress(addr);
      } else {
        setPinnedAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      setPinnedAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Detect GPS location using browser navigator.geolocation
  const handleDetectCurrentLocation = () => {
    soundEffects.playClick();
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setErrorMsg('');
    setLocationSuccessMsg('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinnedCoords({ lat, lng });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = formatNominatimAddress(data);
          setAddress(addr);
          setPinnedAddress(addr);
          setLocationSuccessMsg(`Current GPS Location: ${addr}`);
          soundEffects.playSuccessChime();
        } catch (err) {
          const fallback = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
          setAddress(fallback);
          setLocationSuccessMsg(`GPS Coordinates: ${fallback}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. Please allow location access in your browser or enter your address manually.');
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg('Location request timed out. Please enter address manually or use Pin on Map.');
        } else {
          setErrorMsg('Could not detect location. Please enter manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Open interactive map picker modal
  const handleOpenMapPicker = () => {
    soundEffects.playClick();
    setShowMapPicker(true);
    if (!pinnedAddress && address) {
      setPinnedAddress(address);
    }
  };

  // Initialize Leaflet Map inside Modal
  useEffect(() => {
    if (!showMapPicker) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      initMap();
    }, 180);

    return () => clearTimeout(timer);
  }, [showMapPicker]);

  const initMap = () => {
    if (!mapContainerRef.current) return;
    const L = window.L;
    if (!L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => initMap();
      document.head.appendChild(script);
      return;
    }

    if (mapContainerRef.current._leaflet_id && !mapInstanceRef.current) {
      mapContainerRef.current._leaflet_id = null;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    const initialLat = pinnedCoords?.lat || 12.9141;
    const initialLng = pinnedCoords?.lng || 74.8560;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #be123c; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(190, 18, 60, 0.45); border: 2.5px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div style="width: 8px; height: 8px; background: #be123c; border-radius: 9999px; margin-top: 2px; box-shadow: 0 0 8px #be123c;"></div>
        </div>
      `,
      iconSize: [34, 44],
      iconAnchor: [17, 44]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    if (!pinnedAddress) {
      reverseGeocode(initialLat, initialLng);
    }

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setPinnedCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setPinnedCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });
  };

  // Search locality on map
  const handleSearchMapLocation = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    soundEffects.playClick();
    setMapSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery.trim())}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setPinnedCoords({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      } else {
        alert('Location not found. Try searching with city or landmark name (e.g. Kavoor, Mangaluru).');
      }
    } catch (err) {
      console.warn('Map search error:', err);
    } finally {
      setMapSearching(false);
    }
  };

  // Center on GPS inside map
  const handleDetectInsideMap = () => {
    soundEffects.playClick();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinnedCoords({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      },
      (err) => {
        alert('Could not access current location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Confirm pinned address
  const handleConfirmPinnedLocation = () => {
    soundEffects.playSuccessChime();
    if (pinnedAddress) {
      setAddress(pinnedAddress);
      setLocationSuccessMsg(`Map Pinned: ${pinnedAddress}`);
    }
    setShowMapPicker(false);
  };"""

    if target_state not in content:
        print("Error: target_state not found")
        return False
    content = content.replace(target_state, new_state_and_functions)

    # 3. Update Delivery Address field UI in registration form
    target_address_field = """            <div>
              <label className="block font-bold text-stone-700 mb-1">Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Street address, city, pincode..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs resize-none"
              />
            </div>"""

    new_address_field = """            {/* Delivery Address with Quick Location & Map Pinning */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="font-bold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Delivery Address</span>
                </label>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={detectingLocation}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Ask for location permission and auto-fill current GPS address"
                  >
                    {detectingLocation ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 text-emerald-700" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMapPicker}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                    title="Pin your exact doorstep on an interactive map"
                  >
                    <Map className="w-3 h-3 text-rose-600" />
                    <span>Pin on Map</span>
                  </button>
                </div>
              </div>

              {/* Location permission informative prompt */}
              {!permissionNoticeDismissed && !address && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Skip manual typing:</strong> Click <em>Use Current Location</em> or <em>Pin on Map</em> to quickly auto-fill your delivery doorstep.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionNoticeDismissed(true)}
                    className="text-amber-700 hover:text-amber-950 p-0.5 cursor-pointer shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Success Badge */}
              {locationSuccessMsg && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between gap-1.5 animate-in fade-in">
                  <span className="flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{locationSuccessMsg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenMapPicker}
                    className="text-[10px] font-bold text-emerald-800 hover:underline shrink-0 cursor-pointer ml-1"
                  >
                    Adjust Pin
                  </button>
                </div>
              )}

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Street address, building/flat no., locality, city, pincode..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>"""

    if target_address_field not in content:
        print("Error: target_address_field not found")
        return False
    content = content.replace(target_address_field, new_address_field)

    # 4. Add Interactive Map Picker Modal at bottom before closing tag
    target_modal_mount = "{/* Footer Info */}"
    map_modal_jsx = """{/* Interactive Leaflet Map Pinning Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">Pin Delivery Location</h3>
                  <p className="text-[10px] text-stone-500">Drag the marker or click on map to set your doorstep</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowMapPicker(false);
                }}
                className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Locality Search Form */}
            <div className="p-3 bg-stone-50 border-b border-stone-100">
              <form onSubmit={handleSearchMapLocation} className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Search locality, area, city (e.g. Kavoor, Mangaluru)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mapSearching || !mapSearchQuery.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Search className="w-3 h-3" />
                  <span>{mapSearching ? 'Searching...' : 'Find'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDetectInsideMap}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-stone-200 text-xs font-bold flex items-center cursor-pointer shrink-0"
                  title="Center map to my current GPS location"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="relative w-full h-72 sm:h-80 bg-stone-100">
              <div ref={mapContainerRef} className="w-full h-full" />
              {geocodingLoading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-stone-900/80 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-full shadow-lg flex items-center space-x-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  <span>Resolving street address...</span>
                </div>
              )}
            </div>

            {/* Live Address Preview & Confirm Actions */}
            <div className="p-4 bg-white border-t border-stone-100 space-y-3">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-600" />
                    <span>Selected Delivery Address</span>
                  </span>
                  <span className="font-mono text-stone-400">
                    {pinnedCoords.lat.toFixed(4)}, {pinnedCoords.lng.toFixed(4)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-stone-900 leading-snug">
                  {pinnedAddress || 'Drag pin or click map to choose your location'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPinnedLocation}
                  disabled={!pinnedAddress}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Pinned Location</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}"""

    if target_modal_mount not in content:
        print("Error: target_modal_mount not found")
        return False
    content = content.replace(target_modal_mount, map_modal_jsx)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Successfully updated LoginPage.jsx with Current Location and Map Pinning capabilities!")
    return True

if __name__ == "__main__":
    update_login_page()
