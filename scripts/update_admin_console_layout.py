import sys
from pathlib import Path

file_path = Path("frontend/src/components/AdminConsole.jsx")
content = file_path.read_text(encoding="utf-8")

start_marker = "          {/* Main 2-Column Grid */}"
end_marker = "      {/* TAB 1: Perishable Flower Batches */}"

if start_marker not in content:
    print(f"Error: start_marker not found!")
    sys.exit(1)

if end_marker not in content:
    # Try alternative
    end_marker = "{/* TAB 1: Perishable Flower Batches */}"
    if end_marker not in content:
        print(f"Error: end_marker not found!")
        sys.exit(1)

idx_start = content.index(start_marker)
idx_end = content.index(end_marker)

print(f"Found markers from index {idx_start} to {idx_end} (length {idx_end - idx_start})")

new_layout = """          {/* Stems & Plants: Clean Stacked 2-Frame Layout */}
          <div className="space-y-8">
            
            {/* FRAME 1: Add New Plant, Bouquet, or Floral Stem (Full Width Frame) */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900">Enter New Plant, Bouquet, or Floral Stem</h4>
                    <p className="text-xs text-stone-500">Register new nursery inventory, living potted plants, or handcrafted bouquets into the live database.</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-center">
                  Catalog Entry Form
                </span>
              </div>

              <form onSubmit={handleCreatePlantSubmit} className="space-y-6 text-xs">
                {/* Botanical Classification Toggle (3 Types) */}
                <div>
                  <label className="block font-bold text-stone-700 mb-2">Botanical Product Classification</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-100 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(false);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Living Nursery Plants');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        !newIsPerishable && newPlantCategory === 'Living Nursery Plants'
                          ? 'bg-white text-emerald-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      <span>Living Nursery Plant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(true);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Curated Bouquets');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        newIsPerishable && newPlantCategory === 'Curated Bouquets'
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      <span>Curated Bouquet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setNewIsPerishable(true);
                        if (!isCustomCategory) {
                          setNewPlantCategory('Cut Flowers & Stems');
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        newIsPerishable && newPlantCategory === 'Cut Flowers & Stems'
                          ? 'bg-white text-amber-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>Cut Stem / Bloom</span>
                    </button>
                  </div>
                </div>

                {/* Row 1: Name, Botanical Name, Category (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Plant / Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlantName}
                      onChange={(e) => setNewPlantName(e.target.value)}
                      placeholder="e.g. Pink Oriental Stargazer Lily or Golden Money Plant"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Botanical / Scientific Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBotanicalName}
                      onChange={(e) => setNewBotanicalName(e.target.value)}
                      placeholder="e.g. Lilium orientalis or Epipremnum aureum"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 italic"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700">
                        Storefront Category <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setIsCustomCategory(!isCustomCategory);
                        }}
                        className="text-[11px] text-emerald-800 font-bold hover:underline cursor-pointer"
                      >
                        {isCustomCategory ? 'Use Preset' : '+ Custom'}
                      </button>
                    </div>

                    {!isCustomCategory ? (
                      <select
                        value={newPlantCategory}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                          } else {
                            setNewPlantCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-medium bg-white"
                      >
                        {PREDEFINED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">+ Enter Custom Category...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Type custom category name..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500 ring-2 ring-emerald-500/20 text-stone-800 font-medium"
                      />
                    )}
                  </div>
                </div>

                {/* Row 2: Price, Stock, Vase Life / Care (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Retail Price (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={newPlantPrice}
                        onChange={(e) => setNewPlantPrice(e.target.value)}
                        placeholder="499"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Initial Stock Units</label>
                    <input
                      type="number"
                      min="1"
                      value={newPlantStock}
                      onChange={(e) => setNewPlantStock(e.target.value)}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    {newIsPerishable ? (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Expected Vase Life (Days)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={newVaseLife}
                          onChange={(e) => setNewVaseLife(e.target.value)}
                          placeholder="7"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Sunlight Requirement</label>
                        <input
                          type="text"
                          value={newSunlight}
                          onChange={(e) => setNewSunlight(e.target.value)}
                          placeholder="e.g. Bright Indirect Light"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Product Photos & Gallery (Multiple Photos Support) */}
                <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-stone-800">Product Photos Gallery</label>
                      <p className="text-[11px] text-stone-500">Add multiple photos so customers can view different angles of the plant or bouquet.</p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-bold">
                      {newPlantImages.length} {newPlantImages.length === 1 ? 'photo' : 'photos'} added
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newPlantImageUrlInput}
                      onChange={(e) => setNewPlantImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="Paste image URL (e.g. /monstera_plant_pot.jpg)..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors shrink-0"
                    >
                      + Add Photo URL
                    </button>
                    <label className="cursor-pointer inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Photos Quick Buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-600 block mb-1.5">Quick Presets from Nursery Gallery:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Monstera Albo', url: '/monstera_plant_pot.jpg' },
                        { label: 'Snake Plant', url: '/snake_plant_pot.jpg' },
                        { label: 'Fiddle Leaf Fig', url: '/fiddle_fig_pot.jpg' },
                        { label: 'ZZ Plant', url: '/zz_plant.jpg' },
                        { label: 'Krishna Tulsi', url: '/krishna_tulsi.jpg' },
                        { label: 'Areca Palm', url: '/arecanut_palm.jpg' },
                        { label: 'Bridal Bouquet', url: '/lily_bouquet_realistic.jpg' },
                        { label: 'Rose Bouquet', url: '/rose_bouquet_realistic.jpg' },
                        { label: 'Wildflower Medley', url: '/sunflower_bouquet.jpg' },
                        { label: 'Orchid Stem', url: '/orchid_bouquet_realistic.jpg' },
                        { label: 'Peony Bouquet', url: '/peony_bouquet_realistic.jpg' },
                        { label: 'Saffron Marigold', url: '/saffron_marigold.jpg' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddPresetImage(preset.url)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 text-[11px] font-medium transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Thumbnail Badges */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {newPlantImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-stone-200 hover:border-emerald-500 bg-white shadow-2xs transition-all"
                      >
                        <img
                          src={img}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }}
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove Photo"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[11px] font-bold shadow-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 4: Care and Description (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Watering &amp; Hydration Care Instructions
                    </label>
                    <input
                      type="text"
                      value={newWatering}
                      onChange={(e) => setNewWatering(e.target.value)}
                      placeholder="e.g. Water every 2-3 days or change cold vase water daily"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Botanical Description &amp; Floriography Meaning
                    </label>
                    <textarea
                      rows={2}
                      value={newPlantDescription}
                      onChange={(e) => setNewPlantDescription(e.target.value)}
                      placeholder="Describe foliage, bloom aroma, floriography meaning, or decorative staging..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-800 leading-relaxed text-xs"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmittingPlant}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingPlant ? 'Saving to Catalog...' : 'Add Plant / Bouquet to Storefront Catalog'}</span>
                </button>
              </form>
            </div>

            {/* FRAME 2: Active Inventory & Product Catalog Management (Full Width Frame) */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                <div>
                  <h4 className="font-serif text-xl font-bold text-stone-900">Live Nursery Inventory &amp; Product Catalog</h4>
                  <p className="text-xs text-stone-500">Real-time inventory view with direct edit and remove database controls.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs">
                    Total: <strong className="text-emerald-900 font-mono">{products.length}</strong> Products
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      loadAllAdminData();
                    }}
                    className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                    title="Refresh Catalog"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    soundEffects.playClick();
                    setAdminSearchQuery(plantSearchQuery);
                  }}
                  className="relative"
                >
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={plantSearchQuery}
                    onChange={(e) => {
                      setPlantSearchQuery(e.target.value);
                      setAdminSearchQuery(e.target.value);
                    }}
                    placeholder="Search active plants by name, botanical species, or category..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-stone-50/50"
                  />
                  {plantSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlantSearchQuery('');
                        setAdminSearchQuery('');
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setPlantCategoryFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      plantCategoryFilter === 'all'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((cat) => {
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPlantCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                          plantCategoryFilter === cat
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products List (Full Width Cards) */}
              <div className="space-y-3 pt-2">
                {products
                  .filter((p) => {
                    const matchesCategory = plantCategoryFilter === 'all' || p.category === plantCategoryFilter;
                    const q = plantSearchQuery.trim().toLowerCase();
                    const matchesQuery = !q || 
                      p.name.toLowerCase().includes(q) || 
                      (p.botanical_name && p.botanical_name.toLowerCase().includes(q)) ||
                      (p.category && p.category.toLowerCase().includes(q)) ||
                      (p.floriography_meaning && p.floriography_meaning.toLowerCase().includes(q));
                    return matchesCategory && matchesQuery;
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-stone-50/70 hover:bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 p-4 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-2xl border border-stone-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                          <img
                            src={p.image_url || '/pink_lily_bloom.jpg'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }}
                          />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm sm:text-base">{p.name}</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.category}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${
                              p.is_perishable ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {p.is_perishable ? 'Perishable Bloom' : 'Living Plant'}
                            </span>
                            {p.images && p.images.length > 1 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                <span>{p.images.length} Photos</span>
                              </span>
                            )}
                          </div>

                          {p.botanical_name && (
                            <p className="text-xs text-stone-500 italic">{p.botanical_name}</p>
                          )}

                          {p.floriography_meaning && (
                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                              {p.floriography_meaning}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-mono pt-0.5">
                            <span className="font-bold text-stone-700">Stock: {p.stock_quantity ?? 50} units</span>
                            {p.sunlight_requirement && <span>{p.sunlight_requirement}</span>}
                            {p.vase_life_days > 0 && <span>Vase life: {p.vase_life_days}d</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing and Action Buttons */}
                      <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200">
                        <span className="text-lg font-bold font-mono text-emerald-900">
                          ₹{p.base_price || p.price}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Edit product details in database"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlant(p)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Delete from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {products.length === 0 && (
                  <div className="text-center py-16 px-4 bg-stone-50 rounded-3xl border border-dashed border-stone-300 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      No Plants or Stems in Catalog Yet
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use the entry form above to add your first plant or fresh flower bouquet to the storefront catalog.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

"""

