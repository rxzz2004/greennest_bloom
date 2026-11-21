import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CatalogSection from './components/CatalogSection';
import BouquetBuilder7Step from './components/BouquetBuilder7Step';
import EventStagingEngine from './components/EventStagingEngine';
import SubscriptionManager from './components/SubscriptionManager';
import AdminConsole from './components/AdminConsole';
import CorporateDashboard from './components/CorporateDashboard';
import BloomIntroOverlay from './components/BloomIntroOverlay';
import CartAndCheckoutModal from './components/CartAndCheckoutModal';
import GSTInvoiceModal from './components/GSTInvoiceModal';
import LiveTrackingModal from './components/LiveTrackingModal';
import OccasionRemindersModal from './components/OccasionRemindersModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import LoginPage from './components/LoginPage';
import IndividualUserHome from './components/IndividualUserHome';
import WishlistModal from './components/WishlistModal';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import CourierPortal from './components/CourierPortal';
import { soundEffects } from './utils/audio';
import { api } from './api';

export default function App() {
  // Active User session from localStorage
  const [customUser, setCustomUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gnb_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Active Persona / Mode: 'individual' | 'corporate' | 'admin' (Strictly guarded by user_type)
  const [activeRole, setActiveRole] = useState(() => {
    let user = null;
    try {
      const saved = localStorage.getItem('gnb_active_user');
      user = saved ? JSON.parse(saved) : null;
    } catch (e) {}

    const hash = window.location.hash.toLowerCase();
    if (hash.includes('admin')) {
      return user?.user_type === 'admin' ? 'admin' : 'individual';
    }
    if (hash.includes('corporate') || hash.includes('business') || hash.includes('staging')) {
      return user?.user_type === 'corporate' ? 'corporate' : 'individual';
    }
    return user?.user_type === 'admin' ? 'admin' : user?.user_type === 'corporate' ? 'corporate' : 'individual';
  });

  // Corporate sub-tab: 'staging' (default - AI inpainting, paste, drag & drop) | 'wholesale' (crates & invoicing)
  const [corporateSubTab, setCorporateSubTab] = useState('staging');
  
  // Dedicated Courier / Delivery Partner Portal State
  const [isCourierPortalOpen, setIsCourierPortalOpen] = useState(() => {
    return window.location.hash.toLowerCase().includes('courier') || window.location.hash.toLowerCase().includes('driver');
  });

  // Dedicated Login Page View State
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    mode: 'login',
    userType: 'individual'
  });

  const handleOpenLogin = (config = {}) => {
    setAuthModalConfig({
      mode: config.mode || 'login',
      userType: config.userType || (customUser?.user_type === 'corporate' ? 'corporate' : 'individual')
    });
    setIsAuthModalOpen(true);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const saved = localStorage.getItem('gnb_active_user');
      return saved ? Boolean(JSON.parse(saved)) : false;
    } catch (e) {
      return false;
    }
  });

  // Theme state: 'light' | 'dark' | 'rose'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('gnb_theme');
    // For individual users, always default to 'rose'
    return saved || 'rose';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('dark', 'theme-light', 'theme-rose');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'rose') {
      document.documentElement.classList.add('theme-rose');
    } else {
      document.documentElement.classList.add('theme-light');
    }
    localStorage.setItem('gnb_theme', theme);
  }, [theme]);

  // Sync role with hash changes and enforce strict authorization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('corporate') || hash.includes('business') || hash.includes('staging')) {
        if (customUser?.user_type === 'corporate') {
          setActiveRole('corporate');
          setCorporateSubTab('staging');
        } else {
          // If not yet corporate, prompt business registration form
          soundEffects.playClick();
          handleOpenLogin({ mode: 'register', userType: 'corporate' });
          setActiveRole(customUser?.user_type === 'admin' ? 'admin' : 'individual');
          window.location.hash = '';
        }
      } else if (hash.includes('admin')) {
        if (customUser?.user_type === 'admin') {
          setActiveRole('admin');
        } else {
          // Strictly block non-admins
          soundEffects.playClick();
          alert('Access Denied: The Admin Console is restricted to authorized Green Nest Bloom Super-Admins.');
          setActiveRole(customUser?.user_type === 'corporate' ? 'corporate' : 'individual');
          window.location.hash = '';
        }
      } else if (hash.includes('individual') || hash.includes('subscription')) {
        setActiveRole('individual');
      }

      if (hash.includes('courier') || hash.includes('driver')) {
        setIsCourierPortalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [customUser]);

  // Global search query (Navbar search connects to CatalogSection)
  const [searchQuery, setSearchQuery] = useState('');

  // Realistic Pink Lily Blooming & Docking Animation State
  const [isBloomIntroActive, setIsBloomIntroActive] = useState(false);

  const currentUser = customUser;

  const handleLoginSuccess = (user) => {
    setCustomUser(user);
    try {
      localStorage.setItem('gnb_active_user', JSON.stringify(user));
    } catch (e) {}
    const role = user?.user_type || 'individual';
    setActiveRole(role);
    // When individual user logs in first, give them rose theme!
    if (role === 'individual') {
      setTheme('rose');
      localStorage.setItem('gnb_theme', 'rose');
    }
    setIsLoggedIn(true);
    setIsLoginPage(false);
    setIsAuthModalOpen(false);
    // Trigger the authentic pink lily blossoming & docking intro!
    setIsBloomIntroActive(true);
  };

  const handleLogout = () => {
    soundEffects.playClick();
    setCustomUser(null);
    try {
      localStorage.removeItem('gnb_active_user');
    } catch (e) {}
    setFavoritesList([]);
    setCartItems([]);
    setIsLoggedIn(false);
    setIsLoginPage(true);
    setIsBloomIntroActive(false);
  };

  // Global Products State
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  // User Subscription State
  const [userSubscription, setUserSubscription] = useState(null);

  const fetchUserSubscription = async (email) => {
    if (!email) {
      setUserSubscription(null);
      return;
    }
    try {
      const res = await api.getUserSubscriptions(email);
      if (res.subscriptions && res.subscriptions.length > 0) {
        setUserSubscription(res.subscriptions[0]);
      } else {
        setUserSubscription(null);
      }
    } catch (err) {
      console.error('Failed to load user subscription:', err);
    }
  };

  useEffect(() => {
    fetchUserSubscription(currentUser?.email);
  }, [currentUser?.email]);

  // Modals
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState(1);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(1);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isInstallPromptOpen, setIsInstallPromptOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState([]);

  // Helper to persist cart per user
  const saveCartForUser = (items) => {
    try {
      const userEmail = currentUser?.email || 'guest';
      localStorage.setItem(`gnb_cart_${userEmail}`, JSON.stringify(items));
    } catch (e) {}
  };

  // Sync favorites & cart whenever currentUser changes
  useEffect(() => {
    const userEmail = currentUser?.email || 'guest';
    
    // Clear legacy global key if it exists
    try { localStorage.removeItem('gnb_favorites'); } catch (e) {}

    const favKey = `gnb_favorites_${userEmail}`;
    let localFavs = [];
    try {
      const savedFavs = localStorage.getItem(favKey);
      localFavs = savedFavs ? JSON.parse(savedFavs) : [];
      setFavoritesList(localFavs);
    } catch (e) {
      setFavoritesList([]);
    }

    const cartKey = `gnb_cart_${userEmail}`;
    try {
      const savedCart = localStorage.getItem(cartKey);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
    } catch (e) {
      setCartItems([]);
    }

    // Connect to user's personal database wishlist if email is present
    if (currentUser?.email) {
      api.getWishlist(currentUser.email).then((res) => {
        if (res && Array.isArray(res.wishlist)) {
          if (res.wishlist.length > 0 || localFavs.length === 0) {
            setFavoritesList(res.wishlist);
            try {
              localStorage.setItem(favKey, JSON.stringify(res.wishlist));
            } catch (e) {}
          } else if (localFavs.length > 0) {
            // First time migration: sync local items to DB for this user
            api.syncWishlist(currentUser.email, localFavs);
          }
        }
      }).catch((err) => {
        console.log('Wishlist backend sync offline, using local state:', err);
      });
    }
  }, [currentUser?.email]);

  const handleToggleFavorite = (itemId) => {
    if (!isLoggedIn || !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    soundEffects.playClick();
    const userEmail = currentUser?.email || 'guest';
    setFavoritesList((prev) => {
      const updated = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      try {
        localStorage.setItem(`gnb_favorites_${userEmail}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.email) {
      api.toggleWishlist(currentUser.email, itemId).catch((err) => {
        console.error('Wishlist toggle API error:', err);
      });
    }
  };

  const handleClearWishlist = () => {
    soundEffects.playClick();
    const userEmail = currentUser?.email || 'guest';
    setFavoritesList([]);
    try {
      localStorage.setItem(`gnb_favorites_${userEmail}`, JSON.stringify([]));
    } catch (e) {}
    if (currentUser?.email) {
      api.clearWishlist(currentUser.email).catch((err) => {
        console.error('Wishlist clear API error:', err);
      });
    }
  };

  // Load products on mount
  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      if (res.products) setProducts(res.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Cart operations (supports both single product and array of products)
  const handleAddToCart = (productOrItems) => {
    if (!isLoggedIn || !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    soundEffects.playStemSnip();
    const itemsToAdd = Array.isArray(productOrItems) ? productOrItems : [productOrItems];
    setCartItems((prev) => {
      let updated = [...prev];
      itemsToAdd.forEach((product) => {
        const price = product.effective_price || product.base_price || product.price || product.inrPrice || 1250;
        const existingIndex = updated.findIndex((item) => item.id === product.id);
        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + (product.quantity || 1)
          };
        } else {
          updated.push({
            ...product,
            quantity: product.quantity || 1,
            base_price: price,
            effective_price: price
          });
        }
      });
      saveCartForUser(updated);
      return updated;
    });
    setIsCartOpen(true);
  };

  const handleOpenWishlist = () => {
    soundEffects.playClick();
    if (!isLoggedIn || !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsWishlistOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    soundEffects.playClick();
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      saveCartForUser(updated);
      return updated;
    });
  };

  const handleClearCart = () => {
    soundEffects.playClick();
    setCartItems([]);
    saveCartForUser([]);
  };

  const handleOrderSuccess = (order) => {
    soundEffects.playSuccessChime();
    setInvoiceOrderId(order.id);
    setTrackingOrderId(order.id);
    setIsInvoiceOpen(true);
  };

  // If Login Page is active, display the full-page LoginPage
  if (isLoginPage) {
    return (
      <LoginPage
        initialMode={authModalConfig.mode}
        initialUserType={authModalConfig.userType}
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={() => setIsLoginPage(false)}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : theme === 'rose' ? 'bg-[#fff8f9] text-stone-900' : 'bg-[#fcfbf9] text-stone-900'
    } font-sans selection:bg-pink-200`}>
      
      {/* Realistic Pink Lily Blossoming & Glide Docking Intro Overlay */}
      {isBloomIntroActive && (
        <BloomIntroOverlay
          onComplete={() => setIsBloomIntroActive(false)}
          targetElementId="brand-logo-anchor"
        />
      )}

      {/* Top Navigation */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        cartCount={cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenWishlist={handleOpenWishlist}
        onOpenInstallPrompt={() => setIsInstallPromptOpen(true)}
        wishlistCount={favoritesList.length}
        onOpenLiveTracking={() => {
          soundEffects.playClick();
          setTrackingOrderId(1);
          setIsTrackingOpen(true);
        }}
        unreadAlertsCount={2}
        onReplayIntro={() => setIsBloomIntroActive(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentTheme={theme}
        setTheme={setTheme}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        userSubscription={userSubscription}
        onNavigateSubscription={() => {
          setActiveRole('individual');
          window.dispatchEvent(new CustomEvent('nav-subscription'));
          window.location.hash = 'subscription';
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* ROLE VIEW: Individual (B2C) Consumer UI - Pastel Floral Boutique Aesthetic */}
        {activeRole === 'individual' && (
          <IndividualUserHome
            products={products}
            currentUser={currentUser}
            onOpenLogin={handleOpenLogin}
            userSubscription={userSubscription}
            onSubscriptionUpdated={(newSub) => {
              setUserSubscription(newSub);
              if (currentUser?.email) {
                fetchUserSubscription(currentUser.email);
              }
            }}
            onAddToCart={handleAddToCart}
            onSwitchToBusiness={() => {
              soundEffects.playClick();
              if (currentUser?.user_type === 'corporate') {
                setActiveRole('corporate');
                setCorporateSubTab('staging');
              } else {
                handleOpenLogin({ mode: 'register', userType: 'corporate' });
              }
            }}
            currentTheme={theme}
            onOpenBouquetCustomizer={() => {
              soundEffects.playClick();
              setIsCustomizerOpen(true);
            }}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenReminders={() => setIsRemindersOpen(true)}
            onOpenOrders={() => setIsOrdersOpen(true)}
            onOpenWishlist={handleOpenWishlist}
            onOpenLiveTracking={() => {
              soundEffects.playClick();
              setTrackingOrderId(1);
              setIsTrackingOpen(true);
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cartCount={cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
            favoritesList={favoritesList}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* ROLE VIEW: Corporate (B2B) Business Standards UI */}
        {activeRole === 'corporate' && (
          <div>
            {/* Corporate View Sub-Navigation: Staging Engine vs Wholesale Requisitions */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100 dark:border-indigo-950 sticky top-30 z-30 py-3 px-4 sm:px-6 lg:px-8 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="inline-flex p-1 rounded-xl bg-indigo-50 dark:bg-slate-800 gap-1 border border-indigo-100 dark:border-slate-700">
                    <button
                      id="tab-corporate-staging"
                      onClick={() => {
                        soundEffects.playClick();
                        setCorporateSubTab('staging');
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        corporateSubTab === 'staging'
                          ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-500/40'
                          : 'text-stone-600 dark:text-slate-300 hover:text-indigo-900 hover:bg-white/60'
                      }`}
                    >
                      <span>AI Venue Staging (Inpainting, Paste & Drag-Drop)</span>
                    </button>

                    <button
                      id="tab-corporate-wholesale"
                      onClick={() => {
                        soundEffects.playClick();
                        setCorporateSubTab('wholesale');
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        corporateSubTab === 'wholesale'
                          ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-500/40'
                          : 'text-stone-600 dark:text-slate-300 hover:text-indigo-900 hover:bg-white/60'
                      }`}
                    >
                      <span>Wholesale Stem Crates & Contracts</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-indigo-900 dark:text-indigo-300 font-semibold flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{currentUser?.company_name || 'Verified Corporate Partner'} • Priority Hospitality Staging</span>
                </div>
              </div>
            </div>

            {/* Render Selected Corporate Section */}
            {corporateSubTab === 'staging' ? (
              <div className="pt-4">
                <EventStagingEngine 
                  user={currentUser} 
                  currentTheme={theme}
                  onQuoteSubmitted={(quote) => {
                    console.log('Quote registered:', quote);
                  }}
                />
              </div>
            ) : (
              <div className="pt-4">
                <CorporateDashboard
                  user={currentUser}
                  currentTheme={theme}
                  products={products}
                  onAddToCart={handleAddToCart}
                  onOpenStaging={() => {
                    setCorporateSubTab('staging');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenInvoiceModal={(orderId) => {
                    setInvoiceOrderId(orderId);
                    setIsInvoiceOpen(true);
                  }}
                  onOpenLiveTrackingModal={(orderId) => {
                    setTrackingOrderId(orderId);
                    setIsTrackingOpen(true);
                  }}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
            )}

            <div className="border-t border-stone-200/80 pt-8">
              <CatalogSection
                products={products}
                activeRole={activeRole}
                onAddToCart={handleAddToCart}
                onOpenBouquetCustomizer={() => {
                  soundEffects.playClick();
                  setIsCustomizerOpen(true);
                }}
                externalSearchQuery={searchQuery}
              />
            </div>
          </div>
        )}

        {/* ROLE VIEW: Singleton Super-Admin (Strictly Guarded) */}
        {activeRole === 'admin' && (
          currentUser?.user_type === 'admin' ? (
            <AdminConsole
              currentTheme={theme}
              onProductsUpdated={loadProducts}
              onOpenLiveTrackingModal={(orderId) => {
                soundEffects.playClick();
                setTrackingOrderId(orderId);
                setIsTrackingOpen(true);
              }}
            />
          ) : (
            <div className="max-w-xl mx-auto my-16 p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-rose-950">
                Admin Console Access Restricted
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                The Green Nest Bloom Admin Console is restricted to authenticated Super-Administrators. Individual customer accounts cannot view backend dispatch, telemetry, or store financial metrics.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveRole('individual');
                    window.location.hash = '';
                  }}
                  className="px-4 py-2 bg-white text-stone-700 border border-stone-200 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Return to Florist Store
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    handleOpenLogin({ mode: 'login' });
                  }}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                >
                  Sign In as Admin
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Modals & Dialogs */}
      <BouquetBuilder7Step
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <CartAndCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => {
          soundEffects.playClick();
          setCartItems((prev) => {
            const updated = prev
              .map((item) =>
                item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
              )
              .filter((item) => item.quantity > 0);
            saveCartForUser(updated);
            return updated;
          });
        }}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        activeRole={activeRole}
        user={currentUser}
        onOrderSuccess={handleOrderSuccess}
      />

      <GSTInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        orderId={invoiceOrderId}
      />

      <LiveTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        orderId={trackingOrderId}
      />

      <OccasionRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        onQuickReorder={handleAddToCart}
      />

      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        currentUser={currentUser}
        onOpenInvoice={(orderId) => {
          setInvoiceOrderId(orderId);
          setIsInvoiceOpen(true);
        }}
        onOpenTracking={(orderId) => {
          setTrackingOrderId(orderId);
          setIsTrackingOpen(true);
        }}
        onReorder={handleAddToCart}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        favoritesList={favoritesList}
        onToggleFavorite={handleToggleFavorite}
        onClearWishlist={handleClearWishlist}
        onAddToCart={handleAddToCart}
        currentTheme={theme}
        products={products}
        currentUser={currentUser}
      />

      {/* iOS Progressive Web App Install Prompt / Guide */}
      <IOSInstallPrompt
        forceOpen={isInstallPromptOpen}
        onCloseManual={() => setIsInstallPromptOpen(false)}
      />

      {isAuthModalOpen && (
        <LoginPage
          isModal
          initialMode={authModalConfig.mode}
          initialUserType={authModalConfig.userType}
          onLoginSuccess={handleLoginSuccess}
          onBackToStore={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Dedicated Cold-Chain Courier Partner Portal Modal */}
      {isCourierPortalOpen && (
        <CourierPortal
          currentTheme={theme}
          onClose={() => {
            setIsCourierPortalOpen(false);
            if (window.location.hash.toLowerCase().includes('courier') || window.location.hash.toLowerCase().includes('driver')) {
              window.location.hash = '';
            }
          }}
        />
      )}

      {/* Modern Florist Footer */}
      <footer className="bg-stone-950 text-stone-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-800 text-xs mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800">
          <div className="md:col-span-2 space-y-2">
            <h4 className="font-serif text-lg font-bold text-white tracking-tight">
              Green Nest Bloom
            </h4>
            <p className="text-stone-400 max-w-md leading-relaxed text-xs">
              Artisan floriculture nursery, potted botanical cultivation, bespoke handcrafted bouquets, and luxury wedding & venue floral styling. Grown and harvested at our Mother Nursery in <strong>Kalmane, Thirthahalli, Karnataka 577432</strong> with damp-root gel packaging and nationwide refrigerated express delivery.
            </p>
            <div className="text-[11px] text-emerald-400 font-mono pt-1">
              Mother Nursery & Dispatch Hub: Kalmane, Thirthahalli, Karnataka 577432
            </div>
          </div>

          <div>
            <h5 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] mb-3">Shop & Customization</h5>
            <ul className="space-y-1.5 text-stone-400 text-xs">
              <li>Fresh Mountain Cut Blooms</li>
              <li>Potted Nursery & Air-Purifying Plants</li>
              <li>Interactive 7-Step Bouquet Studio</li>
              <li>Monthly Surprise Botanical Box</li>
              <li>Organic Plant Nutrition & Planters</li>
              <li>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setIsInstallPromptOpen(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors pt-1"
                >
                  <span>Install Mobile App (iOS / PWA)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setIsCourierPortalOpen(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors pt-0.5"
                >
                  <span>Cold-Chain Courier Portal</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] mb-3">Our Quality Promise</h5>
            <ul className="space-y-1.5 text-stone-400 text-xs">
              <li>5-Day Freshness Guarantee</li>
              <li>Wedding & Banquet Floral Styling</li>
              <li>3D Venue Theme Visualizer</li>
              <li>Nationwide Refrigerated Express Dispatch</li>
              <li>Clear Tax Invoicing & Online Support</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px]">
          <span>&copy; 2026 Green Nest Bloom Floriculture Pvt. Ltd. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
