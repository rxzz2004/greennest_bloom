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
    // Phase 1: Enter -> Closed bud appears centered (250ms)
    const timer1 = setTimeout(() => {
      setPhase('blooming');
      soundEffects.playBloomChime();
    }, 250);

    // Phase 2: Blossom Hold -> Fully bloomed Pink Lily (1100ms)
    const timer2 = setTimeout(() => {
      setPhase('hold');
    }, 1100);

    // Phase 3: Docking -> Glide smoothly and land on navbar logo (1750ms)
    const timer3 = setTimeout(() => {
      const targetEl = 
        document.getElementById('brand-logo-emblem') || 
        document.getElementById(targetElementId)?.querySelector('#brand-logo-emblem') ||
        document.getElementById(targetElementId)?.querySelector('img') ||
        document.getElementById(targetElementId);

      const windowCenterX = window.innerWidth / 2;
      const windowCenterY = window.innerHeight / 2;

      let targetX = 0;
      let targetY = 0;
      let targetScale = 48 / 220; // shrinks from 220px to 48px

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;
        targetX = Math.round(targetCenterX - windowCenterX);
        targetY = Math.round(targetCenterY - windowCenterY);
        targetScale = rect.width / 220;
      } else {
        targetX = Math.round(-(windowCenterX - 48));
        targetY = Math.round(-(windowCenterY - 40));
        targetScale = 48 / 220;
      }

      setCoords({
        x: targetX,
        y: targetY,
        scale: targetScale,
        rotation: 360, // 1 graceful 360-degree rotation on GPU
        opacity: 1
      });
      setPhase('docking');
    }, 1750);

    // Phase 4: Completed -> Hand over smoothly to static navbar logo (2600ms)
    const timer4 = setTimeout(() => {
      setPhase('completed');
      soundEffects.playClick();
      if (onComplete) onComplete();
    }, 2600);

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
      onClick={handleSkip}
      className={`fixed inset-0 z-50 overflow-hidden flex items-center justify-center transition-opacity duration-700 ease-out ${
        isDocking 
          ? 'opacity-0 pointer-events-none' 
          : 'opacity-100 bg-stone-950/94 pointer-events-auto'
      }`}
      style={{ willChange: 'opacity' }}
    >
      {/* Background Ambient Radial Glow - Optimized GPU radial gradient */}
      <div 
        className={`absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-opacity duration-700 ${
          isDocking ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, rgba(225,29,72,0.1) 40%, transparent 70%)',
          willChange: 'opacity'
        }}
      />

      {/* Ambient Halo Ring */}
      {!isDocking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[340px] h-[340px] rounded-full border border-pink-400/20 animate-pulse-subtle" />
        </div>
      )}

      {/* Skip Button */}
      {!isDocking && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="absolute top-6 right-6 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors z-10 cursor-pointer"
        >
          <span>Skip Intro</span>
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Animated Lily Container - Hardware Accelerated GPU Layer */}
      <div
        ref={flowerRef}
        style={{
          transform: isDocking 
            ? `translate3d(${coords.x}px, ${coords.y}px, 0) scale(${coords.scale}) rotate(${coords.rotation}deg)` 
            : 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
          transition: isDocking 
            ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease-out' 
            : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        className="relative z-20 flex items-center justify-center pointer-events-none"
      >
        {/* Flower Circular Emblem */}
        <div className={`relative w-[220px] h-[220px] rounded-full p-2 bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-500 border border-pink-200/50 flex items-center justify-center overflow-hidden transition-shadow duration-500 ${
          isDocking ? 'shadow-md shadow-pink-500/25' : 'shadow-xl shadow-pink-900/40'
        }`}>
          
          {/* Internal Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-radial from-pink-400/20 via-transparent to-transparent pointer-events-none" />

          {/* LAYER 1: Closed Dewy Pink Lily Bud */}
          <img
            src="/pink_lily_bud.jpg"
            alt="Pink Lily Bud"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-600 ease-out transform ${
              isBloomed 
                ? 'opacity-0 scale-105' 
                : 'opacity-100 scale-100'
            }`}
            style={{ willChange: 'opacity, transform' }}
          />

          {/* LAYER 2: Blossomed Pink Lily Flower */}
          <img
            src="/pink_lily_bloom.jpg"
            alt="Pink Lily Bloom"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-600 ease-out transform ${
              isBloomed 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-90'
            }`}
            style={{ willChange: 'opacity, transform' }}
          />

          {/* Golden Stamen Particle Flash on Bloom */}
          {phase === 'blooming' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-amber-300/60 animate-ping" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Text Beneath - Smoothly fades out on docking */}
      <div 
        className={`absolute top-[calc(50%+130px)] left-0 right-0 text-center space-y-1.5 transition-opacity duration-400 pointer-events-none ${
          isDocking ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ willChange: 'opacity' }}
      >
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
            Green Nest Bloom
          </h1>
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
        </div>
        <p className="text-xs uppercase tracking-widest font-semibold text-pink-200/80">
          Artisan Botanical Florist &amp; Nursery
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