content = content[:idx_start] + new_layout + content[idx_end:]

# Now let's insert Modal 1C (Edit Product Modal) right after Modal 1B
modal_marker = "{/* Modal 2: Rendered Transactional Email Preview */}"
if modal_marker not in content:
    print("Error: modal_marker not found!")
    sys.exit(1)

modal_code = """      {/* Modal 1C: Edit Existing Product / Botanical Item */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <form onSubmit={handleUpdateProductSubmit} className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 text-xs my-8">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Edit Product in Database
                  </h3>
                  <p className="text-[11px] text-stone-500">ID: #{editingProduct.id} • Updates live across all storefront customers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-2xl leading-none px-2 py-1"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Botanical Name (Optional)</label>
                <input
                  type="text"
                  value={editProductForm.botanical_name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, botanical_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 italic text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={editProductForm.category}
                  onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Retail Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={editProductForm.base_price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, base_price: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs text-emerald-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editProductForm.stock_quantity}
                  onChange={(e) => setEditProductForm({ ...editProductForm, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <label className="block font-bold text-stone-800">Product Images</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editProductImageUrlInput}
                  onChange={(e) => setEditProductImageUrlInput(e.target.value)}
                  placeholder="Image path (e.g. /monstera_plant_pot.jpg)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editProductImageUrlInput.trim()) {
                      setEditProductForm(prev => ({
                        ...prev,
                        images: [...(prev.images || []), editProductImageUrlInput.trim()]
                      }));
                      setEditProductImageUrlInput('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs"
                >
                  + Add URL
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(editProductForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-stone-300 bg-white">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = '/pink_lily_bloom.jpg'; }} />
                    <button
                      type="button"
                      onClick={() => {
                        setEditProductForm(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Sunlight Requirement</label>
                <input
                  type="text"
                  value={editProductForm.sunlight_requirement}
                  onChange={(e) => setEditProductForm({ ...editProductForm, sunlight_requirement: e.target.value })}
                  placeholder="e.g. Bright Indirect Light"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Watering Instructions</label>
                <input
                  type="text"
                  value={editProductForm.watering_frequency}
                  onChange={(e) => setEditProductForm({ ...editProductForm, watering_frequency: e.target.value })}
                  placeholder="e.g. Water every 2-3 days"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Botanical Description & Floriography</label>
              <textarea
                rows={2}
                value={editProductForm.floriography_meaning}
                onChange={(e) => setEditProductForm({ ...editProductForm, floriography_meaning: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-stone-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingProduct}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {isUpdatingProduct ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes in Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

"""

idx_modal = content.index(modal_marker)
content = content[:idx_modal] + modal_code + content[idx_modal:]

file_path.write_text(content, encoding="utf-8")
print("AdminConsole.jsx layout successfully updated to clean 2-Frame design with Edit Product modal!")
