import React, { useState, useEffect } from 'react';
import { Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function GSTInvoiceModal({ orderId, isOpen, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      if (!orderId || !isOpen) return;
      setLoading(true);
      try {
        const res = await api.getInvoice(orderId);
        if (res.invoice) setInvoice(res.invoice);
      } catch (err) {
        console.error('Invoice fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [orderId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-300 relative animate-in fade-in zoom-in-95 duration-200 my-8 text-stone-900">
        
        {/* Controls Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 font-mono font-bold text-xs uppercase">
              GST Tax Invoice
            </span>
            <span className="text-xs text-stone-500 font-mono">{invoice?.invoice_number}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 font-bold p-1 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {loading || !invoice ? (
          <div className="py-20 text-center text-xs text-stone-500">Loading GST tax invoice records...</div>
        ) : (
          <div className="space-y-6 text-xs" id="printable-gst-invoice">
            
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  {invoice.supplier.trade_name}
                </h2>
                <p className="text-[11px] text-stone-600 max-w-sm mt-1 leading-relaxed">
                  {invoice.supplier.address}
                </p>
                <p className="text-[11px] font-mono font-bold text-stone-800 mt-1">
                  GSTIN: {invoice.supplier.gstin} • State: {invoice.supplier.state} (Code: {invoice.supplier.state_code})
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Tax Invoice</span>
                <div className="font-mono font-bold text-base text-stone-900">{invoice.invoice_number}</div>
                <div className="text-stone-500">Date: <strong className="text-stone-800">{invoice.invoice_date}</strong></div>
                <div className="text-stone-500">Order Ref: <strong className="text-stone-800">{invoice.order_number}</strong></div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Billed To (Recipient):</span>
                <strong className="text-sm font-bold text-stone-900 block">
                  {invoice.buyer.company_name || invoice.buyer.name}
                </strong>
                {invoice.buyer.company_name && (
                  <span className="text-stone-600 block">Attn: {invoice.buyer.name}</span>
                )}
                <p className="text-stone-600 mt-1">{invoice.buyer.address}</p>
                <span className="text-stone-500 block mt-0.5">Phone: {invoice.buyer.phone}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Tax Registration:</span>
                <div className="font-mono text-stone-900">
                  Buyer GSTIN: <strong>{invoice.buyer.gstin}</strong>
                </div>
                <div className="text-stone-600 mt-1">
                  Place of Supply: <strong className="text-stone-900">{invoice.place_of_supply}</strong>
                </div>
                <div className="text-stone-600">
                  Transaction Mode: <strong className="text-stone-900">{invoice.payment_details.method.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item Description & Botanical Name</th>
                    <th className="p-3 text-center">HSN</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-stone-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-stone-900">{item.item_name}</td>
                      <td className="p-3 text-center font-mono text-stone-600">0603</td>
                      <td className="p-3 text-center font-bold text-stone-800">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-stone-600">₹{item.unit_price}</td>
                      <td className="p-3 text-right font-mono font-bold text-stone-900">₹{item.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Calculation Ledger */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Taxable Value:</span>
                  <span className="font-mono">₹{invoice.tax_summary.subtotal.toLocaleString()}</span>
                </div>

                {invoice.tax_summary.cgst > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Central GST (CGST {invoice.tax_summary.tax_rate_percent / 2}%):</span>
                    <span className="font-mono">₹{invoice.tax_summary.cgst.toLocaleString()}</span>
                  </div>
                )}

                {invoice.tax_summary.sgst > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>State GST (SGST {invoice.tax_summary.tax_rate_percent / 2}%):</span>
                    <span className="font-mono">₹{invoice.tax_summary.sgst.toLocaleString()}</span>
                  </div>
                )}

                {invoice.tax_summary.igst > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Integrated GST (IGST {invoice.tax_summary.tax_rate_percent}%):</span>
                    <span className="font-mono">₹{invoice.tax_summary.igst.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-emerald-950 pt-2 border-t border-stone-200">
                  <span>Grand Invoice Total:</span>
                  <span className="font-mono">₹{invoice.tax_summary.grand_total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Digital Stamp Signature */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>GST Verified & Digitally Authenticated</span>
              </div>

              <div className="text-right">
                <div className="w-32 h-10 border-b border-dashed border-stone-400 mb-1"></div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Authorized Signatory</span>
                <span className="text-[11px] font-bold text-stone-800">Green Nest Bloom Pvt. Ltd.</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
