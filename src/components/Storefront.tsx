import React, { useState } from 'react';
import { 
  Store as StoreType, Product, StoreSettings, 
  CartItem, Order, Category 
} from '../types/storepilot';
import { StorePilotDB } from '../lib/storepilot-db';
import { 
  ShoppingBag, Search, X, Plus, Minus, Trash2, 
  ArrowRight, CheckCircle2, ShieldCheck, Truck, Sparkles, 
  Printer, ArrowLeft, Tag, Package, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvoiceModal } from './InvoiceModal';

interface StorefrontProps {
  store: StoreType;
  settings: StoreSettings;
  onBackToDashboard: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ store, settings, onBackToDashboard }) => {
  const products = StorePilotDB.getProducts(store.id);
  const categories = StorePilotDB.getCategories(store.id);
  const coupons = StorePilotDB.getCoupons(store.id);

  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLine1, setCheckoutLine1] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutState, setCheckoutState] = useState('');
  const [checkoutZip, setCheckoutZip] = useState('');
  const [checkoutCountry, setCheckoutCountry] = useState(store.country || 'United States');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setCartOpen(true);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const applyPromo = () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const found = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.is_active
    );
    if (!found) {
      setCouponError('Invalid promo code');
      return;
    }
    if (cartSubtotal < found.min_order_amount) {
      setCouponError(`Requires minimum order of $${found.min_order_amount}`);
      return;
    }

    let discountAmount = 0;
    if (found.discount_type === 'percentage') {
      discountAmount = (cartSubtotal * found.discount_value) / 100;
    } else {
      discountAmount = Math.min(found.discount_value, cartSubtotal);
    }
    setAppliedCoupon({ code: found.code, discount: discountAmount });
  };

  const calculatedDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const freeShipping = cartSubtotal >= settings.free_shipping_threshold;
  const shippingCost = cart.length === 0 ? 0 : freeShipping ? 0 : settings.shipping_flat_rate;
  const taxableBase = Math.max(0, cartSubtotal - calculatedDiscount);
  const taxCost = Number(((taxableBase * settings.tax_rate) / 100).toFixed(2));
  const finalTotal = Number((taxableBase + taxCost + shippingCost).toFixed(2));

  // Submit Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !checkoutName || !checkoutEmail) return;

    const result = StorePilotDB.createStorefrontOrder({
      store_id: store.id,
      customer_name: checkoutName,
      customer_email: checkoutEmail,
      shipping_address: {
        line1: checkoutLine1,
        city: checkoutCity,
        state: checkoutState,
        country: checkoutCountry,
        postal_code: checkoutZip,
      },
      cart: cart,
      coupon_code: appliedCoupon?.code,
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setCart([]);
    setAppliedCoupon(null);
    setCheckoutOpen(false);
    setCartOpen(false);
    setOrderSuccess(result.order);
  };

  // Order tracking
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError('');
    const allStoreOrders = StorePilotDB.getOrders(store.id);
    const found = allStoreOrders.find(
      (o) =>
        o.order_number.toLowerCase() === trackingOrderNumber.trim().toLowerCase() ||
        o.order_number.replace('#', '').toLowerCase() === trackingOrderNumber.trim().toLowerCase()
    );

    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackedOrder(null);
      setTrackingError('No order found with this reference. Check format (e.g. #SP-1001)');
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.status === 'active';
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Merchant Preview Control Banner */}
      <div className="bg-gray-950 text-white px-4 py-2 text-xs flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-gray-300">Live Customer Storefront:</span>
          <span className="font-mono text-emerald-400 font-bold">{store.name}</span>
          <span className="text-gray-500 hidden sm:inline">(&bull; storepilot.io/store/{store.slug})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTrackingModalOpen(true)}
            className="hover:text-emerald-400 font-medium transition-colors cursor-pointer text-[11px]"
          >
            Track Order
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <ArrowLeft className="w-3 h-3" /> Merchant Admin
          </button>
        </div>
      </div>

      {/* Announcement Bar */}
      {settings.show_announcement && settings.announcement && (
        <div
          className="text-white text-center py-2 px-4 text-xs font-semibold tracking-wide"
          style={{ backgroundColor: settings.theme_color }}
        >
          {settings.announcement}
        </div>
      )}

      {/* Storefront Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={store.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl text-white font-extrabold flex items-center justify-center text-lg shadow-sm"
                style={{ backgroundColor: settings.theme_color }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {store.name}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{store.country || 'Global Commerce'}</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="hidden sm:flex items-center relative w-72">
            <input
              type="text"
              placeholder="Search handcrafted products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-hidden focus:bg-white focus:border-gray-400 transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          </div>

          {/* Navigation & Cart Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTrackingModalOpen(true)}
              className="hidden md:block text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Order Status
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-800" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: settings.theme_color }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white py-16 sm:py-24">
        {settings.banner_url && (
          <img
            src={settings.banner_url}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-90"
          />
        )}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center space-y-4">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-xs bg-white/20 text-white"
          >
            Handcrafted Collection 2026
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {settings.banner_heading || `Welcome to ${store.name}`}
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
            {settings.banner_subheading || store.description || 'Find curated artisan pieces designed for longevity.'}
          </p>
        </div>
      </section>

      {/* Category Pills & Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 font-medium">
            Showing {filteredProducts.length} results
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-700">No products found</h3>
            <p className="text-xs text-gray-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((p) => {
              const isLowStock = p.track_quantity && p.quantity <= 5 && p.quantity > 0;
              const isOutOfStock = p.track_quantity && p.quantity === 0;

              return (
                <div
                  key={p.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div
                    className="relative aspect-4/3 sm:aspect-square bg-gray-50 overflow-hidden cursor-pointer"
                    onClick={() => setActiveProductModal(p)}
                  >
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                        Sale
                      </span>
                    )}

                    {isLowStock && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md">
                        Only {p.quantity} left
                      </span>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                        {p.tags[0] || 'Handcrafted'}
                      </div>
                      <h3
                        onClick={() => setActiveProductModal(p)}
                        className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {p.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-light">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-base font-black text-gray-900">
                          ${p.price.toFixed(2)}
                        </span>
                        {p.compare_at_price && (
                          <span className="text-xs text-gray-400 line-through">
                            ${p.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(p, 1)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-gray-800 text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isOutOfStock ? 'Sold Out' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-900" />
                <h3 className="font-extrabold text-gray-900 text-base">Your Cart</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-gray-400">
                  <ShoppingBag className="w-12 h-12 stroke-1" />
                  <p className="text-sm font-semibold text-gray-700">Your shopping bag is empty</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Explore our curated collection and add your favorite items to checkout.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 pb-4 border-b border-gray-100">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-900 truncate">{item.product.title}</h4>
                      <p className="text-xs font-mono font-semibold text-gray-700 mt-0.5">
                        ${item.product.price.toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 px-2 hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 px-2 hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-3 text-xs">
                {/* Coupon Code Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount code (e.g. SPRING75)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-3 py-2 bg-gray-900 text-white rounded-xl font-bold cursor-pointer hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>

                {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Code {appliedCoupon.code} applied (-${appliedCoupon.discount.toFixed(2)})
                  </p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-${appliedCoupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Shipping:</span>
                    <span className="font-mono">{freeShipping ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Sales Tax ({settings.tax_rate}%):</span>
                    <span className="font-mono">${taxCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Due:</span>
                    <span className="font-mono">${finalTotal.toFixed(2)} {store.currency}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Checkout & Order Placement</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    placeholder="Sophia Vance"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email for Receipt & Tracking</label>
                  <input
                    type="email"
                    required
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    placeholder="sophia@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Shipping Street Address</label>
                <input
                  type="text"
                  required
                  value={checkoutLine1}
                  onChange={(e) => setCheckoutLine1(e.target.value)}
                  placeholder="742 Evergreen Terrace"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                    placeholder="Portland"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={checkoutState}
                    onChange={(e) => setCheckoutState(e.target.value)}
                    placeholder="OR"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={checkoutZip}
                    onChange={(e) => setCheckoutZip(e.target.value)}
                    placeholder="97201"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Payment simulation notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulated Secure Payment Gateway: Test orders will be recorded with <strong>PAID</strong> status.</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl space-y-1.5 border border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartCount} items):</span>
                  <span className="font-mono font-semibold">${cartSubtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span className="font-mono">-${appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-mono">{freeShipping ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax ({settings.tax_rate}%):</span>
                  <span className="font-mono">${taxCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">${finalTotal.toFixed(2)} {store.currency}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md transition-colors cursor-pointer"
              >
                Pay & Place Order (${finalTotal.toFixed(2)})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Thank you for your order!</h3>
            <p className="text-xs text-gray-500">
              Your order <span className="font-bold text-gray-800 font-mono">{orderSuccess.order_number}</span> has been confirmed. A receipt was sent to {orderSuccess.customer_email}.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-left border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Charged:</span>
                <span className="font-bold text-gray-900 font-mono">${orderSuccess.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600 uppercase text-[10px]">Paid</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoiceOrder(orderSuccess)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> View Invoice
              </button>
              <button
                onClick={() => setOrderSuccess(null)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Quick View Modal */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-end">
              <button onClick={() => setActiveProductModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
              <img
                src={activeProductModal.images[0]}
                alt={activeProductModal.title}
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
              />
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {activeProductModal.sku || 'Handcrafted'}
                  </div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">
                    {activeProductModal.title}
                  </h2>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-2xl font-black text-gray-900">
                      ${activeProductModal.price.toFixed(2)}
                    </span>
                    {activeProductModal.compare_at_price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${activeProductModal.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                    {activeProductModal.description}
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => {
                      addToCart(activeProductModal, 1);
                      setActiveProductModal(null);
                    }}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add to Shopping Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Order Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" /> Customer Order Tracking
              </h3>
              <button onClick={() => setTrackingModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleTrackOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Enter Order Reference</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. #SP-1001"
                    value={trackingOrderNumber}
                    onChange={(e) => setTrackingOrderNumber(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>
              {trackingError && <p className="text-[11px] text-rose-600">{trackingError}</p>}
            </form>

            {trackedOrder && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="font-mono text-gray-900">{trackedOrder.order_number}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-100 text-indigo-800">
                    {trackedOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Recipient: <span className="font-semibold text-gray-800">{trackedOrder.customer_name}</span>
                </p>
                {trackedOrder.tracking_number && (
                  <p className="text-[11px] text-gray-500 font-mono">
                    Tracking Carrier: <span className="text-indigo-600 font-bold">{trackedOrder.tracking_number}</span>
                  </p>
                )}
                <div className="pt-2 flex justify-between items-center border-t border-gray-200">
                  <span className="font-bold text-gray-900 font-mono">${trackedOrder.total.toFixed(2)}</span>
                  <button
                    onClick={() => setSelectedInvoiceOrder(trackedOrder)}
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" /> View Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          store={store}
          settings={settings}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
