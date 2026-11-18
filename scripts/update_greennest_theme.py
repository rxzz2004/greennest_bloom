import os

# Write the new greennest_header.jsx
with open('scripts/greennest_header.jsx', 'w') as f:
    f.write('''import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  FileText, 
  Truck, 
  RefreshCw, 
  Mail, 
  Users, 
  Plus, 
  ExternalLink, 
  Check, 
  MapPin, 
  BatteryCharging, 
  Phone, 
  Navigation, 
  Radio, 
  UserCheck,
  Database,
  LayoutDashboard,
  ChevronRight,
  Menu,
  Search,
  Bell,
  ChevronDown,
  ShoppingCart,
  DollarSign,
  Heart,
  Trash2
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';
import DatabaseInspectorView from './DatabaseInspectorView';

export default function AdminConsole({ onOpenLiveTrackingModal }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [salesTimeRange, setSalesTimeRange] = useState('month');
  const [todoList, setTodoList] = useState([
    { id: 1, text: 'Check morning fresh flower shipments', completed: false },
    { id: 2, text: 'Verify active delivery routes', completed: true },
    { id: 3, text: 'Review subscription curations for Indiranagar', completed: false },
    { id: 4, text: 'Update clearance prices on mature batches', completed: true },
  ]);
  const [newTodoInput, setNewTodoInput] = useState('');

  const handleToggleTodo = (id) => {
    soundEffects.playClick();
    setTodoList(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id) => {
    soundEffects.playClick();
    setTodoList(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTodo = (e) => {
    if (e.key === 'Enter' && newTodoInput.trim()) {
      soundEffects.playSuccessChime();
      setTodoList(prev => [...prev, { id: Date.now(), text: newTodoInput.trim(), completed: false }]);
      setNewTodoInput('');
    }
  };

  const [batches, setBatches] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [curationMetrics, setCurationMetrics] = useState(null);
  const [inventoryHealth, setInventoryHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delivery State
  const [drivers, setDrivers] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [autoSimulateFleet, setAutoSimulateFleet] = useState(false);
  const [isTicking, setIsTicking] = useState(false);
  const [driverUpdatingId, setDriverUpdatingId] = useState(null);

  // Customers Directory State
  const [usersList, setUsersList] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Map DOM & Instance Refs
  const fleetMapContainerRef = useRef(null);
  const fleetMapInstanceRef = useRef(null);
  const driverMarkersRef = useRef({});
  const depotMarkerRef = useRef(null);

  // Manual override state
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideDiscount, setOverrideDiscount] = useState(25);

  // Log incoming harvest modal
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestSubmitting, setHarvestSubmitting] = useState(false);
  const [harvestForm, setHarvestForm] = useState({
    product_id: 1,
    batch_code: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-OOTY`,
    harvest_date: new Date().toISOString().slice(0, 10),
    quantity: 250,
    vase_life_days: 5,
    farm_origin: 'Nilgiris High-Altitude Polyhouse #3'
  });

  // Selected email alert preview modal
  const [selectedAlertModal, setSelectedAlertModal] = useState(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [bRes, fRes, aRes, qRes, cRes, hRes, pRes, dRes, uRes] = await Promise.all([
        api.getBatches(),
        api.getProphetForecast(45),
        api.getSystemAlerts(),
        api.getQuotations(),
        api.getCurationMetrics(),
        api.getInventoryHealth(),
        api.getProducts(),
        api.getDeliveryDrivers(),
        api.getAllUsers()
      ]);
      if (bRes.batches) setBatches(bRes.batches);
      if (fRes) setForecastData(fRes);
      if (aRes.alerts) setAlerts(aRes.alerts);
      if (qRes.quotations) setQuotations(qRes.quotations);
      if (cRes) setCurationMetrics(cRes);
      if (hRes) setInventoryHealth(hRes);
      if (pRes.products) setProducts(pRes.products);
      if (dRes?.drivers) {
        setDrivers(dRes.drivers);
        setFleetSummary(dRes.fleet_summary);
      }
      if (uRes?.users) setUsersList(uRes.users);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEvaluateDecay = async () => {
    soundEffects.playClick();
    try {
      const res = await api.evaluateBatches();
      soundEffects.playSuccessChime();
      alert(`Daily Price Update: ${res.results.evaluated_batches} flower batches checked. ${res.results.critical_alerts_sent} freshness notices logged.`);
      loadAllAdminData();
    } catch (err) {
      alert('Error updating inventory freshness tiers');
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideModal) return;
    try {
      await api.overrideBatchDiscount(overrideModal.id, overrideDiscount, 'Manual clearance override');
      soundEffects.playSuccessChime();
      setOverrideModal(null);
      loadAllAdminData();
    } catch (err) {
      alert('Error applying override');
    }
  };

  const handleLogHarvest = async (e) => {
    e.preventDefault();
    setHarvestSubmitting(true);
    try {
      const res = await api.createBatch({
        product_id: Number(harvestForm.product_id),
        batch_code: harvestForm.batch_code,
        harvest_date: harvestForm.harvest_date,
        quantity: Number(harvestForm.quantity),
        vase_life_days: Number(harvestForm.vase_life_days)
      });
      soundEffects.playSuccessChime();
      setShowHarvestModal(false);
      alert(res.message || 'New farm harvest batch recorded successfully.');
      loadAllAdminData();
    } catch (err) {
      alert('Error logging farm harvest batch.');
    } finally {
      setHarvestSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Delivery & Live Tracking Handlers
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'delivery_fleet' && drivers.length > 0) {
      initOrUpdateFleetMap();
    }
  }, [activeTab, drivers]);

  // Auto-simulation periodic ticker
  useEffect(() => {
    let interval = null;
    if (autoSimulateFleet && activeTab === 'delivery_fleet') {
      interval = setInterval(async () => {
        try {
          const res = await api.simulateFleetTick();
          if (res.drivers) {
            setDrivers(res.drivers);
          }
        } catch (err) {
          console.error('Delivery tick error:', err);
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSimulateFleet, activeTab]);

  function initOrUpdateFleetMap() {
    if (!fleetMapContainerRef.current) return;
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => setupFleetMap();
      document.head.appendChild(script);
    } else {
      setupFleetMap();
    }
  }

  function setupFleetMap() {
    const L = window.L;
    if (!L || !fleetMapContainerRef.current) return;

    const depotLat = fleetSummary?.depot?.lat || 13.6934;
    const depotLng = fleetSummary?.depot?.lng || 75.2448;

    if (!fleetMapInstanceRef.current) {
      const map = L.map(fleetMapContainerRef.current).setView([depotLat, depotLng], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Depot Marker without emojis
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `<div style="background: #064e3b; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap;">Kalmane Hub (577432)</div>`,
        iconSize: [140, 26],
        iconAnchor: [70, 13]
      });
      depotMarkerRef.current = L.marker([depotLat, depotLng], { icon: depotIcon })
        .addTo(map)
        .bindPopup(`<strong>${fleetSummary?.depot?.name || 'Green Nest Mother Nursery & Packing Hub'}</strong><br/>${fleetSummary?.depot?.address || 'Kalmane, Thirthahalli, Karnataka 577432'}<br/><span style="color: #047857; font-size: 11px;">Origin Mother Nursery, Greenhouse & Nationwide Line-Haul Depot</span>`);

      fleetMapInstanceRef.current = map;
    } else {
      setTimeout(() => {
        fleetMapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    const map = fleetMapInstanceRef.current;

    // Update / create courier markers without emojis
    drivers.forEach((driver) => {
      const isEnRoute = driver.status === 'en_route';
      const isBreak = driver.status === 'on_break';
      const colorBg = isEnRoute ? '#be123c' : isBreak ? '#2563eb' : '#047857';
      const statusLabel = isEnRoute ? 'En Route' : isBreak ? 'On Break' : 'Available';

      const customHtml = `
        <div style="background: ${colorBg}; color: white; padding: 3px 8px; border-radius: 8px; font-weight: bold; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); white-space: nowrap;">
          <span>${driver.full_name.split(' ')[0]}</span>
          <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 9px;">${driver.battery_level}%</span>
        </div>
      `;

      const driverIcon = L.divIcon({
        className: `custom-driver-${driver.id}`,
        html: customHtml,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      if (driverMarkersRef.current[driver.id]) {
        driverMarkersRef.current[driver.id]
          .setLatLng([driver.current_lat, driver.current_lng])
          .setIcon(driverIcon);
      } else {
        const marker = L.marker([driver.current_lat, driver.current_lng], { icon: driverIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong>${driver.full_name}</strong> (${driver.vehicle_model})<br/>
              Status: <strong>${statusLabel}</strong><br/>
              Battery: ${driver.battery_level}% | Speed: ${driver.speed_kmh} km/h<br/>
              Route: ${driver.assigned_zone} &bull; Orders in van: ${driver.active_orders_count}<br/>
              Phone: ${driver.phone}
            </div>
          `);
        driverMarkersRef.current[driver.id] = marker;
      }
    });
  }

  const handleToggleDriverDuty = async (driverId, currentStatus) => {
    soundEffects.playClick();
    setDriverUpdatingId(driverId);
    try {
      const nextStatus = currentStatus === 'on_duty' ? 'off_duty' : 'on_duty';
      await api.updateDriverDuty(driverId, nextStatus);
      soundEffects.playSuccessChime();
      loadAllAdminData();
    } catch (err) {
      alert('Error updating courier duty status');
    } finally {
      setDriverUpdatingId(null);
    }
  };

  const handleFocusDriver = (driver) => {
    soundEffects.playClick();
    setSelectedDriver(driver);
    if (fleetMapInstanceRef.current) {
      fleetMapInstanceRef.current.flyTo([driver.current_lat, driver.current_lng], 14, { duration: 1 });
      if (driverMarkersRef.current[driver.id]) {
        driverMarkersRef.current[driver.id].openPopup();
      }
    }
  };

  const handleQuoteAction = async (quoteId, status) => {
    soundEffects.playClick();
    try {
      await api.updateQuoteStatus(quoteId, status);
      soundEffects.playSuccessChime();
      loadAllAdminData();
    } catch (err) {
      alert('Error updating quote status');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-800 flex overflow-x-hidden font-sans w-full">
      
      {/* GreenNest Bloom Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-stone-200 transition-all duration-300 flex flex-col shrink-0 z-40 select-none shadow-xs`}>
        {/* Brand Header - GreenNest Bloom Theme */}
        <div className="h-16 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between px-5 text-white shadow-xs">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              G
            </div>
            {sidebarOpen && (
              <span className="font-serif font-bold text-lg tracking-tight text-white truncate">
                GreenNest Bloom
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 text-xs font-semibold text-stone-600">
          
          {/* Section: DASHBOARD */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Dashboard
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('dashboard');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Dashboard"
              >
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Dashboard</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('prophet_forecasting');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'prophet_forecasting'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Sales Forecast"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'prophet_forecasting' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Sales Forecast</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </div>
          </div>

          {/* Section: OPERATIONS */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Operations
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('decay_batches');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'decay_batches'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Fresh Flowers"
              >
                <div className="flex items-center space-x-3">
                  <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'decay_batches' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Fresh Flowers</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-mono">
                    {batches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('delivery_fleet');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'delivery_fleet'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Delivery"
              >
                <div className="flex items-center space-x-3">
                  <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'delivery_fleet' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Delivery</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
                    {drivers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('quotations');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'quotations'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Quotes"
              >
                <div className="flex items-center space-x-3">
                  <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'quotations' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Quotes</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-mono">
                    {quotations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('curation_metrics');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'curation_metrics'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Subscriptions"
              >
                <div className="flex items-center space-x-3">
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'curation_metrics' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Subscriptions</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </div>
          </div>

          {/* Section: MANAGEMENT */}
          <div>
            {sidebarOpen && (
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                Management
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('user_accounts');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'user_accounts'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Customers"
              >
                <div className="flex items-center space-x-3">
                  <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'user_accounts' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Customers</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-mono">
                    {usersList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('system_alerts');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'system_alerts'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Alerts"
              >
                <div className="flex items-center space-x-3">
                  <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'system_alerts' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Alerts</span>}
                </div>
                {sidebarOpen && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    {alerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('db_inspector');
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 rounded-xl transition-all ${
                  activeTab === 'db_inspector'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-r-4 border-emerald-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title="Database"
              >
                <div className="flex items-center space-x-3">
                  <Database className={`w-4 h-4 shrink-0 ${activeTab === 'db_inspector' ? 'text-emerald-700' : 'text-stone-400'}`} />
                  {sidebarOpen && <span>Database</span>}
                </div>
                {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
              VR
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <div className="text-xs font-bold text-stone-800 truncate">Venisha Dsouza</div>
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                  <span>Store Manager</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Dashboard */}
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search dashboard..."
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick action button: Update Prices */}
            <button
              onClick={handleEvaluateDecay}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Update Prices</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={loadAllAdminData}
              title="Refresh Data"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div
              onClick={() => setActiveTab('system_alerts')}
              className="relative cursor-pointer p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {alerts.length || 3}
              </span>
            </div>

            {/* Language Selector */}
            <div className="hidden md:flex items-center space-x-1 text-xs text-stone-600 font-semibold px-2 py-1 hover:bg-stone-100 rounded-lg cursor-pointer">
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-stone-200">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  VR
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb indicator when inside non-dashboard tab */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center space-x-2 text-xs text-stone-500 pb-2">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <span>/</span>
              <span className="font-bold text-stone-800 capitalize">
                {activeTab === 'decay_batches' ? 'Fresh Flowers' : activeTab === 'delivery_fleet' ? 'Delivery' : activeTab === 'quotations' ? 'Quotes' : activeTab === 'curation_metrics' ? 'Subscriptions' : activeTab === 'user_accounts' ? 'Customers' : activeTab === 'system_alerts' ? 'Alerts' : activeTab === 'db_inspector' ? 'Database' : activeTab.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* MAIN DASHBOARD VIEW - GREENNEST BLOOM PALETTE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* ROW 1: 4 Vibrant Gradient Metric Cards (Botanical Palette, NO EMOJIS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Products Sold (Emerald Botanical) */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Products Sold</span>
                    <div className="text-3xl font-extrabold tracking-tight">4,565</div>
                    <span className="text-white/70 text-[10px] font-medium block">Current Quarter</span>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <ShoppingCart className="w-8 h-8 text-white/90" />
                  </div>
                  <ShoppingCart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 2: Net Profit (Rose Floral) */}
                <div className="bg-gradient-to-r from-rose-800 to-rose-600 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Net Profit</span>
                    <div className="text-3xl font-extrabold tracking-tight">
                      ₹ {inventoryHealth ? inventoryHealth.estimated_spoilage_salvaged_inr.toLocaleString() : '8,541'}
                    </div>
                    <span className="text-white/70 text-[10px] font-medium block">Current Quarter</span>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <DollarSign className="w-8 h-8 text-white/90" />
                  </div>
                  <DollarSign className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 3: New Customers (Amber Harvest) */}
                <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">New Customers</span>
                    <div className="text-3xl font-extrabold tracking-tight">4,565</div>
                    <span className="text-white/70 text-[10px] font-medium block">Current Quarter</span>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Users className="w-8 h-8 text-white/90" />
                  </div>
                  <Users className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

                {/* Card 4: Customer Satisfaction (Deep Teal) */}
                <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-2xl p-6 text-white shadow-xs flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <span className="text-white/85 text-xs font-semibold tracking-wide">Customer Satisfaction</span>
                    <div className="text-3xl font-extrabold tracking-tight">99%</div>
                    <span className="text-white/70 text-[10px] font-medium block">Current Quarter</span>
                  </div>
                  <div className="z-10 p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Heart className="w-8 h-8 text-white/90" />
                  </div>
                  <Heart className="w-32 h-32 text-white/10 absolute -right-4 -bottom-6 pointer-events-none" />
                </div>

              </div>

              {/* ROW 2: Product Sales Large Wave Area Chart */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Product Sales</h3>
                    <p className="text-xs text-stone-500">Monthly Revenue</p>
                    <div className="text-2xl font-black text-stone-900 mt-2">₹ 1,12,555</div>
                  </div>
                  <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
                    {['day', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setSalesTimeRange(range)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${
                          salesTimeRange === range
                            ? 'bg-emerald-800 text-white font-bold shadow-xs'
                            : 'hover:text-stone-900'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual Spline Wave SVG Chart (Rose & Emerald) */}
                <div className="w-full h-64 relative pt-4 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 900 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#047857" stopOpacity="0.60" />
                        <stop offset="100%" stopColor="#047857" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="roseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Rose Wave (Online Orders) */}
                    <path
                      d="M 0,190 Q 90,140 180,165 T 360,110 T 540,150 T 720,130 T 900,160 L 900,240 L 0,240 Z"
                      fill="url(#roseGrad)"
                    />
                    <path
                      d="M 0,190 Q 90,140 180,165 T 360,110 T 540,150 T 720,130 T 900,160"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                    />

                    {/* Emerald Wave (Store Orders) */}
                    <path
                      d="M 0,205 Q 120,200 240,155 T 480,165 T 620,40 T 780,155 T 900,90 L 900,240 L 0,240 Z"
                      fill="url(#emeraldGrad)"
                    />
                    <path
                      d="M 0,205 Q 120,200 240,155 T 480,165 T 620,40 T 780,155 T 900,90"
                      fill="none"
                      stroke="#047857"
                      strokeWidth="3.5"
                    />

                    {/* Peak marker dots for Rose Wave */}
                    <circle cx="180" cy="165" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />
                    <circle cx="360" cy="110" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />
                    <circle cx="720" cy="130" r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />

                    {/* Peak marker dots for Emerald Wave */}
                    <circle cx="240" cy="155" r="4.5" fill="#ffffff" stroke="#047857" strokeWidth="3" />
                    <circle cx="620" cy="40" r="5" fill="#ffffff" stroke="#047857" strokeWidth="3.5" />
                  </svg>
                </div>

                {/* Footer comparison bars */}
                <div className="pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>Online Orders</span>
                      <span className="text-stone-400">45%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-stone-700">
                      <span>Store Orders</span>
                      <span className="text-stone-400">70%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Three Cards (Order Summary, Order Overview, Tasks) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Card 1: Order Summary (Dual Bar Chart) */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 mb-6">Order Summary</h3>
                    
                    <div className="flex items-end justify-between h-48 pt-4 pb-2 px-2">
                      {/* Y-axis labels */}
                      <div className="flex flex-col justify-between h-full text-[10px] text-stone-400 pr-2 select-none">
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                        <span>0</span>
                      </div>

                      {/* 7 Grouped Bar Pairs */}
                      <div className="flex-1 flex justify-around items-end h-full">
                        {[
                          { pink: 88, purple: 68 },
                          { pink: 62, purple: 52 },
                          { pink: 40, purple: 32 },
                          { pink: 65, purple: 55 },
                          { pink: 42, purple: 36 },
                          { pink: 60, purple: 50 },
                          { pink: 82, purple: 74 },
                        ].map((group, idx) => (
                          <div key={idx} className="flex items-end space-x-1 group">
                            {/* Rose bar */}
                            <div
                              style={{ height: `${group.pink}%` }}
                              className="w-2.5 bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-105"
                            ></div>
                            {/* Emerald bar */}
                            <div
                              style={{ height: `${group.purple}%` }}
                              className="w-2.5 bg-emerald-700 rounded-t-sm transition-all duration-300 group-hover:brightness-105"
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center space-x-6 pt-4 border-t border-stone-100 text-xs font-semibold text-stone-600">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Online Orders</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                      <span>Store Orders</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Order Overview */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Order Overview</h3>
                    <div className="text-3xl font-black text-stone-900 mt-3">5,680</div>
                    <p className="text-xs text-stone-500 mb-6">Total Orders</p>

                    <div className="space-y-5">
                      {/* Item 1 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">30</span>
                            <span className="text-stone-500 text-xs ml-2">Online Orders</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">30%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">50</span>
                            <span className="text-stone-500 text-xs ml-2">Store Orders</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">50%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">20</span>
                            <span className="text-stone-500 text-xs ml-2">Cash On Delivery</span>
                          </div>
                          <span className="text-xs font-bold text-stone-700">20%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Target Fulfillment: 100%</span>
                    <span className="text-emerald-700 font-bold">On Schedule</span>
                  </div>
                </div>

                {/* Card 3: Tasks List */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 mb-4">Tasks</h3>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {todoList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors group"
                        >
                          <label className="flex items-center space-x-3 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleTodo(item.id)}
                              className="w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500/30"
                            />
                            <span className={`text-xs font-medium ${item.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                              {item.text}
                            </span>
                          </label>
                          <button
                            onClick={() => handleDeleteTodo(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 rounded transition-all"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <input
                      type="text"
                      placeholder="Add new task and press Enter..."
                      value={newTodoInput}
                      onChange={(e) => setNewTodoInput(e.target.value)}
                      onKeyDown={handleAddTodo}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}
''')

