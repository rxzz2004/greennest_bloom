import React, { useState } from 'react';
import { 
  Sun, 
  Droplet, 
  Calendar, 
  Tag, 
  Info, 
  Plus, 
  Check, 
  Sparkles, 
  Search,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function CatalogSection({ 
  products, 
  activeRole, 
  onAddToCart,
  onOpenBouquetCustomizer,
  externalSearchQuery
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Active query prefers external navbar search if provided
  const activeSearch = externalSearchQuery !== undefined && externalSearchQuery !== '' 
    ? externalSearchQuery 
    : searchQuery;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (product.botanical_name && product.botanical_name.toLowerCase().includes(activeSearch.toLowerCase())) ||
      (product.floriography_meaning && product.floriography_meaning.toLowerCase().includes(activeSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Complete Collection' },
    { id: 'cut_flower', label: 'Fresh Cut Stems' },
    { id: 'potted_plant', label: 'Living Nursery Plants' },
    { id: 'fruit_plant', label: 'Fruit Trees & Saplings' },
    { id: 'vegetable_plant', label: 'Vegetable Plants' },
    { id: 'herb', label: 'Ayurvedic & Kitchen Herbs' },
    { id: 'planter', label: 'Pots & Designer Planters' },
    { id: 'accessory', label: 'Botanical Soil & Care' }
  ];

  return (
    <section id="catalog-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header & Role Context Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Artisan Botanical Store</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Botanical Flowers & Living Plants
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            {activeRole === 'corporate' ? (
              <span className="text-indigo-700 font-semibold">
                Wholesale Corporate Mode Active: Bulk trays, custom event arrangements, and tax invoices.
              </span>
            ) : (
              <span>
                Individual Shopper: Hand-picked fresh stems, potted nursery plants, and gift boxes.
              </span>
            )}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-4 md:mt-0 relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search flower, species, or meaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/15 font-bold'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bouquet Customizer Banner Callout in Cut Stems tab */}
      {(selectedCategory === 'all' || selectedCategory === 'cut_flower') && activeRole === 'individual' && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between shadow-lg">
          <div className="space-y-1 text-center sm:text-left mb-4 sm:mb-0">
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Bespoke Floral Engineering
            </span>
            <h3 className="font-serif text-2xl font-bold">Design Your 7-Step Custom Bouquet</h3>
            <p className="text-stone-300 text-xs max-w-xl">
              Select your wrapping paper, focal blooms, fillers, greenery, artisan style, and preservation spray with live Bill-of-Materials pricing.
            </p>
          </div>
          <button
            onClick={onOpenBouquetCustomizer}
            className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 text-xs font-bold shadow-md transition-all shrink-0"
          >
            Open Interactive Builder
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const isB2B = activeRole === 'corporate';
          const displayPrice = isB2B
            ? Math.round(product.base_price * (1 - (product.b2b_discount_percent / 100)))
            : product.base_price;
          const minQty = isB2B ? product.b2b_min_quantity : 1;

          return (
            <div 
              key={product.id}
              className="group rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Product Image & Badges */}
              <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Freshness Badge */}
                {product.is_perishable ? (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/90 text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {product.vase_life_days}-Day Freshness Guarantee
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-700/90 text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                    Living Nursery Plant
                  </span>
                )}

                {/* HSN & Wholesale Tag */}
                {isB2B && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-950/85 text-indigo-200 border border-indigo-500/30">
                    HSN: {product.hsn_code}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif font-bold text-lg text-stone-900 group-hover:text-emerald-800 transition-colors">
                      {product.name}
                    </h4>
                    <button
                      onClick={() => setSelectedProductDetails(product)}
                      title="Botanical Specs"
                      className="text-stone-400 hover:text-emerald-700 p-1 rounded-md transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {product.botanical_name && (
                    <p className="text-xs italic text-stone-500 font-serif">
                      {product.botanical_name}
                    </p>
                  )}

                  {product.floriography_meaning && (
                    <p className="text-xs text-stone-600 line-clamp-2 mt-2 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-100">
                      <span className="font-semibold text-emerald-900">Floriography:</span> {product.floriography_meaning}
                    </p>
                  )}
                </div>

                {/* Pricing & MOQ Controls */}
                <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-xl font-bold text-stone-900">₹{displayPrice}</span>
                      <span className="text-xs text-stone-500">/ {product.is_perishable ? 'stem' : 'pot'}</span>
                    </div>

                    {isB2B ? (
                      <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                        Wholesale MOQ: <span className="font-bold">{minQty} units</span> ({product.b2b_discount_percent}% off)
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Retail limit: 10 units
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onAddToCart({ ...product, quantity: minQty, effective_price: displayPrice })}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {isB2B ? `(${minQty})` : ''}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botanical Info Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">{selectedProductDetails.name}</h3>
                <p className="text-xs italic text-emerald-700 font-serif">{selectedProductDetails.botanical_name}</p>
              </div>
              <button 
                onClick={() => setSelectedProductDetails(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-900 block mb-1">Floriography Botanical Symbolism:</span>
                <p>{selectedProductDetails.floriography_meaning || 'Botanical significance documented in European and Victorian floriography archives.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                    <Sun className="w-4 h-4 text-amber-500" /> Sunlight Tolerance
                  </div>
                  <span>{selectedProductDetails.sunlight_requirement || 'Indirect natural daylight'}</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                    <Droplet className="w-4 h-4 text-sky-500" /> Watering Frequency
                  </div>
                  <span>{selectedProductDetails.watering_frequency || 'Hydrate when topsoil is dry'}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">Biological Vase / Shelf Life</span>
                  <span className="text-stone-500">{selectedProductDetails.vase_life_days} days under standard conditioning</span>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-md border border-stone-200">
                  HSN {selectedProductDetails.hsn_code}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
