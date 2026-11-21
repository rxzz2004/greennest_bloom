import React, { useState, useEffect } from 'react';
import { 
  X, 
  ReceiptText, 
  Truck, 
  CheckCircle2, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  PackageCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';

export default function OrderHistoryModal({ 
  isOpen, 
  onClose, 
  currentUser,
  onOpenInvoice,
  onOpenTracking,
  onReorder 
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, currentUser]);

  async function loadOrders() {
    setLoading(true);
    try {
      const email = currentUser?.user_type === 'admin' ? '' : currentUser?.email;
      const res = await api.getOrders(email);
      if (res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'b2c' && order.order_type === 'b2c_retail') ||
      (filterType === 'b2b' && order.order_type === 'b2b_wholesale') ||
      (filterType === 'custom' && order.order_type === 'custom_bouquet');

    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some(i => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-center text-emerald-800">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Order History & GST Tax Invoices
              </h3>
              <p className="text-xs text-stone-500">
                Authenticated Account: <strong className="text-stone-800">{currentUser?.full_name}</strong> ({currentUser?.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'b2c', label: 'Retail Gifting (B2C)' },
              { id: 'b2b', label: 'Commercial Wholesale (B2B)' },
              { id: 'custom', label: 'Bespoke Bouquets' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playClick();
                  setFilterType(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterType === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order #, flower..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Orders List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fbfaf8]">
          {loading ? (
            <div className="text-center py-16 text-stone-400 text-xs animate-pulse">
              Retrieving encrypted order logs & tax records...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <PackageCheck className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-stone-800">No Orders Found</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No orders match your filter criteria. Place an order from the nursery catalog or 7-step bouquet builder to see it logged here with tax records.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-emerald-950">
                        {order.order_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.order_type === 'b2b_wholesale'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : order.order_type === 'custom_bouquet'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {order.order_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{order.created_at || 'Recently placed'}</span>
                      <span>•</span>
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span className="truncate max-w-[280px]">{order.shipping_address}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:text-right">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Amount</span>
                      <span className="font-serif text-lg font-bold text-stone-900">
                        ₹{order.total_amount?.toLocaleString()}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid
                    </span>
                  </div>
                </div>

                {/* Exception Alert: Customer Not Available */}
                {order.order_status === 'attempted_undelivered' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-amber-950">Delivery Handover Attempted — Customer Not Available</div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Our courier reached your doorstep but could not hand over the fresh flowers. Your stems remain safe in 4°C active micro-mist cold preservation. Please contact your courier or call 1800-FLOWER-GNB to confirm a convenient re-delivery window.
                      </p>
                    </div>
                  </div>
                )}

                {/* Assigned Courier Partner Dispatch Card */}
                {order.courier && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                            Assigned Courier Partner:
                          </span>
                          <strong className="text-emerald-950 font-bold">
                            {order.courier.full_name}
                          </strong>
                          <span className="text-[10px] font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                            Rating {order.courier.rating || 4.95}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 flex items-center space-x-2 mt-0.5">
                          <span>{order.courier.vehicle_type} ({order.courier.vehicle_number})</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-900">4°C Cold-Chain Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <a
                        href={`tel:${order.courier.phone}`}
                        onClick={() => soundEffects.playClick()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Call Courier</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Items in this order */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Manifest Items ({order.items?.length || 0})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-800/10 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <div>
                            <strong className="text-stone-800 block text-xs truncate max-w-[180px]">
                              {item.item_name}
                            </strong>
                            {item.discount_percent > 0 && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                -{item.discount_percent}% Fresh Harvest Special
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-700">
                          ₹{item.total_price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax Breakdown & Action CTAs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-stone-100 gap-3">
                  <div className="text-[11px] text-stone-500 font-mono">
                    Subtotal: ₹{order.subtotal?.toLocaleString()} + CGST 2.5% (₹{order.tax_cgst}) + SGST 2.5% (₹{order.tax_sgst})
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {/* Live Tracking CTA */}
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        onOpenTracking(order.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Track GPS</span>
                    </button>

                    {/* View GST Tax Invoice */}
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        onOpenInvoice(order.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all"
                    >
                      <ReceiptText className="w-3.5 h-3.5" />
                      <span>GST Tax Invoice</span>
                    </button>

                    {/* 1-Tap Reorder */}
                    {order.items?.length > 0 && (
                      <button
                        onClick={() => {
                          soundEffects.playStemSnip();
                          order.items.forEach(item => {
                            onReorder({
                              id: item.product_id || 1,
                              name: item.item_name,
                              base_price: item.unit_price,
                              price: item.unit_price,
                              quantity: item.quantity
                            });
                          });
                          soundEffects.playSuccessChime();
                          alert(`Re-ordered ${order.items.length} items from Order ${order.order_number}! Added to cart.`);
                        }}
                        title="Reorder same stems with 1-tap"
                        className="p-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <span>All orders Cash on Delivery (COD) only • For queries contact Mr Vikith Fernandes (7349413826)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
}
