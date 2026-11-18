import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Award, Leaf, Heart, Truck, CalendarCheck, Flower2 } from 'lucide-react';

export default function HeroBanner({ activeRole, onNavigateCustomizer, onNavigateStaging, onNavigateBatches }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-xl">
      {/* Background Decorative Floral Accents */}
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Headline */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium Floriculture & Botanical Nursery</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Artisan Floral Customization & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">Guaranteed Freshness</span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              From bespoke hand-tied bouquets and vibrant living indoor plants to full-scale luxury wedding decor. Experience fresh daily harvests, personalized styling, and reliable temperature-controlled delivery.
            </p>

            {/* Role-Specific CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              {activeRole === 'individual' && (
                <>
                  <button
                    onClick={onNavigateCustomizer}
                    className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Design Your Custom Bouquet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#catalog-section"
                    className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all"
                  >
                    <span>Explore Living Plants</span>
                  </a>
                </>
              )}

              {activeRole === 'corporate' && (
                <>
                  <button
                    onClick={onNavigateStaging}
                    className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Request Event Styling & Staging</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#catalog-section"
                    className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all"
                  >
                    <span>Wholesale Flowers & Planter Trays</span>
                  </a>
                </>
              )}

              {activeRole === 'admin' && (
                <>
                  <button
                    onClick={onNavigateBatches}
                    className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-sm shadow-lg shadow-emerald-400/20 transition-all"
                  >
                    <Clock className="w-4 h-4 text-stone-900" />
                    <span>Manage Flower Stock & Freshness</span>
                  </button>
                  <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-stone-900/80 px-4 py-3 rounded-xl border border-stone-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Store Management Active</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Customer Quality Promise Card */}
          <div className="lg:col-span-4">
            <div className="glass-panel-dark rounded-2xl p-6 border border-emerald-500/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-700/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Our Quality Promise
                </span>
                <span className="text-[11px] text-stone-400">Guaranteed Freshness</span>
              </div>

              <div className="space-y-3 text-xs text-stone-300">
                <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block">Guaranteed 5-Day Freshness</strong>
                    <span>Daily harvests cut directly from high-altitude polyhouses to ensure long-lasting blooms.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block">Personalized Floral Meaning</strong>
                    <span>Select flowers tailored to your exact emotions—celebration, romance, gratitude, or peace.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block">Refrigerated Express Delivery</strong>
                    <span>Specialized climate-controlled delivery vans ensure petals arrive crisp and hydrated.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/10">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block">Reserved Booking Protection</strong>
                    <span>We dedicate our master floral designers exclusively to your event date with zero double bookings.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
