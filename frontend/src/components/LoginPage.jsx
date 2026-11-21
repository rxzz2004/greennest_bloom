import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function LoginPage({ 
  onLoginSuccess, 
  onBackToStore,
  initialMode = 'login',
  initialUserType = 'individual',
  currentUser,
  isModal = false
}) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [userType, setUserType] = useState(initialUserType); // 'individual' or 'corporate'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields (pre-filled with currentUser if upgrading/registering as business)
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [companyName, setCompanyName] = useState(currentUser?.company_name || '');
  const [gstin, setGstin] = useState(currentUser?.gstin || '');
  const [address, setAddress] = useState(currentUser?.address || '');

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
  };

  // OTP Verification state (used strictly for Password Reset)
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Send password reset code
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setErrorMsg('');
    setOtpSending(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        setOtpSent(true);
        soundEffects.playSuccessChime();
        setSuccessMsg(res.message || `Password reset code sent to ${email}`);
      }
    } catch (err) {
      setErrorMsg('Unable to dispatch reset email. Please verify backend connection.');
    } finally {
      setOtpSending(false);
    }
  };

  // Submit new password with reset code
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
        setMode('login');
        setPassword(newPassword);
        setOtp('');
        setOtpSent(false);
      }
    } catch (err) {
      setErrorMsg('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let submitEmail = (email || '').trim().toLowerCase();
      if (submitEmail === 'admin@greennestbloom' || submitEmail === 'admin') {
        submitEmail = 'admin@greennestbloom.com';
      }

      const res = await api.login({ email: submitEmail, password });
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(`Welcome back, ${res.user?.full_name}!`);
        setTimeout(() => {
          onLoginSuccess(res.user, res.token);
        }, 600);
      }
    } catch (err) {
      setErrorMsg('Unable to connect to login service. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration submission (direct, instant, no OTP blocking)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !fullName) {
      setErrorMsg('Please enter your full name, email address, and password.');
      soundEffects.playClick();
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      soundEffects.playClick();
      return;
    }

    if (userType === 'corporate' && !gstin) {
      setErrorMsg('GSTIN is required for verified corporate business accounts.');
      soundEffects.playClick();
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
        user_type: userType,
        company_name: userType === 'corporate' ? companyName.trim() : undefined,
        gstin: userType === 'corporate' ? gstin.trim().toUpperCase() : undefined,
        address: address.trim()
      };

      const res = await api.register(payload);
      if (res.error) {
        setErrorMsg(res.error);
        soundEffects.playClick();
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(
          res.upgraded 
            ? `Your business account has been verified! Welcome, ${res.user?.company_name || res.user?.full_name}!`
            : `Account created successfully! Signing you in as ${res.user?.full_name}...`
        );
        setTimeout(() => {
          onLoginSuccess(res.user, res.token);
        }, 700);
      }
    } catch (err) {
      setErrorMsg('Failed to complete registration. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role={isModal ? 'dialog' : undefined}
      aria-modal={isModal ? 'true' : undefined}
      className={isModal
        ? 'fixed inset-0 z-50 min-h-screen bg-stone-950/60 backdrop-blur-sm flex flex-col justify-center overflow-y-auto py-6 px-4'
        : 'min-h-screen bg-[#fbf9f5] flex flex-col justify-between relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8'}
    >
      
      {/* Subtle Botanical Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full filter blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/40 rounded-full filter blur-3xl -z-10 pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>

      {/* Top Header / Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBackToStore();
          }}
          className="flex items-center space-x-2 text-stone-600 hover:text-emerald-900 transition-colors text-xs font-semibold py-2 px-3 rounded-full hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Botanical Store</span>
        </button>

        <div className="flex items-center space-x-1 text-xs text-stone-400 font-serif">
          <span>Green Nest Bloom</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200/80 p-8 space-y-6">
        
        {/* Brand Header with Authentic Pink Lily */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-emerald-800 to-teal-900 p-0.5 mx-auto shadow-xl shadow-pink-900/20 flex items-center justify-center">
            <img
              src="/pink_lily_bloom.jpg"
              alt="Green Nest Bloom Pink Lily"
              className="w-full h-full object-cover rounded-[14px] border border-pink-200/50"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>
          <h2 className="font-serif text-2xl font-bold text-emerald-950 tracking-tight">
            {mode === 'forgot_password'
              ? 'Reset Your Account Password'
              : mode === 'login' 
              ? 'Sign in to Your Account' 
              : userType === 'corporate' && currentUser
              ? 'Register Your Business Account'
              : userType === 'corporate'
              ? 'Corporate Wholesale Registration'
              : 'Create Your Botanical Account'}
          </h2>
          <p className="text-xs text-stone-500">
            {mode === 'forgot_password'
              ? 'Enter your registered email address to receive a secure 6-digit password reset code.'
              : mode === 'login' 
              ? 'Access bespoke fresh lily bouquets, corporate staging, and express delivery.' 
              : userType === 'corporate'
              ? 'Join Green Nest Bloom as a verified corporate partner for wholesale rates, event staging & GST tax invoicing.'
              : 'Join Green Nest Bloom for personalized floral curation & corporate orders.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' 
                ? 'bg-white text-emerald-950 shadow-xs' 
                : 'hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' 
                ? 'bg-white text-emerald-950 shadow-xs' 
                : 'hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-semibold block">{errorMsg}</span>
              {errorMsg.toLowerCase().includes('already registered') && mode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="inline-flex items-center space-x-1 font-bold text-rose-700 hover:text-rose-900 underline text-xs cursor-pointer pt-0.5"
                >
                  <span>Switch directly to Sign In with this email</span>
                  <ArrowRight className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM: SIGN IN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('forgot_password');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORM: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <span className="font-bold text-stone-700">Account Recovery</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] text-emerald-800 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </div>

            {!otpSent ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Enter Your Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpSending || !email}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {otpSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reset Code to Your Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Reset Code to Email</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-stone-700">
                    <label className="font-bold flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Enter 6-Digit Reset Code</span>
                    </label>
                    <span className="text-[10px] text-stone-500">Sent to {email}</span>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 font-mono tracking-widest text-center text-sm font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Enter New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp || otp.length !== 6 || !newPassword || newPassword.length < 6}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Updating Password...' : 'Reset Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* FORM: CREATE ACCOUNT (REGISTER) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            
            {/* Account Type Segmented Toggle */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">Select Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setUserType('individual');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all text-left ${
                    userType === 'individual'
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block text-xs leading-tight">Individual</span>
                    <span className="text-[10px] text-stone-500 font-normal">Personal Shopping</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setUserType('corporate');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all text-left ${
                    userType === 'corporate'
                      ? 'border-indigo-700 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="block text-xs leading-tight">Corporate</span>
                    <span className="text-[10px] text-stone-500 font-normal">Wholesale & Events</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Venisha Dsouza"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800"
                />
              </div>
            </div>

            {/* Corporate Specific Fields */}
            {userType === 'corporate' && (
              <div className="space-y-3 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Corporate Wholesale Verification</span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. The Leela Palace Hospitality"
                    required={userType === 'corporate'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">15-Digit GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AABCL5544K1ZZ"
                    required={userType === 'corporate'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white uppercase"
                  />
                  <span className="text-[10px] text-stone-500 block mt-0.5">Mandatory for GST tax invoices and wholesale volume discounts.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Address with Quick Location & Map Pinning */}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-60"
            >
              <span>{loading ? 'Creating Account...' : userType === 'corporate' && currentUser ? 'Verify & Register as Business Partner' : 'Register & Start Shopping'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* Interactive Leaflet Map Pinning Modal */}
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

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center mt-6 text-[11px] text-stone-400">
        Green Nest Bloom Floriculture Pvt. Ltd. • Protected by secure authentication
      </div>

    </div>
  );
}
