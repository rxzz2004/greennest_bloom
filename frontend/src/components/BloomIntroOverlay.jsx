import React, { useEffect, useState, useRef } from 'react';
import { soundEffects } from '../utils/audio';
import { Sparkles, X } from 'lucide-react';

export default function BloomIntroOverlay({ onComplete, targetElementId = 'brand-logo-anchor' }) {
  // Animation phases: 'enter' | 'blooming' | 'hold' | 'docking' | 'completed'
  const [phase, setPhase] = useState('enter');
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1
  });
  const flowerRef = useRef(null);

  useEffect(() => {
    // Phase 1: Enter -> Closed bud appears centered (600ms)
    const timer1 = setTimeout(() => {
      setPhase('blooming');
      soundEffects.playBloomChime();
    }, 600);

    // Phase 2: Blossom Hold -> Fully bloomed Pink Lily (1900ms)
    const timer2 = setTimeout(() => {
      setPhase('hold');
    }, 1900);

    // Phase 3: Docking -> Fly, spin slowly, and shrink progressively down to the exact logo emblem point
    const timer3 = setTimeout(() => {
      // Find the exact logo emblem element (48px) rather than the whole wide navbar brand container
      const targetEl = 
        document.getElementById('brand-logo-emblem') || 
        document.getElementById(targetElementId)?.querySelector('#brand-logo-emblem') ||
        document.getElementById(targetElementId)?.querySelector('img') ||
        document.getElementById(targetElementId);

      const windowCenterX = window.innerWidth / 2;
      const windowCenterY = window.innerHeight / 2;

      let targetX = 0;
      let targetY = 0;
      let targetScale = 48 / 220; // ~0.218: shrinks from 220px to exactly 48px

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;
        targetX = targetCenterX - windowCenterX;
        targetY = targetCenterY - windowCenterY;
        targetScale = rect.width / 220;
      } else {
        // Fallback for default desktop navbar position
        targetX = -(windowCenterX - 48);
        targetY = -(windowCenterY - 40);
        targetScale = 48 / 220;
      }

      setCoords({
        x: targetX,
        y: targetY,
        scale: targetScale,
        rotation: 720, // 2 complete, graceful 360-degree rotations as it travels
        opacity: 1
      });
      setPhase('docking');
    }, 2700);

    // Phase 4: Completed -> Hand over smoothly to static navbar logo
    const timer4 = setTimeout(() => {
      setPhase('completed');
      soundEffects.playClick();
      if (onComplete) onComplete();
    }, 4150); // 2700ms + 1450ms smooth docking duration

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete, targetElementId]);

  // Handle manual skip
  const handleSkip = () => {
    setPhase('completed');
    if (onComplete) onComplete();
  };

  if (phase === 'completed') return null;

  const isDocking = phase === 'docking';
  const isBloomed = phase === 'blooming' || phase === 'hold' || phase === 'docking';

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden flex items-center justify-center transition-all duration-1000 ${
        isDocking 
          ? 'bg-stone-950/0 backdrop-blur-none pointer-events-none' 
          : 'bg-stone-950/92 backdrop-blur-xl pointer-events-auto'
      }`}
    >
      {/* Background Ambient Radial Glow */}
      <div 
        className={`absolute w-[600px] h-[600px] rounded-full filter blur-3xl pointer-events-none transition-all duration-1000 ${
          isBloomed 
            ? 'bg-gradient-to-tr from-pink-500/25 via-rose-500/20 to-amber-300/20 scale-125' 
            : 'bg-pink-950/30 scale-75'
        } ${isDocking ? 'opacity-0 scale-50' : 'opacity-100'}`}
      />

      {/* Ambient Water Ripples */}
      {!isDocking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[320px] h-[320px] rounded-full border border-pink-500/20 animate-ping opacity-30 [animation-duration:3s]" />
          <div className="w-[480px] h-[480px] rounded-full border border-rose-400/15 animate-ping opacity-20 [animation-duration:4s]" />
        </div>
      )}

      {/* Skip Button */}
      {!isDocking && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all duration-200 z-10"
        >
          <span>Skip Intro</span>
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Animated Lily Container - Perfectly centered at (0,0) */}
      <div
        ref={flowerRef}
        style={{
          transform: isDocking 
            ? `translate3d(${coords.x}px, ${coords.y}px, 0) scale(${coords.scale}) rotate(${coords.rotation}deg)` 
            : 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
          transition: isDocking 
            ? 'transform 1.45s cubic-bezier(0.25, 1, 0.35, 1), opacity 1.45s ease' 
            : 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'center center'
        }}
        className="relative z-20 flex items-center justify-center will-change-transform pointer-events-none"
      >
        {/* Flower Circular Emblem */}
        <div className={`relative w-[220px] h-[220px] rounded-full p-2 bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-500 border border-pink-200/50 flex items-center justify-center overflow-hidden transition-all duration-700 ${
          isDocking ? 'shadow-lg shadow-pink-500/25' : 'shadow-2xl shadow-pink-900/40'
        }`}>
          
          {/* Internal Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-radial from-pink-400/20 via-transparent to-transparent animate-pulse" />

          {/* Gentle Halo Ring when docking / blooming */}
          {isDocking && (
            <div className="absolute -inset-1 rounded-full border-2 border-pink-300/60 animate-spin [animation-duration:3s]" />
          )}

          {/* LAYER 1: Closed Dewy Pink Lily Bud */}
          <img
            src="/pink_lily_bud.jpg"
            alt="Pink Lily Bud"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-all duration-1000 transform ${
              isBloomed 
                ? 'opacity-0 scale-125 filter blur-xs' 
                : 'opacity-100 scale-100'
            }`}
          />

          {/* LAYER 2: Blossomed Pink Lily Flower */}
          <img
            src="/pink_lily_bloom.jpg"
            alt="Pink Lily Bloom"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-all duration-1000 transform ${
              isBloomed 
                ? 'opacity-100 scale-100 rotate-0' 
                : 'opacity-0 scale-75 -rotate-12'
            }`}
          />

          {/* Golden Stamen Particle Flash on Bloom */}
          {phase === 'blooming' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-amber-300/70 filter blur-md animate-ping" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Text Beneath - Positioned independently below the flower, smoothly fades out on docking */}
      <div 
        className={`absolute top-[calc(50%+130px)] left-0 right-0 text-center space-y-1.5 transition-all duration-500 transform pointer-events-none ${
          isDocking ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-md">
            Green Nest Bloom
          </h1>
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
        </div>
        <p className="text-xs uppercase tracking-widest font-semibold text-pink-200/80">
          Artisan Botanical Florist & Nursery
        </p>
        <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-stone-400">
          <span className="w-8 h-px bg-stone-700" />
          <span>{isBloomed ? 'Welcome to Bespoke Floral Elegance' : 'Awakening Fresh Mountain Blooms...'}</span>
          <span className="w-8 h-px bg-stone-700" />
        </div>
      </div>

    </div>
  );
}
