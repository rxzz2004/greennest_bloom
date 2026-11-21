import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Sparkles, 
  Star, 
  Check, 
  Send, 
  MessageSquareHeart, 
  Clock, 
  Calendar, 
  Gift,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Truck,
  ArrowRight,
  Lock,
  RefreshCw,
  X,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Phone
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function SubscriptionManager({ 
  user, 
  currentTheme = 'rose',
  userSubscription,
  onSubscriptionUpdated 
}) {
  const [tiers, setTiers] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [selectedSubForFeedback, setSelectedSubForFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    delivery_cycle_month: 'September 2026',
    overall_rating: 5,
    freshness_rating: 5,
    variety_rating: 4,
    favorite_flowers: 'Dutch Red Roses & Asiatic Lilies',
    disliked_flowers: 'None, gorgeous mix',
    comments: 'The blooms arrived hydrated with damp botanical sponges from Kalmane nursery. Lasted 9 full days!'
  });
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Payment Checkout Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    mode: 'subscribe', // 'subscribe' | 'change'
    tier: null
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.address || 'Kalmane Main Road, Thirthahalli, Karnataka 577432'
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load tiers & subscriptions
  const loadData = async () => {
    try {
      const [tiersRes, subsRes] = await Promise.all([
        api.getSubscriptionTiers(),
        user?.email ? api.getUserSubscriptions(user.email) : Promise.resolve({ subscriptions: [] })
      ]);
      if (tiersRes.tiers) setTiers(tiersRes.tiers);
      if (subsRes && subsRes.subscriptions) {
        setActiveSubscriptions(subsRes.subscriptions);
      } else {
        setActiveSubscriptions([]);
      }
    } catch (err) {
      console.error('Subscription load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Sync address when user changes
  useEffect(() => {
    if (user?.address) {
      setDeliveryAddress(user.address);
    }
  }, [user]);

  // Determine current active subscription
  const currentSub = activeSubscriptions.find((s) => s.status === 'active') || userSubscription || null;
  const hasPaidActiveSub = !!currentSub;

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenPaymentModal = (mode, tier) => {
    soundEffects.playClick();
    setPaymentModal({
      isOpen: true,
      mode,
      tier
    });
    setPaymentSuccessData(null);
    setIsProcessingPayment(false);
    setPaymentStatusText('');
  };

  const handleClosePaymentModal = () => {
    if (isProcessingPayment) return;
    soundEffects.playClick();
    setPaymentModal({
      isOpen: false,
      mode: 'subscribe',
      tier: null
    });
    setPaymentSuccessData(null);
  };

  const handleExecutePayment = async () => {
    if (!paymentModal.tier) return;
    soundEffects.playClick();
    setIsProcessingPayment(true);

    const steps = [
      'Booking Cash on Delivery reservation...',
      'Registering subscription dispatch with Kalmane Nursery logistics...',
      'Allocating seasonal harvest quota at Kalmane Nursery...',
      paymentModal.mode === 'change' 
        ? 'Superseding prior tier & establishing new Cash on Delivery subscription...'
        : 'Activating monthly recurring fresh cut delivery schedule (Cash on Delivery)...'
    ];

    try {
      // Animate progress messages
      for (let i = 0; i < steps.length; i++) {
        setPaymentStatusText(steps[i]);
        await new Promise((r) => setTimeout(r, 450));
      }

      if (!user?.email) {
        alert('Please sign in or register to activate your floral subscription.');
        return;
      }

      let res;
      if (paymentModal.mode === 'change') {
        res = await api.changeSubscriptionPlan({
          user_email: user.email,
          tier: paymentModal.tier.tier,
          delivery_address: deliveryAddress
        });
      } else {
        res = await api.createSubscription({
          user_email: user.email,
          tier: paymentModal.tier.tier,
          delivery_address: deliveryAddress
        });
      }

      if (res.error) {
        throw new Error(res.error);
      }

      soundEffects.playSuccessChime();
      setPaymentSuccessData(res.subscription);
      
      // Update local state immediately
      setActiveSubscriptions([res.subscription]);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(res.subscription);
      }

      showToast(
        paymentModal.mode === 'change'
          ? `Plan changed to ${paymentModal.tier.name}! Cash on Delivery subscription confirmed.`
          : `Subscribed to ${paymentModal.tier.name}! Cash on Delivery subscription confirmed.`
      );

      // Auto close modal after showing success
      setTimeout(() => {
        handleClosePaymentModal();
      }, 1600);
    } catch (err) {
      alert(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your active floral subscription? You will lose early harvest allocations and will need to subscribe again to make future plan changes.')) {
      return;
    }
    soundEffects.playClick();
    setCancellingSub(true);
    if (!user?.email) return;
    try {
      await api.cancelSubscription({
        user_email: user.email
      });
      setActiveSubscriptions([]);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(null);
      }
      showToast('Your subscription has been cancelled. You can re-subscribe at any time.');
    } catch (err) {
      alert('Failed to cancel subscription.');
    } finally {
      setCancellingSub(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedSubForFeedback) return;
    try {
      await api.submitSubscriptionFeedback(selectedSubForFeedback.id, feedbackForm);
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setSelectedSubForFeedback(null);
      }, 2500);
    } catch (err) {
      alert('Error submitting feedback.');
    }
  };

  return (
    <section className="py-8 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto space-y-10">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-emerald-900/95 text-emerald-100 shadow-xl border border-emerald-700/60 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`text-left space-y-2 pb-6 border-b transition-colors ${
        currentTheme === 'dark'
          ? 'border-slate-800'
          : currentTheme === 'light'
          ? 'border-stone-200'
          : 'border-rose-200/70'
      }`}>
        <div className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider ${
          currentTheme === 'dark'
            ? 'text-cyan-400'
            : currentTheme === 'light'
            ? 'text-emerald-800'
            : 'text-rose-700'
        }`}>
          <Gift className="w-4 h-4" />
          <span>B2C Recurring Subscription Service</span>
        </div>
        <h2 className={`font-serif text-3xl sm:text-4xl font-bold ${
          currentTheme === 'dark'
            ? 'text-slate-100'
            : currentTheme === 'light'
            ? 'text-stone-900'
            : 'text-[#3b0718]'
        }`}>
          Monthly Surprise Flower Box & Harvest Curation
        </h2>
        <p className={`text-sm max-w-3xl leading-relaxed ${
          currentTheme === 'dark'
            ? 'text-slate-400'
            : currentTheme === 'light'
            ? 'text-stone-500'
            : 'text-[#6b213c]'
        }`}>
          Farm-fresh cut flowers harvested from our nursery at <strong>Kalmane, Thirthahalli, Karnataka</strong> and delivered with cold-water botanical hydration packs straight to your doorstep every 30 days. Only paid subscribers can modify or swap plans seamlessly.
        </p>
      </div>

      {/* ACTIVE SUBSCRIPTION STATUS BANNER */}
      {hasPaidActiveSub ? (
        <div className={`rounded-3xl p-6 sm:p-7 border space-y-5 shadow-sm transition-colors relative overflow-hidden ${
          currentTheme === 'dark'
            ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-700/80 text-slate-100'
            : currentTheme === 'light'
            ? 'bg-gradient-to-r from-emerald-50/90 via-stone-50 to-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-rose-50/95 via-stone-50 to-rose-50/80 border-rose-200 text-[#4c0519]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${
                currentTheme === 'dark'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Active Paid Membership
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                    ✓ Verified Paid
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold">
                  {currentSub.tier === 'basic'
                    ? 'Botanical Blossom Box'
                    : currentSub.tier === 'luxury'
                    ? 'Imperial Grandeur Showcase'
                    : 'Artisan Floral Curated Suite'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSelectedSubForFeedback(currentSub)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  currentTheme === 'dark'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : currentTheme === 'light'
                    ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    : 'bg-rose-700 hover:bg-rose-800 text-white'
                }`}
              >
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>Rate Last Delivery</span>
              </button>

              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSub}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-slate-700 transition-colors"
              >
                {cancellingSub ? 'Cancelling...' : 'Cancel Plan'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-stone-200/60 dark:border-slate-800">
            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Next Harvest Cycle</span>
                <strong className="text-sm font-semibold">{currentSub.next_delivery_date || 'In 30 Days'}</strong>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Truck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Origin & Nursery Hub</span>
                <strong className="text-xs truncate block font-medium">Kalmane, Thirthahalli (Karnataka)</strong>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Delivery Address</span>
                <strong className="text-xs truncate block font-medium">{currentSub.delivery_address || user?.address || 'Kalmane, Thirthahalli'}</strong>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-2xl flex items-center justify-between text-xs ${
            currentTheme === 'dark' ? 'bg-slate-800/60 text-slate-300' : 'bg-white/80 text-stone-700'
          }`}>
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>You are an active paid subscriber! You can change your plan anytime below.</span>
            </span>
            <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
              ₹{currentSub.monthly_price}/month
            </span>
          </div>
        </div>
      ) : (
        /* UNPAID / NON-SUBSCRIBED USER BANNER */
        <div className={`rounded-3xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
          currentTheme === 'dark'
            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
            : currentTheme === 'light'
            ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
            : 'bg-rose-50/60 border-rose-200/80 text-rose-950'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs">No Active Subscription</div>
              <p className="text-[11px] opacity-80">
                Choose a plan below and complete payment to activate your monthly floral deliveries. Plan modification unlocks once subscribed.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-700 shrink-0">
            Payment Required to Subscribe
          </div>
        </div>
      )}

      {/* Subscription Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {tiers.map((t) => {
          const isCurrentTier = hasPaidActiveSub && currentSub?.tier === t.tier;
          const isPremium = t.tier === 'premium';
          
          return (
            <div 
              key={t.tier}
              id={`subscription-card-${t.tier}`}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                isCurrentTier
                  ? currentTheme === 'dark'
                    ? 'bg-[#112038] text-slate-100 border-2 border-emerald-400/80 shadow-xl ring-2 ring-emerald-500/20'
                    : 'bg-white text-stone-900 border-2 border-emerald-500 shadow-xl ring-2 ring-emerald-500/15'
                  : isPremium
                  ? currentTheme === 'dark'
                    ? 'bg-gradient-to-b from-[#0f172a] via-[#111c33] to-[#090d16] text-white shadow-2xl scale-102 border-2 border-cyan-400/60 ring-2 ring-cyan-500/20'
                    : currentTheme === 'light'
                    ? 'bg-gradient-to-b from-emerald-950 to-stone-900 text-white shadow-2xl scale-102 border-2 border-emerald-400/40'
                    : 'bg-gradient-to-b from-[#4c0519] via-[#3b0718] to-[#24030d] text-white shadow-2xl scale-102 border-2 border-rose-400/50 shadow-rose-950/25'
                  : currentTheme === 'dark'
                  ? 'bg-[#131d31] text-slate-100 border border-slate-700/80 shadow-lg'
                  : currentTheme === 'light'
                  ? 'bg-white text-stone-800 border border-stone-200/90 shadow-md'
                  : 'bg-white text-[#3b0718] border border-rose-200/90 shadow-md shadow-rose-500/5'
              }`}
            >
              {isCurrentTier ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-white font-black text-[10px] uppercase tracking-wider bg-emerald-600 shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Current Active Plan
                </div>
              ) : isPremium ? (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-md ${
                  currentTheme === 'dark'
                    ? 'bg-gradient-to-r from-cyan-400 to-indigo-400'
                    : currentTheme === 'light'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : 'bg-gradient-to-r from-rose-400 to-pink-300'
                }`}>
                  Most Loved by Florists
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <h3 className={`font-serif text-2xl font-bold ${
                    isPremium && !isCurrentTier ? 'text-white' : currentTheme === 'dark' ? 'text-white' : currentTheme === 'light' ? 'text-stone-900' : 'text-[#3b0718]'
                  }`}>
                    {t.name}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isPremium && !isCurrentTier ? 'text-stone-200' : currentTheme === 'dark' ? 'text-slate-400' : currentTheme === 'light' ? 'text-stone-500' : 'text-[#6b213c]'
                  }`}>
                    {t.description}
                  </p>
                </div>

                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-bold font-serif">₹{t.monthly_price}</span>
                  <span className={`text-xs ${
                    isPremium && !isCurrentTier ? 'text-stone-300' : currentTheme === 'dark' ? 'text-slate-400' : currentTheme === 'light' ? 'text-stone-500' : 'text-[#8c4d62]'
                  }`}>
                    / month
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                  isCurrentTier
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : isPremium
                    ? currentTheme === 'dark'
                      ? 'bg-cyan-950/80 border border-cyan-500/30 text-cyan-300'
                      : currentTheme === 'light'
                      ? 'bg-emerald-900/60 border border-emerald-400/30 text-emerald-300'
                      : 'bg-rose-950/80 border border-rose-400/30 text-rose-200'
                    : currentTheme === 'dark'
                    ? 'bg-slate-800/80 border border-slate-700 text-cyan-400'
                    : currentTheme === 'light'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border border-rose-100 text-rose-800'
                }`}>
                  {t.stem_count}
                </div>

                <ul className="space-y-2.5 text-xs pt-2">
                  {(t.includes || []).map((item, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Check className={`w-4 h-4 shrink-0 ${
                        isCurrentTier
                          ? 'text-emerald-500'
                          : isPremium
                          ? currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-400' : 'text-rose-300'
                          : currentTheme === 'dark' ? 'text-cyan-400' : currentTheme === 'light' ? 'text-emerald-700' : 'text-rose-600'
                      }`} />
                      <span className={isPremium && !isCurrentTier ? 'text-stone-100' : currentTheme === 'dark' ? 'text-slate-300' : 'text-stone-700'}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACTION BUTTON AREA */}
              <div className="pt-8">
                {isCurrentTier ? (
                  <div className="space-y-1.5">
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-bold cursor-default bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Current Plan (Paid & Active)</span>
                    </button>
                    <p className="text-[10px] text-center text-stone-500 dark:text-slate-400">
                      Auto-renews next harvest cycle
                    </p>
                  </div>
                ) : hasPaidActiveSub ? (
                  // USER IS ACTIVE PAID SUBSCRIBER: ALLOW CHANGING PLAN VIA PAYMENT
                  <button
                    id={`btn-change-plan-${t.tier}`}
                    onClick={() => handleOpenPaymentModal('change', t)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isPremium
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
                        : currentTheme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-cyan-300 border border-slate-600'
                        : currentTheme === 'light'
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    <span>Subscribe / Switch to {t.name.split(' ')[0]}</span>
                    <span className="opacity-75 font-mono">(₹{t.monthly_price}/mo)</span>
                  </button>
                ) : (
                  // USER IS UNPAID / NOT SUBSCRIBED: MUST PAY TO SUBSCRIBE FIRST
                  <button
                    id={`btn-subscribe-${t.tier}`}
                    onClick={() => handleOpenPaymentModal('subscribe', t)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 ${
                      isPremium
                        ? currentTheme === 'dark'
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-stone-950 shadow-cyan-400/20'
                          : currentTheme === 'light'
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 shadow-emerald-400/20'
                          : 'bg-rose-400 hover:bg-rose-300 text-stone-950 shadow-rose-400/20'
                        : currentTheme === 'dark'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : currentTheme === 'light'
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    <span>Subscribe & Pay</span>
                    <span className="opacity-80 font-mono">₹{t.monthly_price}/mo</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUBSCRIPTION & PLAN-CHANGE PAYMENT MODAL */}
      {paymentModal.isOpen && paymentModal.tier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-slate-750 relative animate-in zoom-in-95 duration-200 text-stone-900 dark:text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2.5 rounded-2xl ${
                  paymentModal.mode === 'change'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {paymentModal.mode === 'change' ? <RefreshCw className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    {paymentModal.mode === 'change' ? 'Change Subscription Plan' : 'Confirm Subscription & Pay'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    {paymentModal.mode === 'change'
                      ? `Switching to ${paymentModal.tier.name}`
                      : 'Secure recurring checkout for monthly flower delivery'}
                  </p>
                </div>
              </div>

              {!isProcessingPayment && (
                <button 
                  onClick={handleClosePaymentModal}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Payment Processing State */}
            {isProcessingPayment ? (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full border-4 border-pink-500/20 border-t-pink-600 animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base">Processing Secure Payment...</h4>
                  <p className="text-xs text-pink-600 dark:text-pink-400 font-mono animate-pulse">
                    {paymentStatusText || 'Communicating with banking gateway...'}
                  </p>
                </div>
                <p className="text-[11px] text-stone-400">Please do not close or refresh this tab.</p>
              </div>
            ) : paymentSuccessData ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="font-serif text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  Payment Verified & Plan Activated!
                </h4>
                <p className="text-xs text-stone-600 dark:text-slate-300">
                  Your subscription to <strong>{paymentModal.tier.name}</strong> is now live. First delivery arrives in damp botanical wraps from our Kalmane nursery.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4 text-xs">
                
                {/* Plan Info Preview */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Selected Tier</span>
                    <strong className="text-sm font-bold text-stone-900 dark:text-slate-100">{paymentModal.tier.name}</strong>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 block">{paymentModal.tier.stem_count}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Monthly Price</span>
                    <strong className="text-lg font-bold font-serif text-pink-600 dark:text-pink-400">₹{paymentModal.tier.monthly_price}</strong>
                    <span className="text-[10px] text-stone-400 block">per month</span>
                  </div>
                </div>

                {/* Dispatch Origin Notice */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start space-x-2.5">
                  <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-emerald-950 dark:text-emerald-300 block">
                      Direct Kalmane Nursery Dispatch
                    </strong>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-snug">
                      Stems are cut, soaked in botanical conditioning gel, and dispatched from <strong>Kalmane, Thirthahalli, Karnataka 577432</strong> directly to your address.
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="font-bold text-stone-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      Delivery Destination Address:
                    </span>
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-pink-500/20 focus:outline-hidden"
                    placeholder="Enter complete shipping address with pincode..."
                  />
                </div>

                {/* Cash on Delivery Policy Notice */}
                <div>
                  <label className="font-bold text-stone-700 dark:text-slate-300 mb-1.5 block">
                    Payment Method:
                  </label>
                  <div className="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <strong className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100">Cash on Delivery (COD) Only</strong>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[10px] uppercase">
                          Official Policy
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                    <p className="text-xs text-stone-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                      All products and subscriptions will have cash on delivery only. There will not be any QR code, credit card, or online payment done on this website. Simply pay cash to our refrigerated cold-chain courier upon receiving your fresh stems.
                    </p>
                  </div>
                </div>

                {/* Direct Owner/Admin Contact Notice */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-amber-950 dark:text-amber-200 font-bold">
                    <Phone className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400 shrink-0" />
                    <span>Need Help or Have Queries?</span>
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                    For any queries, please contact the owner/admin: <strong>Mr Vikith Fernandes</strong>, Contact no:{' '}
                    <a href="tel:7349413826" className="font-bold underline text-amber-950 dark:text-amber-200 hover:text-emerald-700">
                      7349413826
                    </a>
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between text-stone-600 dark:text-slate-400">
                    <span>Monthly Subscription Fee:</span>
                    <span>₹{paymentModal.tier.monthly_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-slate-400">
                    <span>Kalmane White-Glove Dispatch:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE (₹0.00)</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-slate-400">
                    <span>Flower Conditioning Pack & Food:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE (₹0.00)</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 dark:border-slate-700 flex justify-between font-bold text-sm text-stone-900 dark:text-slate-100">
                    <span>Total Due Now:</span>
                    <span className="text-pink-600 dark:text-pink-400">₹{paymentModal.tier.monthly_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    className="px-4 py-2.5 rounded-xl font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-pay-subscription-btn"
                    type="button"
                    onClick={handleExecutePayment}
                    className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md shadow-pink-600/20 flex items-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Subscription • Cash on Delivery (₹{paymentModal.tier.monthly_price})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Delivery Feedback Modal */}
      {selectedSubForFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-slate-750 relative animate-in fade-in zoom-in-95 duration-200 text-stone-900 dark:text-slate-100">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
              <div>
                <h3 className="font-serif text-xl font-bold">Subscriber Feedback Loop</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">Your feedback steers our next month's flower harvest from Kalmane.</p>
              </div>
              <button 
                onClick={() => setSelectedSubForFeedback(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center space-y-2">
                <Check className="w-10 h-10 text-emerald-600 mx-auto bg-emerald-100 dark:bg-emerald-950 rounded-full p-2" />
                <h4 className="font-bold text-stone-900 dark:text-white">Thank You for Your Feedback!</h4>
                <p className="text-xs text-stone-500 dark:text-slate-400">Your ratings have been routed to the Kalmane super-admin curation board.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="py-4 space-y-4 text-xs">
                {/* Rating bars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-700 dark:text-slate-300">Stem Freshness & Vase Longevity:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackForm({ ...feedbackForm, freshness_rating: star })}
                          className={`p-1 ${star <= feedbackForm.freshness_rating ? 'text-amber-500' : 'text-stone-300 dark:text-slate-600'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-700 dark:text-slate-300">Arrangement & Species Variety:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackForm({ ...feedbackForm, variety_rating: star })}
                          className={`p-1 ${star <= feedbackForm.variety_rating ? 'text-amber-500' : 'text-stone-300 dark:text-slate-600'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-slate-300 mb-1">Which flowers did you adore most?</label>
                  <input
                    type="text"
                    value={feedbackForm.favorite_flowers}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, favorite_flowers: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    placeholder="e.g. Dutch Red Roses, Eucalyptus..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-slate-300 mb-1">Any varieties to send less often?</label>
                  <input
                    type="text"
                    value={feedbackForm.disliked_flowers}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, disliked_flowers: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    placeholder="e.g. Yellow Carnations..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-slate-300 mb-1">Comments for the Nursery Artisan:</label>
                  <textarea
                    rows={2}
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubForFeedback(null)}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-slate-400 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Curation Board</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
