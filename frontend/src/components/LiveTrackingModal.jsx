import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  Radio,
  PackageCheck,
  ShieldCheck,
  Thermometer,
  Droplets,
  Building
} from 'lucide-react';
import { api } from '../api';

export default function LiveTrackingModal({ orderId, isOpen, onClose }) {
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStepping, setIsStepping] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadTelemetry();
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, orderId]);

  async function loadTelemetry() {
    setLoading(true);
    try {
      const res = await api.getTelemetry(orderId || 1);
      if (res.telemetry) {
        setTelemetryData(res);
        initOrUpdateMap(res);
      }
    } catch (err) {
      console.error('Telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function initOrUpdateMap(data) {
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => setupLeaflet(data);
      document.head.appendChild(script);
    } else {
      setupLeaflet(data);
    }
  }

  function setupLeaflet(data) {
    if (!mapContainerRef.current) return;
    const L = window.L;

    const depot = data.depot || {
      lat: 13.6934,
      lng: 75.2448,
      name: "Green Nest Mother Nursery & Packing Hub",
      address: "Kalmane, Thirthahalli, Karnataka 577432"
    };
    const dest = data.destination || { lat: 12.9784, lng: 77.6408, name: "Customer Address" };
    const driver = data.telemetry;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Depot Marker (Kalmane Mother Nursery Origin)
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `<div style="background: #064e3b; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: bold; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap;"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#34d399;"></span> Kalmane Nursery Hub</div>`,
        iconSize: [140, 24],
        iconAnchor: [70, 12]
      });

      L.marker([depot.lat, depot.lng], { icon: depotIcon })
        .addTo(map)
        .bindPopup(`<strong>${depot.name}</strong><br/>${depot.address || 'Kalmane, Thirthahalli, Karnataka 577432'}<br/><span style="color: #047857; font-size: 11px;">Origin Mother Nursery, Greenhouse & Nationwide Packing Facility</span>`)
        .openPopup();

      // Destination Marker
      L.marker([dest.lat, dest.lng])
        .addTo(map)
        .bindPopup(`<strong>${dest.name}</strong><br/>Recipient Nationwide Delivery Address`);

      // Route Polyline
      const latlngs = data.route_waypoints?.map((w) => [w.lat, w.lng]) || [
        [depot.lat, depot.lng],
        [dest.lat, dest.lng]
      ];
      L.polyline(latlngs, { color: '#047857', weight: 4, dashArray: '6, 8' }).addTo(map);

      // Moving Driver Marker
      const driverMarker = L.circleMarker([driver.current_lat, driver.current_lng], {
        radius: 9,
        fillColor: '#be123c',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(map).bindPopup('<strong>Live Courier Vehicle</strong><br/>Kalmane-National Cold-Chain Fleet en route');

      // Fit bounds to display the whole corridor from Kalmane, Thirthahalli to destination
      const bounds = L.latLngBounds([
        [depot.lat, depot.lng],
        [dest.lat, dest.lng]
      ]);
      if (driver.current_lat && driver.current_lng) {
        bounds.extend([driver.current_lat, driver.current_lng]);
      }
      map.fitBounds(bounds, { padding: [40, 40] });

      markerRef.current = driverMarker;
      mapInstanceRef.current = map;
    } else {
      if (markerRef.current) {
        markerRef.current.setLatLng([driver.current_lat, driver.current_lng]);
      }
    }
  }

  const handleStepVehicle = async () => {
    setIsStepping(true);
    try {
      const res = await api.stepTelemetry(orderId || 1);
      if (res.telemetry) {
        setTelemetryData((prev) => ({ ...prev, telemetry: res.telemetry }));
        if (markerRef.current) {
          markerRef.current.setLatLng([res.telemetry.current_lat, res.telemetry.current_lng]);
        }
      }
    } catch (err) {
      console.error('Step error:', err);
    } finally {
      setIsStepping(false);
    }
  };

  const handleTriggerException = async () => {
    setIsAlerting(true);
    try {
      const res = await api.triggerTransitException(orderId || 1, 'Heavy monsoon waterlogging along transit highway corridor.');
      setAlertNotice(res.message);
      loadTelemetry();
      setTimeout(() => setAlertNotice(null), 4500);
    } catch (err) {
      alert('Error logging exception');
    } finally {
      setIsAlerting(false);
    }
  };

  if (!isOpen) return null;

  const checkpoints = telemetryData?.checkpoints || [];
  const coldChain = telemetryData?.cold_chain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-emerald-800 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Live Dispatch & Delivery Tracking
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  Nationwide Express
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Originating from Kalmane Mother Nursery & Packing Hub (Thirthahalli, 577432)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center font-bold text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Nursery Origin & Packaging Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-3 my-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Nursery Origin: Kalmane, Thirthahalli, Karnataka 577432</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  100% Moisture Root-Seal Guarantee
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                All live botanical cuttings and potted species are hand-harvested, damp-root gel sealed, and packaged into temperature-retaining eco-boxes at our <strong>Kalmane Mother Nursery</strong> prior to nationwide line-haul dispatch.
              </p>
            </div>
          </div>
        </div>

        {alertNotice && (
          <div className="my-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{alertNotice}</span>
          </div>
        )}

        {/* Work Area */}
        <div className="py-2 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto min-h-0">
          
          {/* Map View */}
          <div className="lg:col-span-7 h-72 lg:h-auto min-h-[300px] rounded-2xl overflow-hidden border border-stone-300 shadow-inner relative">
            <div ref={mapContainerRef} className="w-full h-full"></div>
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-stone-200 shadow-md text-[11px] z-[1000] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="font-bold text-stone-800">Kalmane, Thirthahalli (577432)</span>
              <span className="text-stone-400">→</span>
              <span className="text-stone-600 font-medium">Nationwide Route</span>
            </div>
          </div>

          {/* Telemetry Sidebar */}
          <div className="lg:col-span-5 space-y-3.5 text-xs flex flex-col justify-between overflow-y-auto pr-1">
            <div className="space-y-3">
              
              {/* Fleet Courier Info */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Courier Fleet Asset (Kalmane Outbound Line-Haul):
                </span>
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-bold text-stone-900">
                    {telemetryData?.telemetry?.driver_name || 'Ramesh Kumar (GNB Kalmane Fleet)'}
                  </strong>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                    {telemetryData?.telemetry?.status?.toUpperCase() || 'EN ROUTE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 text-[11px]">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <a
                      href={`tel:${telemetryData?.telemetry?.driver_phone || '+919876543210'}`}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      {telemetryData?.telemetry?.driver_phone || '+91 98765 43210'}
                    </a>
                  </div>
                  <div className="font-mono text-stone-500 font-bold">
                    {telemetryData?.telemetry?.vehicle_number || 'KA-14-NC-8821'}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="flex items-center gap-1 font-bold text-stone-500 mb-0.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> ETA
                  </span>
                  <div className="text-lg font-bold font-mono text-stone-900">
                    {telemetryData?.telemetry?.estimated_eta_minutes} mins
                  </div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="flex items-center gap-1 font-bold text-stone-500 mb-0.5 text-[11px]">
                    <Gauge className="w-3.5 h-3.5 text-indigo-600" /> Speed
                  </span>
                  <div className="text-lg font-bold font-mono text-stone-900">
                    {telemetryData?.telemetry?.speed_kmh} km/h
                  </div>
                </div>
              </div>

              {/* Cold Chain IoT Telemetry */}
              {coldChain && (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-emerald-700" /> Cargo: {coldChain.cargo_temp_c}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-teal-600" /> Humidity: {coldChain.humidity_pct}%
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    {coldChain.cooling_system} • <span className="font-semibold">{coldChain.status}</span>
                  </div>
                </div>
              )}

              {/* Packing & Line-Haul Checkpoints Stepper */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Packing & Delivery Route Progress:
                </span>
                <div className="space-y-2">
                  {checkpoints.map((cp, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px]">
                      <div className="mt-0.5 shrink-0">
                        {cp.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : cp.status === 'current' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${cp.status === 'current' ? 'text-emerald-900 font-bold' : 'text-stone-800'}`}>
                            {cp.name}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">{cp.time}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                          {cp.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Simulation Triggers */}
            <div className="space-y-2 pt-2 border-t border-stone-200 mt-2">
              <button
                onClick={handleStepVehicle}
                disabled={isStepping}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Advance Vehicle Along Corridor</span>
              </button>

              <button
                onClick={handleTriggerException}
                disabled={isAlerting}
                className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Simulate Transit Delay Alert</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
