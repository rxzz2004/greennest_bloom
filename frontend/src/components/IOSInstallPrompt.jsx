import React, { useState, useEffect } from 'react';
import { 
  Share, 
  PlusSquare, 
  X, 
  Smartphone, 
  Sparkles, 
  Check, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

export default function IOSInstallPrompt({ forceOpen = false, onCloseManual }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isSafariBrowser, setIsSafariBrowser] = useState(true);
  const [isAlreadyStandalone, setIsAlreadyStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    // Check if running in standalone PWA mode
    const standalone = window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;

    // Check if browser is Safari
    const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

    setIsIOSDevice(isIOS);
    setIsSafariBrowser(isSafari);
    setIsAlreadyStandalone(standalone);

    // Manual trigger via prop
    if (forceOpen) {
      setIsVisible(true);
      return;
    }

    // If already installed and opened from Home Screen, do not prompt
    if (standalone) return;

    // Check dismissal cooldown (7 days)
    const dismissedAt = localStorage.getItem('gnb_pwa_ios_dismissed');
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (dismissedAt && (now - parseInt(dismissedAt, 10)) < SEVEN_DAYS) {
      return;
    }

    // Auto prompt on iOS after a brief pleasant delay
    if (isIOS) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleDismiss = (permanent = false) => {
    soundEffects.playClick();
    setIsVisible(false);
    if (permanent) {
      localStorage.setItem('gnb_pwa_ios_dismissed', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
    } else {
      localStorage.setItem('gnb_pwa_ios_dismissed', Date.now().toString());
    }
    if (onCloseManual) onCloseManual();
  };

  if (!isVisible && !forceOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-[#fdfcf9] dark:bg-slate-900 border border-emerald-900/20 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        
        {/* Decorative Top Emerald Floral Accent */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 px-5 py-4 text-white relative">
          <button
            onClick={() => handleDismiss(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5 pr-8">
            <img 
              src="/pink_lily_bloom.jpg" 
              alt="Green Nest Bloom Brand Logo" 
              className="w-13 h-13 rounded-2xl object-cover shadow-lg border border-amber-300/40 shrink-0" 
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                  iOS Mobile App
                </span>
                <span className="text-[10px] text-emerald-200">PWA Ready</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-white leading-tight mt-0.5">
                Install Green Nest Bloom
              </h3>
              <p className="text-xs text-emerald-200/90 font-sans">
                Full-screen app • Express ordering • Offline mode
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* If on iOS but not Safari */}
          {isIOSDevice && !isSafariBrowser && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
              <ExternalLink className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Open in Apple Safari</p>
                <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                  Apple requires Safari to add PWAs to your Home Screen. Please copy this URL and open it in Safari.
                </p>
              </div>
            </div>
          )}

          {/* 3 Step Visual Guide for iOS */}
          <div className="space-y-3 font-sans">
            
            {/* Step 1 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-700/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                <Share className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white flex items-center justify-between">
                  <span>1. Tap the Share Button</span>
                  <span className="text-[10px] font-normal text-stone-400">At bottom bar</span>
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                  In Safari, tap the <span className="font-semibold text-emerald-700 dark:text-emerald-400">Share [↑]</span> icon on your screen.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-700/80">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  2. Select "Add to Home Screen"
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                  Scroll down the share sheet and tap <span className="font-semibold text-stone-800 dark:text-stone-200">"Add to Home Screen"</span>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-700/80">
              <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white">
                  3. Tap "Add" in Top Right
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                  Green Nest Bloom will be instantly installed on your iPhone like a native app.
                </p>
              </div>
            </div>

          </div>

          {/* Benefits Bullet Points */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 dark:text-stone-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>No App Store needed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full-screen experience</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => handleDismiss(true)}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors font-medium"
            >
              Don't show again
            </button>

            <button
              onClick={() => handleDismiss(false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Got It</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
