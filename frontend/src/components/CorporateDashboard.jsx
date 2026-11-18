import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Receipt, 
  Truck, 
  Calendar, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles, 
  Plus, 
  Check, 
  Download, 
  ArrowUpRight,
  Clock,
  ThermometerSnowflake,
  PackageCheck
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

export default function CorporateDashboard({ 
  user, 
  products = [], 
  onAddToCart = () => {}, 
  onOpenStaging = () => {},
  onOpenInvoiceModal = () => {},
  onOpenLiveTrackingModal = () => {},
  currentTheme = 'rose'
}) {
  const [activeTab, setActiveTab] = useState('wholesale');
  const [poNumber, setPoNumber] = useState('PO-2026-LEELA-09');
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});

  // Bulk Wholesale Stem Crates catalog
  const wholesaleItems = [
    {
      id: 'ws-1',
      name: 'Stargazer Pink Lily Deluxe Crates',
      botanical: 'Lilium orientalis',
      stemsPerCrate: 50,
      unitPricePerStem: 110,
      cratePrice: 5500,
      minCrates: 2,
      origin: 'Ooty Alpine Glasshouses',
      shelfLifeDays: 8,
      image_url: '/pink_lily_bloom.jpg',
      tags: ['Presidential Suite', 'Grand Lobby', 'Fragrant']
    },
    {
      id: 'ws-2',
      name: 'Dutch Avalanche White Rose Crates',
      botanical: 'Rosa avalanche',
      stemsPerCrate: 100,
      unitPricePerStem: 45,
      cratePrice: 4500,
      minCrates: 3,
      origin: 'Kodaikanal Highlands',
      shelfLifeDays: 7,
      image_url: '/rose_bouquet_realistic.jpg',
      tags: ['Wedding Mandap', 'Banquet Centerpieces']
    },
    {
      id: 'ws-3',
      name: 'Mokara Orchid Stem Bundles',
      botanical: 'Mokara hybrid',
      stemsPerCrate: 60,
      unitPricePerStem: 95,
      cratePrice: 5700,
      minCrates: 1,
      origin: 'Coorg Mist Nursery',
      shelfLifeDays: 14,
      image_url: '/orchid_bouquet_realistic.jpg',
      tags: ['Ballroom Entrance', 'Long-lasting']
    },
    {
      id: 'ws-4',
      name: 'Blue Hydrangea Mega Heads',
      botanical: 'Hydrangea macrophylla',
      stemsPerCrate: 30,
      unitPricePerStem: 180,
      cratePrice: 5400,
      minCrates: 2,
      origin: 'Nilgiris Protected Terrace',
      shelfLifeDays: 6,
      image_url: '/blue_water_lily.jpg',
      tags: ['Luxury Banquet', 'High Volume']
    }
  ];

  const handleCrateQuantityChange = (itemId, delta) => {
    soundEffects.playClick();
    setSelectedQuantities(prev => {
      const current = prev[itemId] || 2;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddWholesaleToCart = (item) => {
    soundEffects.playStemSnip();
    const crates = selectedQuantities[item.id] || item.minCrates;
    const totalStems = crates * item.stemsPerCrate;
    const totalPrice = crates * item.cratePrice;

    onAddToCart({
      id: `corporate-${item.id}`,
      name: `${item.name} (${crates} Crates - ${totalStems} Stems)`,
      price: totalPrice,
      category: 'corporate_wholesale',
      image_url: item.image_url || '/pink_lily_bloom.jpg',
      quantity: 1,
      isCorporate: true,
      poNumber: poNumber
    });

    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Executive Enterprise Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-950 via-indigo-950 to-stone-900 border border-indigo-900/50 p-6 sm:p-8 text-white shadow-xl shadow-stone-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-bold uppercase tracking-wider">
                Corporate Tier: 5-Star Hospitality
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold">
                GSTIN: {user?.gstin || '29AABCL5544K1ZZ'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {user?.company_name || 'The Leela Palace Bengaluru'}
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-2xl font-light">
              Enterprise Floral Procurement, Wholesale Mountain Bloom Crates, and Banquet Staging Visualizer with Automated Net-30 GST Invoicing.
            </p>
          </div>

          {/* Quick Corporate Action Cluster */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenStaging();
              }}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Launch 3D Event Staging</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenInvoiceModal(1);
              }}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-sm transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Download Tax Invoice Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commercial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Standing Contracts</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">4 Properties</div>
          <p className="text-[11px] text-emerald-700 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Lobbies & Grand Ballrooms Active</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Monthly Requisition Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">₹1,85,400</div>
          <p className="text-[11px] text-stone-500">
            Current Billing Cycle (Net 30)
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>GST Input Tax Credit</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">₹33,372</div>
          <p className="text-[11px] text-emerald-700 flex items-center space-x-1">
            <span>18% ITC Deductible Accrued</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Cold-Chain Transit SLA</span>
            <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">100% On-Time</div>
          <p className="text-[11px] text-teal-700 flex items-center space-x-1">
            <span>Avg Cargo Temp: 17.2°C</span>
          </p>
        </div>

      </div>

      {/* Corporate Dashboard Segment Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center space-x-2 bg-stone-100 p-1.5 rounded-2xl">
          <button
            onClick={() => { soundEffects.playClick(); setActiveTab('wholesale'); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wholesale' 
                ? 'bg-white text-indigo-950 shadow-xs border border-stone-200/60' 
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Wholesale Stem Requisitions</span>
          </button>

          <button
            onClick={() => { soundEffects.playClick(); setActiveTab('subscriptions'); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'subscriptions' 
                ? 'bg-white text-indigo-950 shadow-xs border border-stone-200/60' 
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Standing Hotel Contracts</span>
          </button>

          <button
            onClick={() => { soundEffects.playClick(); onOpenLiveTrackingModal(1); }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-950 transition-all"
          >
            <Truck className="w-4 h-4 text-teal-600" />
            <span>Fleet Cold-Chain Telemetry</span>
          </button>
        </div>

        {/* PO Reference Input */}
        <div className="flex items-center space-x-2 text-xs">
          <label className="font-bold text-stone-600">Active PO Ref:</label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 font-mono text-xs text-stone-800 focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
      </div>

      {/* TAB CONTENT: WHOLESALE BULK STEM REQUISITIONS */}
      {activeTab === 'wholesale' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Bulk Wholesale Mountain Crates
              </h2>
              <p className="text-xs text-stone-500">
                High-volume farm gate crates sourced directly from Ooty, Kodaikanal, and Coorg highland growers.
              </p>
            </div>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Bulk Tier Discounts Applied (Up to 25% Off)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wholesaleItems.map((item) => {
              const qty = selectedQuantities[item.id] || item.minCrates;
              const isAdded = addedItems[item.id];
              const totalStems = qty * item.stemsPerCrate;
              const totalPrice = qty * item.cratePrice;

              return (
                <div 
                  key={item.id}
                  className="rounded-2xl bg-white border border-stone-200/90 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">{item.name}</h3>
                      <p className="font-serif italic text-xs text-stone-500">{item.botanical}</p>
                      <p className="text-[11px] text-stone-400 mt-1">Origin: {item.origin} • Guaranteed {item.shelfLifeDays}-Day Freshness</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-950">₹{item.cratePrice.toLocaleString()}</div>
                      <span className="text-[10px] text-stone-500 block">per crate ({item.stemsPerCrate} stems)</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold">₹{item.unitPricePerStem}/stem</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-4">
                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-stone-500 font-semibold">Crates:</span>
                      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden text-xs">
                        <button
                          onClick={() => handleCrateQuantityChange(item.id, -1)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-stone-900">{qty}</span>
                        <button
                          onClick={() => handleCrateQuantityChange(item.id, 1)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono">({totalStems} stems)</span>
                    </div>

                    {/* Order / Requisition Button */}
                    <button
                      onClick={() => handleAddWholesaleToCart(item)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isAdded 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-900 hover:bg-indigo-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Requisition!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to PO (₹{totalPrice.toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STANDING HOTEL CONTRACTS */}
      {activeTab === 'subscriptions' && (
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Recurring Hotel Standing Arrangements
              </h2>
              <p className="text-xs text-stone-500">
                Scheduled daily & weekly refreshed floral installations dispatched via refrigerated vans before 6:30 AM.
              </p>
            </div>
            <button
              onClick={() => alert('New standing arrangement schedule requested. Your dedicated account executive Rajiv will call within 15 minutes.')}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-700"
            >
              + Request New Standing Location
            </button>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-stone-900 text-sm block">Main Lobby Grand Rotunda Floral Urn</strong>
                <span className="text-stone-500">Daily Refresh • Stargazer Pink Lilies, White Avalanche Roses & Magnolia Greens</span>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">Delivery Time: 06:00 AM Daily • Driver: Van #KA-01-FL-9921</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold self-start">Active Contract</span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-stone-900 text-sm block">Presidential Suite Fresh Orchid Vases</strong>
                <span className="text-stone-500">Bi-weekly Refresh (Tue & Fri) • Purple Mokara & White Phalaenopsis Stems</span>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">Delivery Time: 07:15 AM • Clean Glass Vases Swapped</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold self-start">Active Contract</span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-stone-900 text-sm block">Leela Grand Ballroom VIP Table Centerpieces</strong>
                <span className="text-stone-500">Scheduled for Upcoming Weekend Summit (35 Centerpieces)</span>
                <div className="text-[10px] text-indigo-700 font-mono mt-1">Linked to Event Staging Engine Spec ID #STG-8812</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold self-start">Event Confirmed</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
