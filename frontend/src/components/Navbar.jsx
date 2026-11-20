import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ShoppingCart, 
  CalendarHeart, 
  Sparkles, 
  MapPin, 
  User, 
  ChevronDown, 
  ReceiptText,
  Radio,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  Search,
  X,
  Palette,
  Sun,
  Moon,
  Flower,
  PhoneCall,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  Gift,
  Heart,
  PackageCheck,
  Smartphone
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

export default function Navbar({ 
  activeRole, 
  setActiveRole, 
  currentUser,
  isLoggedIn = true,
  onOpenLogin,
  onLogout,
  cartCount = 0, 
  onOpenCart, 
  onOpenReminders,
  onOpenLiveTracking,
  onOpenOrders,
  onOpenWishlist,
  onOpenInstallPrompt,
  wishlistCount = 0,
  unreadAlertsCount = 0,
  onReplayIntro,
  searchQuery = '',
  setSearchQuery = () => {},
  currentTheme = 'rose',
  setTheme = () => {},
  onOpenCustomizer = () => {},
  corporateActiveTab = 'overview',
  setCorporateActiveTab = () => {},
  userSubscription = null,
  onNavigateSubscription = () => {}
}) {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [audioOn, setAudioOn] = useState(soundEffects.isEnabled());
  const [pincode, setPincode] = useState('560038');
  const [isEditingPincode, setIsEditingPincode] = useState(false);

  const isAdminUser = 
    currentUser?.user_type === 'admin' || 
    currentUser?.role === 'admin';

  const themeOptions = [
    { id: 'light', label: 'Botanical Light', icon: Sun, desc: 'Fresh garden tones & parchment' },
    { id: 'dark', label: 'Midnight Velvet', icon: Moon, desc: 'Deep slate & luminous flora' },
    { id: 'rose', label: 'Blush Rose Garden', icon: Flower, desc: 'Pastel petals & warm bronze' }
  ];

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md shadow-xs transition-colors duration-300 border-b ${
      currentTheme === 'dark'
        ? 'bg-[#090d16]/95 border-slate-800 text-slate-100'
        : currentTheme === 'light'
        ? 'bg-[#faf7f2]/95 border-stone-200/90 text-stone-800'
        : 'bg-[#fff5f7]/95 border-rose-200/80 text-[#37131e]'
    }`}>
      
      {/* Top Corporate Status Bar (Business Mode Only) */}
      {activeRole === 'corporate' && (
        <div className="bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 text-stone-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified B2B Enterprise Account</span>
              </span>
              {currentUser?.gstin && (
                <>
                  <span className="text-stone-600">•</span>
                  <span className="font-mono text-stone-300">GSTIN: {currentUser.gstin}</span>
                </>
              )}
              {currentUser?.company_name && (
                <>
                  <span className="hidden md:inline text-stone-600">•</span>
                  <span className="hidden md:inline text-stone-300 font-semibold">{currentUser.company_name}</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold">Credit Line: ₹2,50,000</span>
                <span className="text-stone-400 text-[10px]">(Net 30)</span>
              </div>
              <a 
                href="tel:+918025211234" 
                className="hidden sm:flex items-center space-x-1 text-indigo-300 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Priority Customer Care</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-4">
          
          {/* BRAND LOGO (Authentic Pink Lily Anchor) */}
          <div 
            id="brand-logo-anchor"
            onClick={() => {
              soundEffects.playClick();
              if (onReplayIntro) onReplayIntro();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Click to Replay Pink Lily Bloom Experience"
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            {/* Realistic Circular Pink Lily Emblem */}
            <div 
              id="brand-logo-emblem"
              className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-500 p-0.5 shadow-md shadow-pink-500/20 group-hover:scale-105 group-hover:shadow-pink-500/30 transition-all duration-300"
            >
              <img
                src="/pink_lily_bloom.jpg"
                alt="Green Nest Bloom Pink Lily"
                className="w-full h-full object-cover rounded-[14px] border border-pink-200/40"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[7px] font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-base sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                  Green Nest Bloom
                </span>
                {activeRole === 'corporate' ? (
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300/60 shrink-0">
                    B2B
                  </span>
                ) : activeRole === 'admin' ? (
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-stone-900 text-emerald-300 border border-stone-800 shrink-0">
                    Admin
                  </span>
                ) : null}
              </div>
              <p className="hidden sm:block text-[10px] sm:text-[11px] text-stone-500 font-medium truncate max-w-[130px] sm:max-w-[290px]">
                {activeRole === 'corporate' 
                  ? 'Wholesale Requisitions'
                  : 'Kalmane, Thirthahalli 577432'}
              </p>
            </div>
          </div>

          {/* Role Header / Persona View */}
          {currentUser?.user_type === 'admin' ? (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-white text-xs font-bold border border-emerald-800 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Admin Console</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-1 p-1 rounded-xl bg-stone-100/80 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 text-[11px] font-bold">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveRole('individual');
                  window.location.hash = '';
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeRole === 'individual'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {currentUser?.full_name || 'Personal'}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  if (currentUser?.user_type === 'corporate') {
                    setActiveRole('corporate');
                    window.location.hash = 'corporate';
                  } else {
                    if (onOpenLogin) {
                      onOpenLogin({ mode: 'register', userType: 'corporate' });
                    }
                  }
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeRole === 'corporate'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Corporate
              </button>
            </div>
          )}

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">

            {/* Shopper Actions (Only for Retail & Corporate Clients) */}
            {currentUser?.user_type !== 'admin' && (
              <>
                {/* 1. CALENDAR BUTTON (Hidden on mobile < sm, accessible via user persona menu) */}
                <button
                  id="nav-calendar-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenReminders();
                  }}
                  title="Personal Occasion Reminders & Calendar"
                  className={`hidden sm:flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                    currentTheme === 'dark'
                      ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                      : currentTheme === 'light'
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      : 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border-rose-200/80'
                  }`}
                >
                  <CalendarHeart className={`w-4 h-4 ${
                    currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-rose-500'
                  }`} />
                  <span className="hidden md:inline">Calendar</span>
                </button>

                {/* 2. ORDERS BUTTON (Hidden on mobile/tablet < md, accessible via user persona menu) */}
                <button
                  id="nav-orders-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenOrders();
                  }}
                  title="Order History & Tax Invoices"
                  className={`hidden md:flex items-center space-x-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                    currentTheme === 'dark'
                      ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                      : currentTheme === 'light'
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      : 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border-rose-200/80'
                  }`}
                >
                  <ReceiptText className={`w-4 h-4 ${
                    currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-rose-600'
                  }`} />
                  <span className="hidden md:inline">
                    {activeRole === 'corporate' ? 'GST Invoices' : 'Orders'}
                  </span>
                </button>

                {/* 3. WISHLIST BUTTON */}
                <button
                  id="nav-wishlist-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    if (onOpenWishlist) onOpenWishlist();
                  }}
                  title="Wishlist & Saved Bouquets"
                  className={`relative flex items-center space-x-1 sm:space-x-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs shrink-0 ${
                    currentTheme === 'dark'
                      ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700'
                      : currentTheme === 'light'
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      : 'bg-rose-50/80 hover:bg-rose-100 text-rose-900 border-rose-200/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${
                    wishlistCount > 0 
                      ? 'fill-rose-500 text-rose-500' 
                      : currentTheme === 'dark' ? 'text-slate-400' : currentTheme === 'light' ? 'text-stone-500' : 'text-rose-500'
                  }`} />
                  <span className="hidden md:inline">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* 4. CART BUTTON */}
                <button
                  id="open-cart-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenCart();
                  }}
                  title="Shopping Cart"
                  className={`relative flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-white font-medium text-xs sm:text-sm shadow-md transition-all shrink-0 ${
                    activeRole === 'corporate' 
                      ? 'bg-indigo-900 hover:bg-indigo-800 shadow-indigo-900/20' 
                      : currentTheme === 'dark'
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25'
                      : 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/25'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden md:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-pink-700 text-xs font-black flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* 5. THEME SELECTOR DROPDOWN (Desktop lg only, accessible via user persona menu on mobile) */}
            <div className="relative hidden lg:block">
              <button
                id="theme-selector-btn"
                onClick={() => {
                  soundEffects.playClick();
                  setShowThemeMenu(!showThemeMenu);
                }}
                title="Change Color Theme"
                className={`flex items-center space-x-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                  currentTheme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : currentTheme === 'light'
                    ? 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                    : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                }`}
              >
                <Palette className={`w-4 h-4 ${
                  currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-600' : 'text-rose-600'
                }`} />
                <span className="hidden md:inline capitalize">{themeOptions.find(o => o.id === currentTheme)?.label.split(' ')[0] || currentTheme}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border p-2 z-50 text-xs animate-in fade-in zoom-in-95 ${
                    currentTheme === 'dark'
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : currentTheme === 'light'
                      ? 'bg-white border-stone-200 text-stone-800'
                      : 'bg-white border-rose-200 text-[#37131e]'
                  }`}>
                    <div className={`px-2 py-1.5 border-b mb-1 text-[10px] uppercase font-bold ${
                      currentTheme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-stone-100 text-stone-400'
                    }`}>
                      Aesthetic Theme
                    </div>
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = currentTheme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          id={`theme-opt-${opt.id}`}
                          onClick={() => {
                            soundEffects.playClick();
                            setTheme(opt.id);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2.5 transition-colors ${
                            isSelected
                              ? opt.id === 'dark'
                                ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/40'
                                : opt.id === 'light'
                                ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300'
                                : 'bg-rose-50 text-rose-950 font-bold border border-rose-300'
                              : currentTheme === 'dark'
                              ? 'hover:bg-slate-800/60 text-slate-300'
                              : 'hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${
                            isSelected
                              ? opt.id === 'dark'
                                ? 'bg-cyan-900/60 text-cyan-300'
                                : opt.id === 'light'
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-rose-200 text-rose-900'
                              : currentTheme === 'dark'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold">{opt.label}</div>
                            <div className={`text-[10px] ${currentTheme === 'dark' ? 'text-slate-400' : 'text-stone-500'}`}>{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* User Persona & Account Menu (Always visible & prominent on mobile & desktop) */}
            {!isLoggedIn ? (
              <button
                id="nav-signin-btn"
                onClick={() => {
                  soundEffects.playClick();
                  onOpenLogin();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="relative shrink-0">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowPersonaMenu(!showPersonaMenu);
                  }}
                  className="flex items-center space-x-1.5 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200/80 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    activeRole === 'admin' 
                      ? 'bg-emerald-500 ring-2 ring-emerald-300' 
                      : activeRole === 'corporate' 
                      ? 'bg-indigo-600 ring-2 ring-indigo-300' 
                      : 'bg-pink-500 ring-2 ring-pink-300'
                  }`} />
                  <span className="font-bold max-w-[65px] sm:max-w-[100px] truncate text-xs">
                    {currentUser?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                </button>

                {showPersonaMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/10 backdrop-blur-2xs" 
                      onClick={() => setShowPersonaMenu(false)} 
                    />
                    <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-72 rounded-2xl shadow-2xl border p-2 z-50 text-xs animate-in fade-in zoom-in-95 ${
                      currentTheme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                        : currentTheme === 'light'
                        ? 'bg-white border-stone-200 text-stone-900'
                        : 'bg-white border-rose-200 text-[#37131e]'
                    }`}>
                      {/* 1. USER NAME & EMAIL */}
                      <div className={`p-2.5 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            currentTheme === 'dark' 
                              ? 'bg-slate-800 text-cyan-400' 
                              : currentTheme === 'light'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className={`block truncate font-bold text-sm ${currentTheme === 'dark' ? 'text-white' : 'text-stone-900'}`}>
                              {currentUser?.full_name || 'Individual User'}
                            </strong>
                            <span className="text-stone-500 font-mono text-[10px] block truncate">
                              {currentUser?.email || 'user@greennestbloom.com'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* MOBILE QUICK LINKS (Orders, Calendar, Theme for mobile viewports) */}
                      <div className="md:hidden p-1 border-b mb-1 space-y-1">
                        <button
                          onClick={() => {
                            setShowPersonaMenu(false);
                            soundEffects.playClick();
                            onOpenOrders();
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                            currentTheme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <ReceiptText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-semibold text-xs flex-1">
                            {activeRole === 'corporate' ? 'GST Tax Invoices' : 'My Orders & Invoices'}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setShowPersonaMenu(false);
                            soundEffects.playClick();
                            onOpenReminders();
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                            currentTheme === 'dark' ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <CalendarHeart className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-xs flex-1">Occasion Reminders</span>
                        </button>
                      </div>

                    {/* 2. SUBSCRIPTION NAME (Omitted for Admins) */}
                    {!isAdminUser && (
                      <div className={`p-2 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider mb-1.5 flex items-center gap-1">
                          <Gift className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Subscription Plan
                        </span>
                        {userSubscription ? (
                          <div 
                            id="navbar-active-subscription-card"
                            onClick={() => {
                              setShowPersonaMenu(false);
                              soundEffects.playClick();
                              if (setActiveRole) setActiveRole('individual');
                              window.dispatchEvent(new CustomEvent('nav-subscription'));
                              if (onNavigateSubscription) onNavigateSubscription();
                              window.location.hash = 'subscription';
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              currentTheme === 'dark'
                                ? 'bg-emerald-950/60 border-emerald-800/60 hover:bg-emerald-950'
                                : currentTheme === 'light'
                                ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80'
                                : 'bg-rose-50 border-rose-200 hover:bg-rose-100/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-bold text-xs truncate">
                                {userSubscription.tier === 'basic'
                                  ? 'Botanical Blossom Box'
                                  : userSubscription.tier === 'luxury'
                                  ? 'Imperial Grandeur Showcase'
                                  : 'Artisan Floral Curated Suite'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-200 shrink-0">
                                Active (Paid)
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-slate-400">
                              ₹{userSubscription.monthly_price}/month • Renews {userSubscription.next_delivery_date || 'Next Cycle'}
                            </div>
                          </div>
                        ) : (
                          <div 
                            id="navbar-subscribe-btn"
                            onClick={() => {
                              setShowPersonaMenu(false);
                              soundEffects.playClick();
                              if (setActiveRole) setActiveRole('individual');
                              window.dispatchEvent(new CustomEvent('nav-subscription'));
                              if (onNavigateSubscription) onNavigateSubscription();
                              window.location.hash = 'subscription';
                            }}
                            className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 cursor-pointer hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-500 dark:text-slate-400 font-medium">No Active Subscription</span>
                              <span className="text-pink-600 dark:text-cyan-400 font-bold text-[10px]">Subscribe →</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. SAVED DELIVERY ADDRESS */}
                    <div className={`p-2 border-b mb-1 ${
                      currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        Delivery Address
                      </span>
                      <p className="text-[11px] text-stone-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {currentUser?.address || 'Mother Nursery & Dispatch Hub, Kalmane, Thirthahalli, Karnataka 577432'}
                      </p>
                    </div>

                    {/* 4. ROLE-SPECIFIC ACTIONS */}
                    {currentUser?.user_type === 'individual' && (
                      <div className={`p-1 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <button
                          id="btn-switch-to-corporate"
                          onClick={() => {
                            soundEffects.playClick();
                            setShowPersonaMenu(false);
                            if (onOpenLogin) {
                              onOpenLogin({ mode: 'register', userType: 'corporate' });
                            }
                          }}
                          className={`w-full text-left p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                            currentTheme === 'dark'
                              ? 'bg-indigo-950/50 hover:bg-indigo-900/60 border-indigo-800/60 text-indigo-200'
                              : 'bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200/80 text-indigo-950'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs">Register as Business Partner</div>
                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate">
                              B2B wholesale pricing, staging & GST invoices
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {currentUser?.user_type === 'corporate' && (
                      <div className={`p-1 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <button
                          id="btn-switch-to-individual"
                          onClick={() => {
                            soundEffects.playClick();
                            setShowPersonaMenu(false);
                            if (setActiveRole) setActiveRole('individual');
                            window.location.hash = '';
                          }}
                          className={`w-full text-left p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                            currentTheme === 'dark'
                              ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-800/60 text-emerald-200'
                              : 'bg-rose-50/80 hover:bg-rose-100 border-rose-200/80 text-rose-950'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs">Switch to Individual Shopper (B2C)</div>
                            <div className="text-[10px] text-pink-700 dark:text-pink-300 truncate">
                              Boutique retail, flower boxes & living plants
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {currentUser?.user_type === 'admin' && (
                      <div className={`p-1 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-2 text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs">Super-Admin Authority</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                              Master Console & Platform Governance
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. INSTALL MOBILE APP (iOS / PWA) */}
                    <div className={`p-1 border-b mb-1 ${
                      currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                    }`}>
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          setShowPersonaMenu(false);
                          if (onOpenInstallPrompt) onOpenInstallPrompt();
                        }}
                        className={`w-full text-left p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                          currentTheme === 'dark'
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50 text-emerald-200'
                            : 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/80 text-emerald-950'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>Install Mobile App</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 rounded-full font-bold">iOS / PWA</span>
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                            Add to Home Screen without App Store
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* ADMIN CONSOLE SHORTCUT (WHEN BROWSING OUTSIDE ADMIN CONSOLE) */}
                    {isAdminUser && activeRole !== 'admin' && (
                      <div className={`p-1 border-b mb-1 ${
                        currentTheme === 'dark' ? 'border-slate-800' : 'border-stone-100'
                      }`}>
                        <button
                          onClick={() => {
                            soundEffects.playClick();
                            setShowPersonaMenu(false);
                            if (setActiveRole) setActiveRole('admin');
                            window.location.hash = 'admin';
                          }}
                          className={`w-full text-left p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                            activeRole === 'admin'
                              ? 'bg-emerald-900/20 border-emerald-700 text-emerald-800 dark:text-emerald-300'
                              : currentTheme === 'dark'
                              ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50 text-emerald-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs flex items-center justify-between">
                              <span>Admin Console</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-800 text-white rounded-full font-bold">Admin</span>
                            </div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                              Fresh flowers, delivery & sales analytics
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* 6. LOGOUT */}
                    <div className="p-1 pt-1">
                      <button
                        onClick={() => {
                          setShowPersonaMenu(false);
                          soundEffects.playClick();
                          onLogout();
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
