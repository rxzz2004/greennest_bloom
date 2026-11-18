import React from 'react';
import { 
  X, 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  Sparkles,
  Flower2
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

// Fallback flower catalog for details if product is not found in api products
const fallbackCatalogue = [
  {
    id: 'cat-blooming-peony',
    name: 'Blooming Peony Bouquet',
    specs: '55-67 cm, selected',
    price: 36,
    inrPrice: 1699,
    category: 'peonies',
    image: '/pink_peonies_hero.jpg',
    tag: 'Bestseller'
  },
  {
    id: 'cat-tulips-chrysanthem',
    name: 'Tulips with Chrysanthem',
    specs: '45-57 cm, selected',
    price: 24,
    inrPrice: 1250,
    category: 'tulips',
    image: '/tulips_chrysanthem.jpg',
    tag: 'Fresh Harvest'
  },
  {
    id: 'cat-peonies-dahlias',
    name: 'Peonies with Dahlias',
    specs: '57-64 cm, selected',
    price: 32,
    inrPrice: 1550,
    category: 'peonies',
    image: '/peonies_chip.jpg',
    tag: 'Florist Choice'
  },
  {
    id: 'cat-angel-roses',
    name: 'Coloured Roses with Tulips',
    specs: '50-60 cm, selected',
    price: 26,
    inrPrice: 1350,
    category: 'roses',
    image: '/angel_bouquet.jpg',
    tag: 'Trending'
  },
  {
    id: 'cat-highland-sunflower',
    name: 'Highland Sunflowers Trio',
    specs: '45-55 cm, selected',
    price: 19,
    inrPrice: 999,
    category: 'sunflowers',
    image: '/sunflower_bouquet.jpg',
    tag: 'Sunny Cheer'
  },
  {
    id: 'cat-single-rose',
    name: 'Imperial Rose in Glass Urn',
    specs: '50-60 cm, selected',
    price: 24,
    inrPrice: 1299,
    category: 'roses',
    image: '/rose_flower_bouquet.jpg',
    tag: 'Tabletop Gem'
  },
  {
    id: 'cat-blush-lily',
    name: 'Oriental Pink Lily Elegance',
    specs: '55-65 cm, premium',
    price: 34,
    inrPrice: 1599,
    category: 'peonies',
    image: '/pink_lily_bloom.jpg',
    tag: 'Signature Bloom'
  },
  {
    id: 'cat-white-orchid',
    name: 'Snow Orchid Cascade',
    specs: '60-70 cm, exotic',
    price: 45,
    inrPrice: 2199,
    category: 'roses',
    image: '/pink_peonies_hero.jpg',
    tag: 'Luxury Tier'
  },
  {
    id: 'pink-peonies',
    name: 'Lush Morning Peonies',
    specs: '55-67 cm, selected',
    price: 36,
    inrPrice: 1699,
    category: 'peonies',
    image: '/pink_peonies_hero.jpg',
    tag: 'Bestseller'
  }
];

export default function WishlistModal({
  isOpen,
  onClose,
  favoritesList = [],
  onToggleFavorite = () => {},
  onClearWishlist = () => {},
  onAddToCart = () => {},
  currentTheme = 'rose',
  products = [],
  currentUser = null
}) {
  if (!isOpen) return null;

  const isDark = currentTheme === 'dark';
  const isLight = currentTheme === 'light';

  // Merge products and fallbackCatalogue to find full details
  const allKnownItems = [...products, ...fallbackCatalogue];
  
  // Find favorited items details
  const wishlistProducts = favoritesList.map((id) => {
    const found = allKnownItems.find((p) => p.id === id || p.id === String(id));
    if (found) {
      return {
        id: found.id,
        name: found.name,
        price: found.price || 24,
        inrPrice: found.inrPrice || found.base_price || 1250,
        specs: found.specs || 'Artisan selected stem bouquet',
        image: found.image || found.image_url || '/pink_peonies_hero.jpg',
        tag: found.tag || 'Saved'
      };
    }
    return {
      id,
      name: 'Curated Artisan Bouquet',
      price: 26,
      inrPrice: 1350,
      specs: 'Morning conditioned blooms',
      image: '/pink_peonies_hero.jpg',
      tag: 'Saved'
    };
  });

  const handleAddAll = () => {
    soundEffects.playStemSnip();
    const itemsToAdd = wishlistProducts.map((item) => ({
      id: item.id,
      name: item.name,
      base_price: item.inrPrice,
      effective_price: item.inrPrice,
      image_url: item.image,
      quantity: 1
    }));
    onAddToCart(itemsToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border flex flex-col max-h-[90vh] transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-slate-100'
          : isLight
          ? 'bg-white border-stone-200 text-stone-900'
          : 'bg-white border-rose-200 text-[#37131e]'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-slate-800' : isLight ? 'border-stone-100' : 'border-rose-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-rose-400' : 'bg-rose-50 text-rose-600'
            }`}>
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold">
                  {currentUser?.full_name ? `${currentUser.full_name}'s Wishlist` : 'Your Saved Wishlist'}
                </h3>
                {currentUser?.email && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-slate-800 text-cyan-300' : 'bg-rose-100 text-rose-700'
                  }`}>
                    Personal
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                {currentUser?.email
                  ? `Saved to account (${currentUser.email}) • ${wishlistProducts.length} ${wishlistProducts.length === 1 ? 'bouquet' : 'bouquets'}`
                  : `${wishlistProducts.length} ${wishlistProducts.length === 1 ? 'bouquet' : 'bouquets'} saved`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {wishlistProducts.length > 0 && (
              <button
                onClick={onClearWishlist}
                className="text-[11px] font-semibold text-stone-400 hover:text-rose-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Clear all saved items"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wishlist Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 mx-auto flex items-center justify-center text-rose-400">
                <Heart className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="font-bold text-base">Your Wishlist is Empty</h4>
              <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                Click the heart icon on any bouquet in the catalogue to save it here for quick ordering or gifting.
              </p>
            </div>
          ) : (
            wishlistProducts.map((item) => (
              <div
                key={item.id}
                className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    : isLight
                    ? 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
                    : 'bg-rose-50/40 border-rose-100 hover:border-rose-200'
                }`}
              >
                {/* Image & Info */}
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="w-16 sm:w-20 aspect-square rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate">
                      {item.name}
                    </h4>
                    <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      {item.specs}
                    </p>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="font-bold text-xs sm:text-sm">₹{item.inrPrice || item.price}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      soundEffects.playStemSnip();
                      onAddToCart({
                        id: item.id,
                        name: item.name,
                        base_price: item.inrPrice,
                        effective_price: item.inrPrice,
                        image_url: item.image,
                        quantity: 1
                      });
                      if (onClose) onClose();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center space-x-1 ${
                      isDark
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                        : isLight
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                    title="Add to Basket"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onToggleFavorite(item.id);
                    }}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-xl transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {wishlistProducts.length > 0 && (
          <div className={`pt-4 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : isLight ? 'border-stone-100' : 'border-rose-100'
          }`}>
            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Continue Browsing
            </button>

            <button
              onClick={handleAddAll}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  : isLight
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add All ({wishlistProducts.length}) to Cart</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
