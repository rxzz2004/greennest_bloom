import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart, 
  RefreshCw,
  Heart,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';

const FOCAL_PHOTO_MAP = {
  1: '/rose_bouquet_realistic.jpg',    // Dutch Red Velvet Roses
  2: '/lily_bouquet_realistic.jpg',    // Royal White Asiatic Lilies
  3: '/orchid_bouquet_realistic.jpg',  // Imperial Purple Orchids
  4: '/peony_bouquet_realistic.jpg'    // Blush Duchess Peonies
};

export default function BouquetBuilder7Step({ onAddToCart, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [elements, setElements] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState('options'); // 'options' | 'preview'

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

  // Recalculate BOM Price when config changes
  useEffect(() => {
    async function updateBOM() {
      try {
        const res = await api.calculateBOM(config);
        setBomPrice(res);
      } catch (err) {
        console.error('BOM calc error:', err);
      }
    }
    updateBOM();
  }, [config]);

  // Load Preset
  const handleLoadPreset = (preset) => {
    setConfig({ ...config, ...preset.config });
    setMobileTab('options');
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
      name: `Custom Bouquet (${config.focal_count} Blooms, ${currentStyle?.name || 'Classic Dome'})`,
      base_price: bomPrice.total_price,
      effective_price: bomPrice.total_price,
      quantity: 1,
      is_perishable: true,
      category: 'cut_flower',
      image_url: activePhoto,
      custom_spec: {
        ...config
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-[#fdfbf9] sm:rounded-3xl max-w-5xl w-full shadow-2xl border-0 sm:border border-rose-200/80 overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">
        
        {/* Top Header - Clean, Catchy, Luxury Rose Theme */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-xl font-bold tracking-wide leading-tight">Customise Your Bouquet</h2>
              <p className="text-[10px] sm:hidden text-rose-100 font-sans">Step {currentStep} of 7 • {steps[currentStep - 1]?.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets Bar */}
        {presets.length > 0 && (
          <div className="bg-rose-50/70 px-4 sm:px-6 py-2 border-b border-rose-100 flex items-center space-x-2 overflow-x-auto text-xs shrink-0 scrollbar-none">
            <span className="font-semibold text-rose-800 text-[11px] flex items-center gap-1 shrink-0">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Presets:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-white hover:bg-rose-100 text-stone-700 hover:text-rose-900 border border-rose-200 shrink-0 text-[11px] sm:text-xs font-medium transition-all shadow-2xs cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {/* Step Navigation Tabs */}
        <div className="bg-white px-3 sm:px-6 py-2 border-b border-stone-200/80 flex items-center overflow-x-auto gap-1.5 shrink-0 scrollbar-none">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => {
                setCurrentStep(s.num);
                setMobileTab('options');
              }}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                currentStep === s.num
                  ? 'bg-rose-500 text-white shadow-xs'
                  : currentStep > s.num
                  ? 'bg-rose-100 text-rose-800'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/10 flex items-center justify-center text-[9px] sm:text-[10px]">
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Mobile View Segmented Toggle (Hidden on lg desktop screens) */}
        <div className="lg:hidden bg-stone-100/90 px-3 py-1.5 border-b border-stone-200/80 shrink-0">
          <div className="grid grid-cols-2 p-0.5 bg-stone-200/70 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileTab('options')}
              className={`py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'options'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Step {currentStep} Options</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'preview'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-rose-500" />
              <span>Bouquet Preview</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md font-bold">
                ₹{bomPrice.total_price}
              </span>
            </button>
          </div>
        </div>

        {/* Builder Work Area: Robust Dual-Column Layout with min-h-0 */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:grid lg:grid-cols-12">
          
          {/* Left Column: Interactive Step Controls (Full width on mobile when options tab is active) */}
          <div className={`flex-1 min-h-0 flex flex-col lg:col-span-7 lg:border-r lg:border-stone-200/80 ${
            mobileTab === 'options' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* Scrollable Options Content Area */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              
              {/* Mobile Quick Preview Bar */}
              <div className="lg:hidden flex items-center justify-between bg-gradient-to-r from-rose-50/90 to-pink-50/80 rounded-2xl p-2.5 border border-rose-200/70 shadow-2xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img 
                    src={activeBouquetImage} 
                    alt="Bouquet Thumbnail" 
                    className="w-10 h-10 rounded-xl object-cover border border-rose-200 shadow-2xs shrink-0" 
                  />
                  <div className="min-w-0 truncate">
                    <h5 className="text-xs font-bold text-stone-900 truncate">
                      {currentFocal?.name || 'Custom Bouquet'}
                    </h5>
                    <p className="text-[10px] text-stone-500 truncate">
                      {bomPrice.total_stem_count || (config.focal_count + config.filler_count + config.foliage_count)} stems • {currentWrapping?.name || 'Wrap'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-[11px] font-bold shadow-2xs hover:bg-rose-50 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Photo</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {loading || !elements ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* STEP 1: Wrapping */}
                  {currentStep === 1 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Choose Wrapping</h3>
                        <p className="text-xs text-stone-500">Select the artisan paper and presentation style for your bouquet.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                              <span className="w-5 h-5 rounded-full border border-stone-300 shadow-inner shrink-0" style={{ backgroundColor: wrap.color }}></span>
                              <span className="text-xs font-bold text-rose-700">+₹{wrap.price}</span>
                            </div>
                            <h4 className="font-bold text-xs text-stone-900">{wrap.name}</h4>
                            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{wrap.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Main Flowers */}
                  {currentStep === 2 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Select Main Flowers</h3>
                          <p className="text-xs text-stone-500">The centerpiece blooms that define your bouquet.</p>
                        </div>

                        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => setConfig({ ...config, focal_count: Math.max(1, config.focal_count - 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-2">{config.focal_count} Stems</span>
                          <button
                            onClick={() => setConfig({ ...config, focal_count: Math.min(15, config.focal_count + 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                              <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: focal.color }}></span>
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
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Add Filler Flowers</h3>
                          <p className="text-xs text-stone-500">Delicate blooms that add soft texture and depth.</p>
                        </div>

                        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => setConfig({ ...config, filler_count: Math.max(0, config.filler_count - 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-2">{config.filler_count} Stems</span>
                          <button
                            onClick={() => setConfig({ ...config, filler_count: Math.min(10, config.filler_count + 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
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
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Add Botanical Greenery</h3>
                          <p className="text-xs text-stone-500">Lush foliage creating organic flow and framing.</p>
                        </div>

                        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => setConfig({ ...config, foliage_count: Math.max(0, config.foliage_count - 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold px-2">{config.foliage_count} Stems</span>
                          <button
                            onClick={() => setConfig({ ...config, foliage_count: Math.min(8, config.foliage_count + 1) })}
                            className="w-7 h-7 rounded-lg bg-white shadow-xs text-stone-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
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
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Arrangement Style</h3>
                        <p className="text-xs text-stone-500">The overall shape and florist presentation style.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                            <p className="text-[11px] text-stone-500 leading-snug">{style.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Fragrance */}
                  {currentStep === 6 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Fragrance Dew</h3>
                        <p className="text-xs text-stone-500">Pure botanical mist that hydrates petals and adds scent.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                            <p className="text-[11px] text-stone-500 leading-snug">{frag.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 7: Card & Extras */}
                  {currentStep === 7 && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">Personal Note & Extras</h3>
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
            </div>

            {/* Sticky Navigation Footer for Options */}
            <div className="shrink-0 p-3 sm:p-4 bg-white/95 backdrop-blur-xs border-t border-stone-200 flex items-center justify-between gap-2 shadow-xs">
              <button
                disabled={currentStep === 1}
                onClick={() => {
                  setCurrentStep((prev) => Math.max(1, prev - 1));
                  setMobileTab('options');
                }}
                className="flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-center sm:hidden">
                <span className="text-[10px] text-stone-400 block leading-none">Total</span>
                <span className="text-xs font-bold text-rose-700 font-mono">₹{bomPrice.total_price}</span>
              </div>

              {currentStep < 7 ? (
                <button
                  onClick={() => {
                    setCurrentStep((prev) => Math.min(7, prev + 1));
                    setMobileTab('options');
                  }}
                  className="flex items-center space-x-1 px-4 sm:px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Realistic Studio Bouquet Showcase & Price (Full width on mobile when preview tab is active) */}
          <div 
            className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-stone-50/70 flex flex-col justify-between space-y-4 lg:col-span-5 ${
              mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            
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

                {/* Top Artisan Seal Badge */}
                <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 bg-gradient-to-br from-amber-700 to-rose-900 text-amber-100 text-[9px] sm:text-[10px] font-serif font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md border border-amber-300/40 flex items-center gap-1 backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Artisan Handcrafted</span>
                </div>

                {/* Reference Preview Badge */}
                <div className="absolute top-9 sm:top-10 right-2.5 sm:right-3 bg-stone-900/75 backdrop-blur-xs text-stone-200 text-[8px] sm:text-[9px] font-medium px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                  Reference Image
                </div>

                {/* Fragrance Mist Badge if Infused */}
                {config.fragrance_id && config.fragrance_id !== 'unscented' && (
                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 bg-white/90 backdrop-blur-md text-stone-800 text-[9px] sm:text-[10px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs border border-stone-200/60 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                    <span>{currentFragrance?.name || 'Scent Infused'}</span>
                  </div>
                )}

                {/* Floating Specs Pill at Bottom of Photo */}
                <div className="absolute bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-3 bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/60 shadow-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 truncate">
                      {currentFocal?.name || 'Handcrafted Flowers'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                      {bomPrice.total_stem_count || (config.focal_count + config.filler_count + config.foliage_count)} Stems
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 truncate flex items-center gap-1.5">
                    <span>{currentWrapping?.name || 'Matte Kraft Wrap'}</span>
                    <span>•</span>
                    <span>{currentStyle?.name || 'Classic Dome'}</span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-stone-400 italic pt-0.5 border-t border-stone-100 flex items-center justify-between">
                    <span>* Reference image only. Actual bouquet may vary naturally.</span>
                  </p>
                </div>

                {/* Calligraphy Card Overlay on Step 7 */}
                {currentStep === 7 && config.greeting_card_text && (
                  <div className="absolute inset-3 sm:inset-4 bg-[#fdfbf7] rounded-xl shadow-2xl border border-amber-200/70 p-3 sm:p-4 flex flex-col justify-between animate-fadeIn z-10">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                      <span className="font-serif italic text-xs text-amber-900 font-bold">Calligraphy Card</span>
                      <div className="w-5 h-5 rounded-full bg-rose-800 text-amber-200 text-[8px] font-serif font-bold flex items-center justify-center shadow-xs">
                        GNB
                      </div>
                    </div>
                    <p className="font-serif italic text-stone-800 text-xs leading-relaxed my-auto text-center px-2 line-clamp-4">
                      "{config.greeting_card_text}"
                    </p>
                    <div className="text-[9px] text-stone-400 text-center uppercase tracking-widest font-mono">
                      Hand-lettered with botanical ink
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Bouquet Price Summary */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-2 sm:space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Arrangement Summary</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  {bomPrice.total_stem_count || 10} Stems
                </span>
              </div>

              <div className="max-h-24 sm:max-h-28 overflow-y-auto space-y-1 text-xs text-stone-600 pr-1">
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

            {/* Mobile-only Preview Action Buttons */}
            <div className="lg:hidden flex items-center justify-between gap-2 pt-2 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('options')}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-white transition-all text-center cursor-pointer"
              >
                ← Back to Options
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-sm hover:from-rose-600 hover:to-pink-700 transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart (₹{bomPrice.total_price})</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}