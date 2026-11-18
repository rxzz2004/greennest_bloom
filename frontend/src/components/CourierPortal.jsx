import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  Battery,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
  Package,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  User,
  Check,
  Send,
  LogOut,
  KeyRound,
  Zap,
  Coffee,
  MessageSquare,
  Bike
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function CourierPortal({ onClose, currentTheme = 'rose' }) {
  // Saved driver session from localStorage
  const [driverUser, setDriverUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gnb_driver_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // OTP Login Form State
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpPreview, setOtpPreview] = useState(null);

  // Authenticated Driver Data & Manifest
  const [driverData, setDriverData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // Modals
  const [unavailableModalOrder, setUnavailableModalOrder] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState('Doorbell unanswered and phone unreachable after 3 attempts.');
  const [customReasonNote, setCustomReasonNote] = useState('');

  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('Damp-root moisture seal intact. Handed directly to customer at doorstep.');

  // Pre-configured 3 Registered Fleet Personnel for fast 1-tap testing
  const registeredPersonnel = [
    {
      id: 1,
      name: 'Kavita Reddy',
      phone: '+91 98450 11223',
      vehicle: 'Rapid Nursery EV Scooter',
      plate: 'KA-14-ES-1029',
      icon: Bike,
      badge: 'Local Urban Express'
    },
    {
      id: 2,
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      vehicle: 'Refrigerated Cold-Chain EV Van',
      plate: 'KA-14-EV-4402',
      icon: Truck,
      badge: 'Regional Van Fleet'
    },
    {
      id: 3,
      name: 'Vikram Rathore',
      phone: '+91 99800 55441',
      vehicle: 'Interstate Heavy Refrigerated Truck',
      plate: 'KA-14-TR-9901',
      icon: Truck,
      badge: 'National Line-Haul Truck'
    }
  ];

  // Load driver data and orders when logged in
  useEffect(() => {
    if (driverUser?.id) {
      loadDriverDashboard(driverUser.id);
    }
  }, [driverUser?.id]);

  // Continuous background location & telemetry broadcaster
  useEffect(() => {
    if (!driverUser?.id) return;

    const interval = setInterval(async () => {
      if (driverData?.status === 'en_route') {
        try {
          // Slight realistic road jitter / progress along Kalmane corridor
          const deltaLat = (Math.random() - 0.48) * 0.003;
          const deltaLng = (Math.random() - 0.48) * 0.003;
          const nextLat = (driverData.current_lat || 13.6934) + deltaLat;
          const nextLng = (driverData.current_lng || 75.2448) + deltaLng;
          const nextSpeed = Math.round(36 + Math.random() * 16);
          const nextBattery = Math.max(12, (driverData.battery_level || 85) - 1);

          const res = await api.updateDriverLocation(driverUser.id, {
            current_lat: nextLat,
            current_lng: nextLng,
            speed_kmh: nextSpeed,
            battery_level: nextBattery
          });
          if (res.driver) {
            setDriverData(prev => ({
              ...prev,
              current_lat: res.driver.current_lat,
              current_lng: res.driver.current_lng,
              speed_kmh: res.driver.speed_kmh,
              battery_level: res.driver.battery_level
            }));
          }
        } catch (e) {
          // silent background ping
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [driverUser?.id, driverData?.status, driverData?.current_lat, driverData?.current_lng, driverData?.battery_level]);

  const loadDriverDashboard = async (driverId) => {
    setLoading(true);
    try {
      const ordersRes = await api.getDriverOrders(driverId);
      if (ordersRes.driver) {
        setDriverData(ordersRes.driver);
      }
      if (ordersRes.orders) {
        setOrders(ordersRes.orders);
      }
    } catch (err) {
      console.error('Failed to load courier orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // OTP Sign-In Handlers
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    soundEffects.playClick();
    setOtpLoading(true);
    try {
      const res = await api.sendDriverOTP(phoneInput);
      if (res.status === 'success') {
        setOtpSent(true);
        setOtpPreview(res.otp_preview);
        setOtpInput(res.otp_preview || '');
        showNotice(res.message, 'success');
      } else {
        showNotice(res.error || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showNotice('Could not send OTP. Please check server connection.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    soundEffects.playClick();
    setOtpLoading(true);
    try {
      const res = await api.verifyDriverOTP(phoneInput, otpInput);
      if (res.status === 'success' && res.driver) {
        soundEffects.playSuccess();
        setDriverUser(res.driver);
        setDriverData(res.driver);
        localStorage.setItem('gnb_driver_user', JSON.stringify(res.driver));
        showNotice(`Welcome back, ${res.driver.full_name}! Shift authenticated.`, 'success');
      } else {
        showNotice(res.error || 'Invalid OTP code. Please check your phone.', 'error');
      }
    } catch (err) {
      showNotice('Verification failed. Invalid OTP code.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDriverLogout = () => {
    soundEffects.playClick();
    localStorage.removeItem('gnb_driver_user');
    setDriverUser(null);
    setDriverData(null);
    setOtpSent(false);
    setOtpInput('');
    setOtpPreview(null);
    showNotice('Driver signed out. Shift session ended.', 'info');
  };

  // Duty Status Change
  const handleDutyStatusChange = async (newStatus) => {
    soundEffects.playClick();
    setActionLoading(true);
    try {
      const res = await api.updateDriverStatus(driverUser.id, newStatus);
      if (res.driver) {
        setDriverData(res.driver);
        showNotice(`Duty status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
      }
    } catch (err) {
      showNotice('Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manual GPS Ping
  const handleBroadcastLocation = async () => {
    soundEffects.playSuccess();
    setActionLoading(true);
    try {
      const deltaLat = (Math.random() - 0.48) * 0.004;
      const deltaLng = (Math.random() - 0.48) * 0.004;
      const newLat = (driverData?.current_lat || 13.6934) + deltaLat;
      const newLng = (driverData?.current_lng || 75.2448) + deltaLng;
      const newSpeed = driverData?.status === 'en_route' ? Math.round(35 + Math.random() * 15) : 0;
      const newBattery = Math.max(12, (driverData?.battery_level || 85) - (driverData?.status === 'en_route' ? 1 : 0));

      const res = await api.updateDriverLocation(driverUser.id, {
        current_lat: newLat,
        current_lng: newLng,
        speed_kmh: newSpeed,
        battery_level: newBattery
      });

      if (res.driver) {
        setDriverData(res.driver);
        showNotice(`GPS Coordinates Broadcasted: ${newLat.toFixed(4)}, ${newLng.toFixed(4)} (${newSpeed} km/h)`, 'success');
      }
    } catch (err) {
      showNotice('Failed to broadcast GPS', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handover: Successfully Delivered
  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryConfirmOrder) return;
    soundEffects.playSuccess();
    setActionLoading(true);
    try {
      const res = await api.completeDriverDelivery(
        driverUser.id,
        deliveryConfirmOrder.id,
        deliveryNotes
      );
      if (res.order) {
        showNotice(`Order #${deliveryConfirmOrder.order_number} marked DELIVERED! Handover confirmed.`, 'success');
        setDeliveryConfirmOrder(null);
        loadDriverDashboard(driverUser.id);
      }
    } catch (err) {
      showNotice('Failed to record delivery', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handover: Customer Unavailable
  const handleConfirmCustomerUnavailable = async (e) => {
    e.preventDefault();
    if (!unavailableModalOrder) return;
    soundEffects.playClick();
    setActionLoading(true);
    try {
      const fullReason = customReasonNote.trim() 
        ? `${unavailableReason} Note: ${customReasonNote.trim()}`
        : unavailableReason;

      const res = await api.reportCustomerUnavailable(
        driverUser.id,
        unavailableModalOrder.id,
        fullReason
      );

      if (res.order) {
        showNotice(`Customer unavailable logged for #${unavailableModalOrder.order_number}. Customer & Admin notified.`, 'warning');
        setUnavailableModalOrder(null);
        setCustomReasonNote('');
        loadDriverDashboard(driverUser.id);
      }
    } catch (err) {
      showNotice('Failed to report exception', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showNotice = (msg, type = 'info') => {
    setStatusNotice({ msg, type });
    setTimeout(() => setStatusNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-stone-950 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                  Green Nest Bloom Driver Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  COLD-CHAIN FLEET (3 VEHICLES)
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Daily OTP Authentication • Live Telemetry Broadcaster • Doorstep Customer Handover
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {driverUser && (
              <button
                type="button"
                onClick={handleDriverLogout}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="End Shift / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">End Shift</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose && onClose();
              }}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Notification */}
        {statusNotice && (
          <div className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
            statusNotice.type === 'success'
              ? 'bg-emerald-600 text-white'
              : statusNotice.type === 'warning'
              ? 'bg-amber-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 animate-pulse shrink-0" />
              <span>{statusNotice.msg}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-white/80 hover:text-white font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 1: DRIVER DAILY OTP AUTHENTICATION (When Not Logged In)
            ========================================================================= */}
        {!driverUser ? (
          <div className="p-6 sm:p-10 flex-1 overflow-y-auto bg-[#faf9f6] flex flex-col items-center justify-center space-y-6">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-lg space-y-5">
              
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  Daily Driver Sign-In
                </h3>
                <p className="text-xs text-stone-500">
                  Enter your registered driver phone number to receive your daily shift OTP code.
                </p>
              </div>

              {/* Quick Preset Selector for the 3 Authorized Drivers */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Select Registered Fleet Personnel:
                </span>
                <div className="space-y-1.5">
                  {registeredPersonnel.map((p) => {
                    const IconComp = p.icon;
                    const isSelected = phoneInput === p.phone;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setPhoneInput(p.phone);
                          setOtpSent(false);
                          setOtpInput('');
                          setOtpPreview(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs">{p.name}</div>
                            <div className="text-[10px] text-stone-500 truncate">{p.vehicle} ({p.plate})</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0">
                          {p.phone}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OTP Form */}
              <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Driver Mobile Phone:</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {!otpSent ? (
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                  >
                    {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send Daily OTP Code</span>
                  </button>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-700">Enter 6-Digit OTP:</label>
                        {otpPreview && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Preview Code: {otpPreview}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="••••••"
                        className="w-full p-3 rounded-xl border border-stone-300 font-mono text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-stone-500 mt-1 text-center">
                        Code valid for 15 minutes. Dispatched to driver registered phone.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                        className="w-1/3 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        Resend OTP
                      </button>
                      <button
                        type="submit"
                        disabled={otpLoading}
                        className="w-2/3 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Verify & Start Shift</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="pt-2 text-center border-t border-stone-100 text-[11px] text-stone-400">
                Authorized Personnel Only • Green Nest Mother Nursery & Logistics
              </div>
            </div>
          </div>
        ) : (

          /* =========================================================================
             SCREEN 2: AUTHENTICATED COURIER DASHBOARD & LIVE TELEMETRY
             ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#faf9f6]">
            
            {/* Driver Identity & Live Duty Controller */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-serif font-bold text-xl shrink-0">
                    {driverData?.full_name ? driverData.full_name[0] : 'D'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Active Courier On Shift:</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Rating: {driverData?.rating || 4.95} / 5.0
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {driverData?.full_name}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      {driverData?.vehicle_type} • <span className="font-mono font-bold text-stone-700">{driverData?.vehicle_number}</span>
                    </p>
                  </div>
                </div>

                {/* Duty Status Selector: en_route, on_break, charging, tasks_done */}
                <div className="flex items-center flex-wrap gap-1.5">
                  {[
                    { id: 'en_route', label: 'En Route', color: 'bg-amber-600 text-white', icon: Navigation },
                    { id: 'on_break', label: 'On Break', color: 'bg-blue-600 text-white', icon: Coffee },
                    { id: 'charging', label: 'Charging EV', color: 'bg-purple-600 text-white', icon: Zap },
                    { id: 'tasks_done', label: 'Tasks Done', color: 'bg-teal-700 text-white', icon: CheckCircle2 }
                  ].map((s) => {
                    const StatusIcon = s.icon;
                    const isActive = driverData?.status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleDutyStatusChange(s.id)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isActive
                            ? `${s.color} shadow-xs scale-102 ring-2 ring-offset-1 ring-stone-900`
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-Time Live Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-bold block">Live Speed</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {driverData?.speed_kmh || 0} km/h
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-bold block">EV Battery Level</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Battery className={`w-4 h-4 ${
                      (driverData?.battery_level || 0) > 40 ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {driverData?.battery_level || 90}%
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-bold block">Duty Status</span>
                  <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block mt-0.5">
                    {driverData?.status?.replace('_', ' ') || 'AVAILABLE'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[10px] text-stone-400 font-bold block">Completed Deliveries</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {driverData?.completed_deliveries || 0} Drops
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Location Broadcasting Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 gap-2">
                <div className="flex items-center space-x-2 text-emerald-950 text-xs">
                  <Radio className="w-4 h-4 text-emerald-700 animate-pulse shrink-0" />
                  <span>
                    Continuous GPS Broadcast: <strong className="font-mono">{driverData?.current_lat?.toFixed(4)}, {driverData?.current_lng?.toFixed(4)}</strong>
                  </span>
                  <span className="text-emerald-700 text-[11px] hidden sm:inline">• Streamed to Admin Console & Customers</span>
                </div>

                <button
                  type="button"
                  onClick={handleBroadcastLocation}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Force GPS Ping Now</span>
                </button>
              </div>
            </div>

            {/* Assigned Orders Manifest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span>Assigned Deliveries Manifest ({orders.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Customer orders dispatched from Kalmane Mother Nursery for temperature-controlled doorstep handover
                  </p>
                </div>
                <button
                  onClick={() => loadDriverDashboard(driverUser.id)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 font-bold text-stone-600 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="font-serif font-bold text-stone-800 text-base">Manifest Clear</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    No active floral drops pending in your queue. When new customer orders are routed from Kalmane Nursery, they will appear here with customer contact details.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {orders.map((order) => {
                    const isDelivered = order.order_status === 'delivered';
                    const isAttempted = order.order_status === 'attempted_undelivered';
                    const customerPhone = order.customer_phone || '+91 63619 44131';
                    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shipping_address)}`;
                    const whatsappMsg = `Hello ${order.customer_name}! This is ${driverData.full_name} from Green Nest Bloom delivery (${driverData.vehicle_type} ${driverData.vehicle_number}). I am arriving with your fresh botanical order #${order.order_number}. Could you share your location landmark?`;
                    const whatsappLink = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

                    return (
                      <div
                        key={order.id}
                        className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-xs ${
                          isDelivered
                            ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                            : isAttempted
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-stone-200/90 hover:shadow-md'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono font-bold text-sm text-stone-900">
                              #{order.order_number}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isAttempted
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}>
                              {order.order_status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-stone-500 font-medium">
                              • {order.order_type.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-bold text-stone-900 font-serif text-sm">
                              ₹{order.total_amount?.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ({order.payment_status?.toUpperCase() || 'PAID'})
                            </span>
                          </div>
                        </div>

                        {/* Customer Details & Quick Contact */}
                        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-stone-400 block">Customer Information:</span>
                              <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5 mt-0.5">
                                <User className="w-3.5 h-3.5 text-stone-500" />
                                <span>{order.customer_name}</span>
                                {order.company_name && (
                                  <span className="text-[11px] text-indigo-700 font-semibold font-sans">
                                    ({order.company_name})
                                  </span>
                                )}
                              </div>
                              <div className="text-stone-500 text-[11px] mt-0.5">
                                Email: {order.customer_email || 'Not specified'}
                              </div>
                            </div>

                            {/* Direct Contact CTAs for Driver */}
                            <div className="flex items-center flex-wrap gap-2">
                              <a
                                href={`tel:${customerPhone}`}
                                onClick={() => soundEffects.playClick()}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call: {customerPhone}</span>
                              </a>

                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => soundEffects.playClick()}
                                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                                title="Send WhatsApp Landmark Request"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp / Landmark</span>
                              </a>
                            </div>
                          </div>

                          {/* Destination Address & Directions */}
                          <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-1.5 text-stone-800 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="leading-snug">{order.shipping_address}</span>
                            </div>

                            <a
                              href={mapsLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => soundEffects.playClick()}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs flex items-center space-x-1.5 transition-colors shrink-0 shadow-xs"
                            >
                              <ExternalLink className="w-3 h-3 text-stone-500" />
                              <span>Open Map Directions</span>
                            </a>
                          </div>
                        </div>

                        {/* Stems Manifest & Preservation */}
                        <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">Stems in Cargo Box:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {order.items?.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 text-[11px] font-semibold">
                                  {item.quantity}x {item.item_name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Cold-Chain 4.2°C Active</span>
                          </div>
                        </div>

                        {/* Handover Action CTAs */}
                        {!isDelivered ? (
                          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                setUnavailableModalOrder(order);
                              }}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Customer Not Available / Reschedule</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                setDeliveryConfirmOrder(order);
                              }}
                              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mark as Successfully Delivered</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-emerald-700 font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Delivery Handover Verified</span>
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              Status: COMPLETED
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info bar */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-stone-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Green Nest Bloom Logistics Fleet • Kalmane Nursery Packing Facility (Thirthahalli, Karnataka 577432)</span>
          <span className="font-mono text-stone-400">Driver Telemetry v3.0 Active</span>
        </div>
      </div>

      {/* MODAL 1: Confirm Successful Handover */}
      {deliveryConfirmOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmDelivery}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Confirm Delivery Handover
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryConfirmOrder(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-stone-600">
              You are completing delivery for Order <strong className="text-stone-900">#{deliveryConfirmOrder.order_number}</strong> to <strong className="text-stone-900">{deliveryConfirmOrder.customer_name}</strong>.
            </p>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Handover Notes / Verification:</label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Handed directly to customer at doorstep. Damp-root gel moisture intact."
                required
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
              <div className="font-bold">Automated Notification:</div>
              <div>Customer will instantly receive an email confirming completion, and your delivered trip count will increment.</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliveryConfirmOrder(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm & Mark Delivered</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Customer Not Available Exception */}
      {unavailableModalOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmCustomerUnavailable}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-xs animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Customer Not Available
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnavailableModalOrder(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-stone-600">
              Reporting delivery attempt exception for Order <strong className="text-stone-900">#{unavailableModalOrder.order_number}</strong> ({unavailableModalOrder.customer_name}).
            </p>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Reason for Inability to Deliver:</label>
              <select
                value={unavailableReason}
                onChange={(e) => setUnavailableReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
              >
                <option value="Doorbell unanswered and phone unreachable after 3 attempts.">
                  Doorbell unanswered & phone unreachable
                </option>
                <option value="Customer requested evening or weekend rescheduled delivery.">
                  Customer requested evening / reschedule
                </option>
                <option value="Gated community / security guard denied access to premises.">
                  Gated security denied access
                </option>
                <option value="Incorrect or incomplete street address.">
                  Incorrect or incomplete address
                </option>
                <option value="Recipient not present; no authorized person to accept damp-root flowers.">
                  Recipient not present to receive live flowers
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Additional Courier Notes (Optional):</label>
              <input
                type="text"
                value={customReasonNote}
                onChange={(e) => setCustomReasonNote(e.target.value)}
                placeholder="e.g. Left voice note on WhatsApp; vehicle waiting 10 mins"
                className="w-full p-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold">Next Steps:</div>
              <div>An automated notice with your contact details will be emailed to the customer, and the order will be flagged in the Super-Admin console for rescheduling.</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setUnavailableModalOrder(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Log Exception & Notify Customer</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}