# Read tab panels and modals from AdminConsole.jsx
with open('frontend/src/components/AdminConsole.jsx') as f:
    current = f.read()

tab1_marker = "{/* TAB 1: Perishable Flower Batches */}"
modals_marker = "{/* Modal 1: Log Incoming Farm Harvest Batch */}"

t1 = current.find(tab1_marker)
m1 = current.find(modals_marker)

tab_panels = current[t1:m1].strip()
# Remove </main></div> if it was left at the end of tab_panels
tab_panels = tab_panels.replace("</main>\n      </div>", "").strip()

# Clean emojis from tab_panels
replacements = [
    ("⭐ 4.91 Avg Rating", "4.91 Avg Rating"),
    ("⚡ {selectedDriver.battery_level}%", "{selectedDriver.battery_level}%"),
    ("🏁 {selectedDriver.speed_kmh} km/h", "{selectedDriver.speed_kmh} km/h"),
    ("🟢 Available for Dispatch", "Available for Dispatch"),
    ("🔴 En Route to Destination", "En Route to Destination"),
    ("🔵 On Scheduled Break", "On Scheduled Break"),
    ("⚪ Off Duty / Offline", "Off Duty / Offline"),
    ("⭐ {driver.rating}", "{driver.rating}"),
    ("🪔 {pt.holiday_flag}", "{pt.holiday_flag}"),
    ("🪔 Indian Festive Calendar & Botanical Demand Shock Engine", "Festive Calendar & Seasonal Demand Engine"),
    ("🗓️ {fest.season}", "{fest.season}"),
    ("🗄️ Database Tables Inspector & Editor", "Database Tables"),
    ("🗄️ Database", "Database"),
    ("Fresh Flower Batches & Dynamic Pricing", "Fresh Flowers"),
    ("Log Farm Harvest Shipment", "Log Shipment"),
    ("Delivery Fleet & Live Personnel GPS Tracking", "Delivery & Live Tracking"),
    ("Event Quotes & Staging Inquiries", "Quotes"),
    ("Subscription Curation Pipeline", "Subscriptions"),
    ("Client Accounts Directory", "Customers"),
    ("Store Notifications & Activity Trail", "Alerts"),
    ("Quixlab", "GreenNest Bloom"),
    ("quixlab", "greennest"),
]

for old, new in replacements:
    tab_panels = tab_panels.replace(old, new)

# Modals block
modals_content = current[m1:].strip()
# Remove closing tags from modals_content so we add them cleanly
end_idx = modals_content.rfind("</div>\n  );\n}")
if end_idx != -1:
    modals_content = modals_content[:end_idx].strip()

# Clean emojis from modals
modals_content = modals_content.replace("🌿 Automatically registers harvest freshness", "Automatically registers harvest freshness")

with open('scripts/greennest_header.jsx') as f:
    header = f.read()

final_jsx = header + "\n\n" + tab_panels + "\n\n        </main>\n      </div>\n\n" + modals_content + "\n\n    </div>\n  );\n}\n"

with open('frontend/src/components/AdminConsole.jsx', 'w') as f:
    f.write(final_jsx)

print("Updated AdminConsole.jsx with GreenNest Bloom theme, simple words, and no emojis!")

