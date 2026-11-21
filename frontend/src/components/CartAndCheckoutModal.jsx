import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Building2,
  FileCheck,
  AlertCircle,
  Tag,
  X,
  Sparkles,
  Truck,
  MapPin
} from 'lucide-react';
import { api } from '../api';
import { soundEffects } from '../utils/audio';
import { calculateDeliveryEstimate } from '../utils/deliveryCalculator';

export default function CartAndCheckoutModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  activeRole,
  user,
  onOrderSuccess 
}) {
  const [step, setStep] = useState('cart'); // 'cart' | 'payment' | 'processing' | 'success'
  const [shippingAddress, setShippingAddress] = useState(
    user?.address || 'Flat 402, Green Orchid Enclave, Indiranagar, Bengaluru, 560038'
  );
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const deliveryEstimate = calculateDeliveryEstimate(shippingAddress);

  // Sync shipping address whenever active user or modal opens
  useEffect(() => {
    if (user?.address) {
      setShippingAddress(user.address);
    }
  }, [user?.address, isOpen]);

  // Reset checkout step to 'cart' on each fresh open
  useEffect(() => {
    if (isOpen) {
      setStep('cart');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Coupon / Promo Code State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  // Safe pricing helper
  const getItemPrice = (item) => {
    const raw = item?.effective_price ?? item?.base_price ?? item?.price ?? item?.inrPrice ?? 1250;
    const num = Number(raw);
    return isNaN(num) || num <= 0 ? 1250 : num;
  };

  // Computations
  const subtotal = cartItems.reduce((acc, item) => {
    return acc + getItemPrice(item) * (item.quantity || 1);
  }, 0);

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = activeRole === 'corporate' ? 0.18 : 0.05;
  const tax = Math.round(taxableSubtotal * taxRate * 100) / 100;
  const grandTotal = Math.round((taxableSubtotal + tax) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        soundEffects.playSuccessChime();
        setAppliedCoupon(data);
        setCouponError(null);
      } else {
        soundEffects.playClick();
        setCouponError(data.error || 'Invalid promotional coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Network error validating coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    soundEffects.playClick();
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handlePay = async () => {
    if (!user?.email) {
      setErrorMsg('Please sign in or create an account to proceed with checkout.');
      return;
    }
    setStep('processing');
    setErrorMsg(null);

    try {
      const payload = {
        user_email: user.email,
        order_type: activeRole === 'corporate' ? 'b2b_wholesale' : 'b2c_retail',
        shipping_address: shippingAddress,
        payment_method: 'Cash on Delivery (COD)',
        payment_status: 'Pending Payment on Delivery',
        items: cartItems.map((item) => ({
          product_id: typeof item.id === 'number' ? item.id : null,
          name: item.name,
          quantity: item.quantity || 1,
          price: getItemPrice(item)
        }))
      };

      const res = await api.checkout(payload);
      if (res.error) {
        setErrorMsg(res.error);
        setStep('cart');
        return;
      }

      setCreatedOrder(res.order);
      setStep('success');
      onClearCart();
    } catch (err) {
      setErrorMsg('Payment verification failed. Please retry.');
      setStep('cart');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {step === 'success' ? 'Order Confirmed!' : step === 'payment' ? 'Secure Payment' : 'Your Botanical Cart'}
              </h3>
              <p className="text-xs text-stone-500">
                {activeRole === 'corporate' ? 'Corporate Wholesale Order (GST-Compliant)' : 'Individual Retail Basket'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 font-bold p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step: Cart Items Review */}
        {step === 'cart' && (
          <div className="py-4 space-y-4 overflow-y-auto flex-1">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Your cart is currently empty. Explore our catalog or customizer to add blooms!
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={item.image_url || '/rose_bouquet_realistic.jpg'} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">{item.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-stone-900 font-mono">
                            ₹{getItemPrice(item).toLocaleString()} each
                          </span>
                          {item.original_price && item.original_price > getItemPrice(item) && (
                            <span className="text-[10px] text-stone-400 line-through font-mono">
                              ₹{item.original_price.toLocaleString()}
                            </span>
                          )}
                          {item.decay_discount_percent > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              {Math.round(item.decay_discount_percent)}% Markdown
                            </span>
                          )}
                          {item.pot_name && item.pot_name !== 'Standard Nursery Grow Bag (Free)' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-medium">
                              {item.pot_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1.5 border border-stone-200 rounded-lg px-2 py-0.5 bg-stone-50">
                        <button 
                          type="button"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded font-bold text-sm transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-stone-800 px-1 min-w-[16px] text-center font-mono">
                          {item.quantity || 1}
                        </span>
                        <button 
                          type="button"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded font-bold text-sm transition-colors cursor-pointer"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-bold text-stone-900 font-mono w-16 text-right">
                        ₹{(getItemPrice(item) * (item.quantity || 1)).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="border-t border-stone-200 pt-4 space-y-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Delivery Destination Address:</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
                    required
                  />
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-2">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-bold text-[11px] text-emerald-800">
                          {deliveryEstimate.shortEta}
                        </span>
                        <p className="text-[10px] text-emerald-600">
                          {deliveryEstimate.originNotice}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 self-start sm:self-auto shrink-0">
                      {deliveryEstimate.transitSpeed}
                    </span>
                  </div>
                </div>

                {/* Promo Code & Voucher Section */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      <span>Promotional Discount Voucher</span>
                    </div>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {appliedCoupon.code} Applied
                      </span>
                    )}
                  </div>

                  {!appliedCoupon ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter code (e.g. BLOOM15, EARTHPOT25)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 p-2 rounded-xl border border-amber-200 bg-white text-xs uppercase font-mono tracking-wider focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-bold transition-all"
                        >
                          {isApplyingCoupon ? 'Verifying...' : 'Apply'}
                        </button>
                      </div>

                      {/* Quick Suggestion Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-amber-800/80 font-medium">Suggested:</span>
                        {['BLOOM15', 'EARTHPOT25', 'WELCOME100'].map((sCode) => (
                          <button
                            key={sCode}
                            type="button"
                            onClick={() => {
                              setCouponCode(sCode);
                            }}
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
                          >
                            {sCode}
                          </button>
                        ))}
                      </div>

                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-300">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block font-mono">
                          {appliedCoupon.code} • ₹{appliedCoupon.discount_amount} Savings
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {appliedCoupon.message}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove Coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Cart Subtotal</span>
                    <span className="font-mono font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Promo Discount ({appliedCoupon.code})</span>
                      <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="font-mono font-medium">₹{taxableSubtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST ({activeRole === 'corporate' ? '18% B2B' : '5% Retail'})</span>
                    <span className="font-mono font-medium">₹{tax.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Grand Total</span>
                    <span className="font-mono text-emerald-800">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Cash on Delivery Checkout */}
        {step === 'payment' && (
          <div className="py-6 space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-950 block">Payment Mode: Cash on Delivery (COD)</span>
                <span className="text-xs text-emerald-700">Cold-Chain Reefer Van Delivery from Kalmane Nursery</span>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-950">₹{grandTotal.toLocaleString()}</span>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-bold text-stone-700">Payment Option:</span>
              <div className="p-4 rounded-2xl border-2 border-emerald-700 bg-emerald-50/70 shadow-xs flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <strong className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</strong>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[10px] uppercase">
                      Official
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Pay securely upon cold-chain handover at your doorstep via Cash or instant UPI QR code directly to the refrigerated delivery fleet executive.
                  </p>
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-900 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>An official GST Tax Invoice will be generated and ready to print for this order.</span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handlePay}
                className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Confirm Order • Cash on Delivery (₹{grandTotal.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing Payment */}
        {step === 'processing' && (
          <div className="py-16 text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-emerald-700 animate-spin mx-auto" />
            <h4 className="font-serif text-xl font-bold text-stone-900">Confirming Your Order...</h4>
            <p className="text-xs text-stone-500">Reserving fresh harvest stems and generating your official GST tax invoice.</p>
          </div>
        )}

        {/* Step: Order Confirmed & Success */}
        {step === 'success' && createdOrder && (
          <div className="py-8 text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h4 className="font-serif text-2xl font-bold text-emerald-950">Order Confirmed!</h4>
              <p className="text-xs text-stone-600 mt-1">
                Order Reference: <strong className="font-mono text-stone-900">{createdOrder.order_number}</strong>
              </p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] uppercase tracking-wide border border-amber-300">
                Payment: Cash on Delivery (Pay upon arrival)
              </span>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl max-w-md mx-auto text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Payable on Delivery:</span>
                <strong className="font-mono text-emerald-900 text-sm">₹{createdOrder.total_amount?.toLocaleString() || createdOrder.total_amount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Mode:</span>
                <span className="text-stone-900 font-bold">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Dispatched To:</span>
                <span className="text-stone-800 font-medium truncate max-w-[200px]">{createdOrder.shipping_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tax Invoice:</span>
                <span className="text-emerald-700 font-bold uppercase text-[10px]">Official GST Tax Invoice Generated</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOrderSuccess(createdOrder);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>View &amp; Print Official GST Tax Invoice</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
