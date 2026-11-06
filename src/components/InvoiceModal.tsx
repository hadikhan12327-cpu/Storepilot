import React from 'react';
import { Order, Store, StoreSettings } from '../types/storepilot';
import { Printer, X, CheckCircle, Package } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  store: Store;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, store, settings, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100 print:p-0 print:border-none print:shadow-none">
        {/* Controls - hidden when printing */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Order Invoice
            </span>
            <span className="text-sm font-medium text-gray-500">{order.order_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="space-y-6 text-gray-800 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={store.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: settings.theme_color }}
                  >
                    {store.name.charAt(0)}
                  </div>
                )}
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
              </div>
              <p className="text-xs text-gray-500">storepilot.io/store/{store.slug}</p>
              <p className="text-xs text-gray-500">{store.country || 'Global Commerce'}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-gray-900 tracking-tight">INVOICE</span>
              <p className="text-xs text-gray-500 font-mono mt-1">Invoice ID: INV-{order.order_number.replace('#', '')}</p>
              <p className="text-xs text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                {order.payment_status}
              </div>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1.5">Billed & Shipped To</h3>
              <p className="font-semibold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-600">{order.customer_email}</p>
              <p className="text-xs text-gray-600 mt-1">{order.shipping_address.line1}</p>
              <p className="text-xs text-gray-600">
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              </p>
              <p className="text-xs text-gray-600">{order.shipping_address.country}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1.5">Order Details</h3>
              <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Status:</span> {order.status.toUpperCase()}</p>
              <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Currency:</span> {order.currency}</p>
              {order.tracking_number && (
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium text-gray-800">Tracking:</span> {order.tracking_number}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.product_title}</div>
                      {item.variant_title && (
                        <div className="text-xs text-gray-500">Variant: {item.variant_title}</div>
                      )}
                      {item.sku && <div className="text-[11px] text-gray-400 font-mono">SKU: {item.sku}</div>}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-700 font-mono">${item.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 font-mono">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax:</span>
                <span className="font-mono">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping:</span>
                <span className="font-mono">${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Due:</span>
                <span className="font-mono">${order.total.toFixed(2)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              Thank you for supporting independent merchant stores powered by StorePilot.
            </p>
            <p>For questions or customer support regarding this order, please reply directly to this notification.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
