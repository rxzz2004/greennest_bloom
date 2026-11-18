import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart, 
  RefreshCw,
  Sliders,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';

const FOCAL_PHOTO_MAP = {
  1: '/rose_bouquet_realistic.jpg',    // Dutch Red Velvet Roses
  2: '/lily_bouquet_realistic.jpg',    // Royal White Asiatic Lilies
  3: '/orchid_bouquet_realistic.jpg',  // Imperial Purple Orchids
  4: '/peony_bouquet_realistic.jpg'    // Blush Duchess Peonies
};

const SPREAD_TIERS = [
  { value: 0.8, label: 'Petite', diameter: 28, density: 'Compact Dome', multiplier: 0.8, desc: 'Tight, minimalist spherical bind' },
  { value: 1.0, label: 'Signature', diameter: 36, density: 'Classic Balance', multiplier: 1.0, desc: 'Harmonious artisan crown' },
  { value: 1.2, label: 'Lush', diameter: 44, density: 'Voluminous Canopy', multiplier: 1.35, desc: 'Expanded airy filler bloom density' },
  { value: 1.4, label: 'Grand Luxe', diameter: 52, density: 'Majestic Sprawl', multiplier: 1.7, desc: 'Expansive botanical foliage spread' }
];

export default function BouquetBuilder7Step({ onAddToCart, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [elements, setElements] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [config, setConfig] = useState({
    wrapping_id: 'matte_kraft',
    focal_flower_id: 1,
    focal_count: 7,
    filler_flower_id: 5,
    filler_count: 3,
    foliage_id: 8,
    foliage_count: 2,
    arrangement_style: 'dome_round',
    fragrance_id: 'rose_petal_mist',
    greeting_card_text: 'Wishing you boundless joy, blooming elegance, and everlasting love.',
    addons: ['calligraphy_wax_card']
  });

  // Fullness & spread factor (0.8 = Petite, 1.0 = Signature, 1.2 = Lush, 1.4 = Grand Luxe)
  const [spreadFactor, setSpreadFactor] = useState(1.0);

  const currentSpreadTier = SPREAD_TIERS.reduce((prev, curr) => 
    Math.abs(curr.value - spreadFactor) < Math.abs(prev.value - spreadFactor) ? curr : prev
  );

  const effectiveFillerCount = Math.max(0, Math.round(config.filler_count * currentSpreadTier.multiplier));
  const effectiveFoliageCount = Math.max(0, Math.round(config.foliage_count * currentSpreadTier.multiplier));

  const [bomPrice, setBomPrice] = useState({
    subtotal: 945.0,
    tax_gst_5: 47.25,
    total_price: 992.25,
    items_breakdown: []
  });

  // Fetch builder elements and presets
  useEffect(() => {
    async function loadElements() {
      try {
        const [elRes, preRes] = await Promise.all([
          api.getBouquetElements(),
          api.getBouquetPresets()
        ]);
        if (elRes.elements) setElements(elRes.elements);
        if (preRes.presets) setPresets(preRes.presets);
      } catch (err) {
        console.error('Failed to load bouquet elements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadElements();
  }, []);

  // Recalculate BOM Price when config or spread factor changes
  useEffect(() => {
    async function updateBOM() {
      try {
        const payload = {
          ...config,
          filler_count: effectiveFillerCount,
          foliage_count: effectiveFoliageCount
        };
        const res = await api.calculateBOM(payload);
        setBomPrice(res);
      } catch (err) {
        console.error('BOM calc error:', err);
      }
    }
    updateBOM();
  }, [config, spreadFactor]);

  // Load Preset
  const handleLoadPreset = (preset) => {
    setConfig({ ...config, ...preset.config });
  };

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'Wrapping' },
    { num: 2, title: 'Main Flowers' },
    { num: 3, title: 'Fillers' },
    { num: 4, title: 'Greenery' },
    { num: 5, title: 'Style' },
    { num: 6, title: 'Fragrance' },
    { num: 7, title: 'Note & Extras' }
  ];

  const handleAddToCart = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const activePhoto = FOCAL_PHOTO_MAP[config.focal_flower_id] || '/rose_bouquet_realistic.jpg';

    onAddToCart({
      id: `custom_bouquet_${Date.now()}`,
      name: `Custom Bouquet (${config.focal_count} Blooms, ${currentSpreadTier.label} Ø${currentSpreadTier.diameter}cm)`,
      base_price: bomPrice.total_price,
      effective_price: bomPrice.total_price,
      quantity: 1,
      is_perishable: true,
      category: 'cut_flower',
      image_url: activePhoto,
      custom_spec: {
        ...config,
        effective_filler_count: effectiveFillerCount,
        effective_foliage_count: effectiveFoliageCount,
        spread_tier: currentSpreadTier.label,
        spread_diameter_cm: currentSpreadTier.diameter,
        spread_factor: spreadFactor
      }
    });
    onClose();
  };

  const currentFocal = elements?.focal_flowers?.find((f) => f.id === config.focal_flower_id);
  const currentWrapping = elements?.wrappings?.find((w) => w.id === config.wrapping_id);
  const currentStyle = elements?.arrangement_styles?.find((s) => s.id === config.arrangement_style);
  const currentFragrance = elements?.fragrances?.find((f) => f.id === config.fragrance_id);
  const activeBouquetImage = FOCAL_PHOTO_MAP[config.focal_flower_id] || '/rose_bouquet_realistic.jpg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#fdfbf9] rounded-3xl max-w-5xl w-full shadow-2xl border border-rose-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header - Clean, Catchy, Luxury Rose Theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">Customise Your Bouquet</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1 rounded-md transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets Bar */}
        {presets.length > 0 && (
          <div className="bg-rose-50/70 px-6 py-2 border-b border-rose-100 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="font-semibold text-rose-800 text-[11px] flex items-center gap-1 shrink-0">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Presets:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className="px-3 py-1 rounded-full bg-white hover:bg-rose-100 text-stone-700 hover:text-rose-900 border border-rose-200 shrink-0 font-medium transition-all shadow-2xs"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {/* Step Navigation Tabs */}
        <div className="bg-white px-6 py-2.5 border-b border-stone-200/80 flex items-center justify-between overflow-x-auto gap-1">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                currentStep === s.num
                  ? 'bg-rose-500 text-white shadow-xs'
                  : currentStep > s.num
                  ? 'bg-rose-100 text-rose-800'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Builder Work Area: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          
          {/* Left Column: Interactive Step Controls */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto border-r border-stone-200/80">
            {loading || !elements ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* STEP 1: Wrapping */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">Choose Wrapping</h3>
                      <p className="text-xs text-stone-500">Select the artisan paper and presentation style for your bouquet.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {elements.wrappings?.map((wrap) => (
                        <div
                          key={wrap.id}
                          onClick={() => setConfig({ ...config, wrapping_id: wrap.id })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.wrapping_id === wrap.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="w-5 h-5 rounded-full border border-stone-300 shadow-inner" style={{ backgroundColor: wrap.color }}></span>
                            <span className="text-xs font-bold text-rose-700">+₹{wrap.price}</span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900">{wrap.name}</h4>
                          <p className="text-[11px] text-stone-500 mt-0.5">{wrap.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: Main Flowers */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">Select Main Flowers</h3>
                        <p className="text-xs text-stone-500">The centerpiece blooms that define your bouquet.</p>
                      </div>

                      <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setConfig({ ...config, focal_count: Math.max(1, config.focal_count - 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{config.focal_count} Stems</span>
                        <button
                          onClick={() => setConfig({ ...config, focal_count: Math.min(15, config.focal_count + 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {elements.focal_flowers?.map((focal) => (
                        <div
                          key={focal.id}
                          onClick={() => setConfig({ ...config, focal_flower_id: focal.id })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.focal_flower_id === focal.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: focal.color }}></span>
                            <span className="text-xs font-bold text-rose-700">₹{focal.unit_price}/stem</span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900">{focal.name}</h4>
                          <p className="text-[11px] italic text-stone-500 font-serif">{focal.botanical}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Secondary Fillers */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">Add Filler Flowers</h3>
                        <p className="text-xs text-stone-500">Delicate blooms that add soft texture and depth.</p>
                      </div>

                      <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setConfig({ ...config, filler_count: Math.max(0, config.filler_count - 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{config.filler_count} Stems</span>
                        <button
                          onClick={() => setConfig({ ...config, filler_count: Math.min(10, config.filler_count + 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {elements.filler_flowers?.map((filler) => (
                        <div
                          key={filler.id}
                          onClick={() => setConfig({ ...config, filler_flower_id: filler.id })}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.filler_flower_id === filler.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full block mb-1.5" style={{ backgroundColor: filler.color }}></span>
                          <h4 className="font-bold text-xs text-stone-900 truncate">{filler.name}</h4>
                          <span className="text-[11px] font-bold text-rose-700">₹{filler.unit_price}/stem</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Accent Greenery */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">Add Botanical Greenery</h3>
                        <p className="text-xs text-stone-500">Lush foliage creating organic flow and framing.</p>
                      </div>

                      <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setConfig({ ...config, foliage_count: Math.max(0, config.foliage_count - 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{config.foliage_count} Stems</span>
                        <button
                          onClick={() => setConfig({ ...config, foliage_count: Math.min(8, config.foliage_count + 1) })}
                          className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {elements.foliage?.map((leaf) => (
                        <div
                          key={leaf.id}
                          onClick={() => setConfig({ ...config, foliage_id: leaf.id })}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.foliage_id === leaf.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full block mb-1.5" style={{ backgroundColor: leaf.color }}></span>
                          <h4 className="font-bold text-xs text-stone-900 truncate">{leaf.name}</h4>
                          <span className="text-[11px] font-bold text-rose-700">₹{leaf.unit_price}/stem</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: Arrangement Style */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">Arrangement Style</h3>
                      <p className="text-xs text-stone-500">The overall shape and florist presentation style.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {elements.arrangement_styles?.map((style) => (
                        <div
                          key={style.id}
                          onClick={() => setConfig({ ...config, arrangement_style: style.id })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.arrangement_style === style.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-xs text-stone-900">{style.name}</h4>
                            <span className="text-xs font-bold text-rose-700">
                              {style.surcharge > 0 ? `+₹${style.surcharge}` : 'Included'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">{style.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 6: Fragrance */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">Fragrance Dew</h3>
                      <p className="text-xs text-stone-500">Pure botanical mist that hydrates petals and adds scent.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {elements.fragrances?.map((frag) => (
                        <div
                          key={frag.id}
                          onClick={() => setConfig({ ...config, fragrance_id: frag.id })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                            config.fragrance_id === frag.id
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-xs text-stone-900">{frag.name}</h4>
                            <span className="text-xs font-bold text-rose-700">
                              {frag.price > 0 ? `+₹${frag.price}` : 'Free'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">{frag.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 7: Card & Extras */}
                {currentStep === 7 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">Personal Note & Extras</h3>
                      <p className="text-xs text-stone-500">Add a heartfelt message and optional gifts.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Gift Card Message:</label>
                      <textarea
                        rows={3}
                        value={config.greeting_card_text}
                        onChange={(e) => setConfig({ ...config, greeting_card_text: e.target.value })}
                        className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-hidden font-serif"
                        placeholder="Write your personal message here..."
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-stone-700 mb-2">Luxury Add-ons:</span>
                      <div className="space-y-2">
                        {elements.add_ons?.map((addon) => {
                          const isSelected = config.addons.includes(addon.id);
                          return (
                            <div
                              key={addon.id}
                              onClick={() => {
                                const newAddons = isSelected
                                  ? config.addons.filter((id) => id !== addon.id)
                                  : [...config.addons, addon.id];
                                setConfig({ ...config, addons: newAddons });
                              }}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected ? 'border-rose-500 bg-rose-50/60 shadow-xs' : 'border-stone-200 bg-white hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="rounded text-rose-600 focus:ring-0 accent-rose-600 cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-stone-900">{addon.name}</span>
                              </div>
                              <span className="text-xs font-bold text-rose-700">+₹{addon.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep < 7 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                  className="flex items-center space-x-1 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add Bouquet to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Realistic Studio Bouquet Showcase & Price */}
          <div className="lg:col-span-5 p-6 bg-stone-50/70 flex flex-col justify-between space-y-4">
            
            {/* Visual Bouquet Showcase - Realistic Studio Photography */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-stone-200/90 shadow-md bg-gradient-to-b from-stone-100 to-stone-200/80 flex items-center justify-center">
                
                {/* Authentic Studio Bouquet Photograph - Stationary & Framed */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={activeBouquetImage} 
                    alt="Handcrafted Bouquet Preview"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Botanical Arrangement Canopy Spread Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div 
                    className="rounded-full border-2 border-dashed border-rose-300/80 transition-all duration-300 flex items-center justify-center"
                    style={{
                      width: `${Math.min(94, Math.max(52, (currentSpreadTier.diameter / 54) * 88))}%`,
                      height: `${Math.min(94, Math.max(52, (currentSpreadTier.diameter / 54) * 88))}%`,
                      boxShadow: `0 0 24px rgba(244, 63, 94, ${spreadFactor >= 1.2 ? 0.35 : 0.15})`
                    }}
                  >
                    <span className="bg-stone-900/85 backdrop-blur-md text-amber-200 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold shadow-md tracking-wider">
                      Ø {currentSpreadTier.diameter} cm Spread
                    </span>
                  </div>
                </div>

                {/* Top Artisan Seal Badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-br from-amber-700 to-rose-900 text-amber-100 text-[10px] font-serif font-bold px-2.5 py-1 rounded-full shadow-md border border-amber-300/40 flex items-center gap-1 backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Artisan Handcrafted</span>
                </div>

                {/* Fragrance Mist Badge if Infused */}
                {config.fragrance_id && config.fragrance_id !== 'unscented' && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-stone-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs border border-stone-200/60 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                    <span>{currentFragrance?.name || 'Scent Infused'}</span>
                  </div>
                )}

                {/* Floating Specs Pill at Bottom of Photo */}
                <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-white/60 shadow-lg text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 truncate">
                      {currentFocal?.name || 'Handcrafted Flowers'}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      {bomPrice.total_stem_count || (config.focal_count + effectiveFillerCount + effectiveFoliageCount)} Stems
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate flex items-center gap-1.5">
                    <span>{currentWrapping?.name || 'Matte Kraft Wrap'}</span>
                    <span>•</span>
                    <span className="text-rose-700 font-semibold">{currentSpreadTier.label} (Ø{currentSpreadTier.diameter}cm)</span>
                    <span>•</span>
                    <span>{currentStyle?.name || 'Classic Dome'}</span>
                  </p>
                </div>

                {/* Calligraphy Card Overlay on Step 7 */}
                {currentStep === 7 && config.greeting_card_text && (
                  <div className="absolute inset-4 bg-[#fdfbf7] rounded-xl shadow-2xl border border-amber-200/70 p-4 flex flex-col justify-between animate-fadeIn z-10">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <span className="font-serif italic text-xs text-amber-900 font-bold">Calligraphy Card</span>
                      <div className="w-5 h-5 rounded-full bg-rose-800 text-amber-200 text-[8px] font-serif font-bold flex items-center justify-center shadow-xs">
                        GNB
                      </div>
                    </div>
                    <p className="font-serif italic text-stone-800 text-xs leading-relaxed my-auto text-center px-2">
                      "{config.greeting_card_text}"
                    </p>
                    <div className="text-[9px] text-stone-400 text-center uppercase tracking-widest font-mono">
                      Hand-lettered with botanical ink
                    </div>
                  </div>
                )}

              </div>

              {/* Fullness & Spread Architecture Control */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-stone-700">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sliders className="w-3.5 h-3.5 text-rose-500" /> Fullness & Spread
                  </span>
                  <span className="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                    {(spreadFactor * 100).toFixed(0)}% • {currentSpreadTier.label}
                  </span>
                </div>

                {/* Preset Tier Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {SPREAD_TIERS.map((tier) => (
                    <button
                      key={tier.label}
                      type="button"
                      onClick={() => setSpreadFactor(tier.value)}
                      className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                        Math.abs(spreadFactor - tier.value) < 0.05
                          ? 'bg-rose-500 text-white font-bold border-rose-500 shadow-xs'
                          : 'bg-stone-50 hover:bg-rose-50 text-stone-600 border-stone-200 text-[11px]'
                      }`}
                    >
                      <div className="text-[11px] leading-tight">{tier.label}</div>
                      <div className="text-[9px] opacity-80">Ø{tier.diameter}cm</div>
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0.80"
                  max="1.40"
                  step="0.05"
                  value={spreadFactor}
                  onChange={(e) => setSpreadFactor(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />

                <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium pt-0.5">
                  <span>Petite (28cm)</span>
                  <span className="text-stone-700 italic">{currentSpreadTier.desc}</span>
                  <span>Grand (52cm)</span>
                </div>
              </div>
            </div>

            {/* Bouquet Price Summary */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Arrangement Summary</span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  {bomPrice.total_stem_count || 10} Stems
                </span>
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-stone-600 pr-1">
                {bomPrice.items_breakdown?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <span className="truncate pr-2">{item.item}</span>
                    <span className="font-mono font-medium text-stone-900 shrink-0">₹{item.cost}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{bomPrice.subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>GST (5% Floriculture)</span>
                  <span className="font-mono">₹{bomPrice.tax_gst_5}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-100">
                  <span>Total Price</span>
                  <span className="font-mono text-rose-700 text-base font-bold">₹{bomPrice.total_price}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
