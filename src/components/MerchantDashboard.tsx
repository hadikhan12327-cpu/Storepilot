import React, { useState, useEffect } from 'react';
import { 
  Store as StoreType, Product, Category, Customer, 
  Order, Coupon, StoreSettings, Profile 
} from '../types/storepilot';
import { StorePilotDB, DEFAULT_PLANS } from '../lib/storepilot-db';
import { 
  Plus, Edit2, Trash2, Package, ShoppingCart, Users, Tag, 
  Settings, BarChart3, Search, Filter, ExternalLink, Printer, 
  Sliders, ArrowUpRight, TrendingUp, AlertTriangle, Check, 
  ChevronRight, RefreshCw, Eye, Sparkles, Image as ImageIcon, Database,
  Copy, Key, ShieldCheck, CheckCircle2, AlertCircle, Terminal, Download
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
import { 
  getSupabaseStatus, saveSupabaseCredentials, 
  clearSupabaseCredentials, testSupabaseConnection 
} from '../lib/supabase';

interface MerchantDashboardProps {
  store: StoreType;
  stores: StoreType[];
  settings: StoreSettings;
  profile: Profile;
  onRefreshData: () => void;
  onOpenStorefront: () => void;
  onOpenCreateStore: () => void;
  onOpenSupabaseModal?: () => void;
}

type DashboardTab = 'analytics' | 'products' | 'inventory' | 'orders' | 'customers' | 'discounts' | 'settings' | 'database';

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  store,
  stores,
  settings,
  profile,
  onRefreshData,
  onOpenStorefront,
  onOpenCreateStore,
  onOpenSupabaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');

  // Supabase Dedicated Tab State
  const [sbUrl, setSbUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_url') || '' : ''));
  const [sbKey, setSbKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('storepilot_supabase_key') || '' : ''));
  const [sbStatus, setSbStatus] = useState(() => getSupabaseStatus());
  const [sbTesting, setSbTesting] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    setSbStatus(getSupabaseStatus());
    const storedUrl = localStorage.getItem('storepilot_supabase_url') || '';
    const storedKey = localStorage.getItem('storepilot_supabase_key') || '';
    if (storedUrl) setSbUrl(storedUrl);
    if (storedKey) setSbKey(storedKey);
  }, [activeTab]);

  // Data
  const products = StorePilotDB.getProducts(store.id);
  const categories = StorePilotDB.getCategories(store.id);
  const orders = StorePilotDB.getOrders(store.id);
  const customers = StorePilotDB.getCustomers(store.id);
  const coupons = StorePilotDB.getCoupons(store.id);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);

  // Product Form state
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('29.00');
  const [prodComparePrice, setProdComparePrice] = useState('');
  const [prodCost, setProdCost] = useState('12.00');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodQty, setProdQty] = useState('20');
  const [prodSku, setProdSku] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodTags, setProdTags] = useState('New, Handcrafted');

  // Settings Form state
  const [themeColor, setThemeColor] = useState(settings.theme_color || '#4f46e5');
  const [bannerHeading, setBannerHeading] = useState(settings.banner_heading || '');
  const [bannerSubheading, setBannerSubheading] = useState(settings.banner_subheading || '');
  const [announcement, setAnnouncement] = useState(settings.announcement || '');
  const [taxRate, setTaxRate] = useState(settings.tax_rate.toString());
  const [shippingRate, setShippingRate] = useState(settings.shipping_flat_rate.toString());
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.free_shipping_threshold.toString());
  const [metaTitle, setMetaTitle] = useState(settings.meta_title || store.name);
  const [metaDesc, setMetaDesc] = useState(settings.meta_description || store.description || '');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Coupon form state
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponVal, setCouponVal] = useState('15');
  const [couponMin, setCouponMin] = useState('50');

  // Filter / Search states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Calculate analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total : 0), 0);
  const totalItemsSold = orders.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lowStockCount = products.filter(p => p.track_quantity && p.quantity <= 5).length;

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdPrice('29.00');
    setProdComparePrice('');
    setProdCost('10.00');
    setProdDesc('');
    setProdCategory(categories[0]?.id || '');
    setProdQty('25');
    setProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setProdImage('https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80');
    setProdTags('Featured, Eco-friendly');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdTitle(prod.title);
    setProdPrice(prod.price.toString());
    setProdComparePrice(prod.compare_at_price ? prod.compare_at_price.toString() : '');
    setProdCost(prod.cost_per_item ? prod.cost_per_item.toString() : '0');
    setProdDesc(prod.description);
    setProdCategory(prod.category_id || '');
    setProdQty(prod.quantity.toString());
    setProdSku(prod.sku || '');
    setProdImage(prod.images[0] || '');
    setProdTags(prod.tags.join(', '));
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) return;

    StorePilotDB.saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      store_id: store.id,
      title: prodTitle.trim(),
      price: parseFloat(prodPrice) || 0,
      compare_at_price: prodComparePrice ? parseFloat(prodComparePrice) : undefined,
      cost_per_item: parseFloat(prodCost) || 0,
      description: prodDesc,
      category_id: prodCategory || undefined,
      quantity: parseInt(prodQty) || 0,
      sku: prodSku.trim(),
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      tags: prodTags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'active',
      track_quantity: true,
    });

    setProductModalOpen(false);
    onRefreshData();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      StorePilotDB.deleteProduct(id);
      onRefreshData();
    }
  };

  const handleStockAdjust = (product: Product, delta: number) => {
    const newQty = Math.max(0, product.quantity + delta);
    StorePilotDB.saveProduct({
      ...product,
      quantity: newQty,
    });
    onRefreshData();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorePilotDB.updateSettings(store.id, {
      theme_color: themeColor,
      banner_heading: bannerHeading,
      banner_subheading: bannerSubheading,
      announcement: announcement,
      tax_rate: parseFloat(taxRate) || 0,
      shipping_flat_rate: parseFloat(shippingRate) || 0,
      free_shipping_threshold: parseFloat(freeShippingThreshold) || 0,
      meta_title: metaTitle,
      meta_description: metaDesc,
    });

    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
    onRefreshData();
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    StorePilotDB.saveCoupon(store.id, {
      code: couponCode.trim(),
      discount_type: couponType,
      discount_value: parseFloat(couponVal) || 0,
      min_order_amount: parseFloat(couponMin) || 0,
      is_active: true,
    });

    setCouponModalOpen(false);
    setCouponCode('');
    onRefreshData();
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    StorePilotDB.updateOrderStatus(orderId, status);
    onRefreshData();
  };

  // Filter products
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Filter orders
  const filteredOrders = orders.filter(o => 
    orderStatusFilter === 'all' ? true : o.status === orderStatusFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Active Store Header */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Merchant Store</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm truncate">{store.name}</h3>
            <p className="text-[11px] text-gray-500 font-mono">/{store.slug}</p>
            <div className="pt-2 flex gap-1.5">
              <button
                onClick={onOpenStorefront}
                className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> View Store
              </button>
              <button
                onClick={onOpenCreateStore}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                title="Create another store"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" /> Analytics & Sales
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" /> Products Catalog
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" /> Inventory Tracker
              </span>
              {lowStockCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {lowStockCount} low
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4" /> Orders & Invoices
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" /> Customers CRM
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('discounts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'discounts'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Tag className="w-4 h-4" /> Discounts & Coupons
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
                {coupons.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" /> Store Settings & SEO
              </span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Database className="w-4 h-4" /> Supabase & API Keys
              </span>
              <span className={`w-2 h-2 rounded-full ${sbStatus.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>
          </nav>
        </div>

        {/* Plan card in sidebar footer */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-500">
            <span>Stores used:</span>
            <span className="font-semibold text-gray-900">
              {stores.length} / {DEFAULT_PLANS.find(p => p.code === profile.plan_code)?.max_stores || 1}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (stores.length / (DEFAULT_PLANS.find(p => p.code === profile.plan_code)?.max_stores || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight capitalize">
              {activeTab === 'analytics' && 'Sales & Store Performance'}
              {activeTab === 'products' && 'Product Catalog'}
              {activeTab === 'inventory' && 'Inventory Management'}
              {activeTab === 'orders' && 'Orders & Invoices'}
              {activeTab === 'customers' && 'Customer Management'}
              {activeTab === 'discounts' && 'Coupons & Promotions'}
              {activeTab === 'settings' && 'Store Customizer & Global Settings'}
              {activeTab === 'database' && 'Supabase Database & API Credentials'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Managing store: <span className="font-semibold text-gray-800">{store.name}</span> ({store.currency})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'products' && (
              <button
                onClick={openNewProductModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Product
              </button>
            )}

            {activeTab === 'discounts' && (
              <button
                onClick={() => setCouponModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Coupon
              </button>
            )}

            <button
              onClick={onOpenStorefront}
              className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview Storefront
            </button>
          </div>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-gray-400">Total Net Revenue</span>
                <div className="text-2xl font-black text-gray-900 font-mono">
                  ${totalRevenue.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3" /> +18.4% from last month
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-gray-400">Completed Orders</span>
                <div className="text-2xl font-black text-gray-900 font-mono">
                  {orders.length}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {totalItemsSold} total items fulfilled
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-gray-400">Average Order Value</span>
                <div className="text-2xl font-black text-gray-900 font-mono">
                  ${avgOrderValue.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  Across {customers.length} unique buyers
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-gray-400">Active Products</span>
                <div className="text-2xl font-black text-gray-900 font-mono">
                  {products.length}
                </div>
                <div className="text-[11px] text-amber-600 font-medium">
                  {lowStockCount} items low in inventory
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-2xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Customer Orders</h3>
                  <p className="text-xs text-gray-500">Live incoming sales from your online storefront</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View all orders <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 px-3">Order</th>
                      <th className="pb-3 px-3">Customer</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Items</th>
                      <th className="pb-3 px-3 text-right">Total</th>
                      <th className="pb-3 px-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/60">
                        <td className="py-3 px-3 font-bold text-gray-900 font-mono">{ord.order_number}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-800">{ord.customer_name}</div>
                          <div className="text-[10px] text-gray-400">{ord.customer_email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            ord.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            ord.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{ord.items?.length || 1} item(s)</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900 font-mono">${ord.total.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors cursor-pointer"
                            title="Generate invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search products by title or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Inventory</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{p.title}</div>
                            <div className="text-[11px] text-gray-400 truncate max-w-xs">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{p.sku || '—'}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                        ${p.price.toFixed(2)}
                        {p.compare_at_price && (
                          <span className="ml-1.5 text-[10px] text-gray-400 line-through font-normal">
                            ${p.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.quantity <= 5
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.quantity} in stock
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-gray-900">Real-Time Stock Adjustment</h3>
                <p className="text-gray-500">Fast inventory adjustments update instantly across storefront catalog</p>
              </div>
              <div className="px-3 py-1 bg-amber-50 text-amber-800 font-semibold rounded-lg text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Threshold: 5 units
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4 text-center">Adjust Inventory</th>
                    <th className="py-3 px-4 text-right">Inventory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{p.title}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{p.sku || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 text-sm font-mono">{p.quantity}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStockAdjust(p, -5)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono font-bold cursor-pointer"
                            title="Decrease 5"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleStockAdjust(p, -1)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono font-bold cursor-pointer"
                            title="Decrease 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleStockAdjust(p, 1)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-mono font-bold cursor-pointer"
                            title="Increase 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleStockAdjust(p, 5)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-mono font-bold cursor-pointer"
                            title="Increase 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.quantity === 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Out of Stock
                          </span>
                        ) : p.quantity <= 5 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Low Stock Alert
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 text-xs">
              <div className="flex gap-2">
                {['all', 'pending', 'processing', 'shipped', 'delivered'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-gray-500">{filteredOrders.length} orders found</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status & Fulfill</th>
                    <th className="py-3 px-4">Items Breakdown</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono">{ord.order_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{ord.customer_name}</div>
                        <div className="text-[11px] text-gray-400">{ord.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                          className="px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:outline-hidden"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            {it.quantity}x {it.product_title}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 font-mono">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-gray-900">Customer Directory</h3>
                <p className="text-gray-500">Profiles, lifetime orders count, and total gross spend</p>
              </div>
              <span className="font-semibold text-gray-700">{customers.length} Registered Customers</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Orders Placed</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.first_name} {c.last_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <div>{c.email}</div>
                        {c.phone && <div className="text-[11px] text-gray-400">{c.phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.address?.city ? `${c.address.city}, ${c.address.country || 'Global'}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600 font-mono">
                        {c.orders_count}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 font-mono">
                        ${c.total_spent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: DISCOUNTS / COUPONS */}
        {activeTab === 'discounts' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-gray-900">Promotions & Promotional Codes</h3>
                <p className="text-gray-500">Discount codes applied at storefront checkout with live calculations</p>
              </div>
              <button
                onClick={() => setCouponModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-black text-sm rounded-lg border border-indigo-200">
                      {c.code}
                    </span>
                    <button
                      onClick={() => {
                        StorePilotDB.deleteCoupon(c.id);
                        onRefreshData();
                      }}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xl font-black text-gray-900">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                  </div>

                  <p className="text-xs text-gray-500">
                    Minimum order: <span className="font-mono font-semibold">${c.min_order_amount}</span>
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>Used: {c.times_used} times</span>
                    <span className="text-emerald-600 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & CUSTOMIZATION */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl space-y-6">
            {settingsSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Store settings and SEO updated successfully!
              </div>
            )}

            {/* Supabase Integration Box */}
            <div className="p-4 bg-linear-to-r from-indigo-50 to-violet-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Supabase Cloud Database & Auth</h4>
                  <p className="text-[11px] text-gray-600">Connect your Supabase Project URL, API Keys, and run the SQL schema migration.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                Open API Credentials & SQL
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {/* Branding */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Branding & Theme Styling
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Theme Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-10 h-10 p-1 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Announcement Top Bar</label>
                    <input
                      type="text"
                      value={announcement}
                      onChange={(e) => setAnnouncement(e.target.value)}
                      placeholder="Free worldwide shipping over $50!"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Storefront Banner Heading</label>
                  <input
                    type="text"
                    value={bannerHeading}
                    onChange={(e) => setBannerHeading(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Storefront Banner Subheading</label>
                  <input
                    type="text"
                    value={bannerSubheading}
                    onChange={(e) => setBannerSubheading(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* International Shipping & Taxes */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Shipping & Sales Tax Rates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Sales Tax (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Flat Rate Shipping ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={shippingRate}
                      onChange={(e) => setShippingRate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Free Shipping Over ($)</label>
                    <input
                      type="number"
                      step="1"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Search Engine Optimization */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Search Engine Optimization (SEO)
                </h3>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                {/* Google SERP Preview Box */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="text-[11px] text-gray-400 uppercase font-semibold">Google Search Preview</div>
                  <div className="text-indigo-800 text-sm font-semibold truncate hover:underline cursor-pointer">
                    {metaTitle || `${store.name} — StorePilot`}
                  </div>
                  <div className="text-emerald-700 text-[11px]">https://storepilot.io/store/{store.slug}</div>
                  <div className="text-gray-600 text-[11px] line-clamp-2">
                    {metaDesc || store.description || 'Visit our online shop to browse quality products.'}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 8: SUPABASE DATABASE & API CREDENTIALS */}
        {activeTab === 'database' && (
          <div className="space-y-6 max-w-4xl">
            {/* Status overview card */}
            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${sbStatus.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      {sbStatus.isConfigured ? 'Connected to Remote Supabase Cloud' : 'Running on Built-in Multi-Tenant Engine'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {sbStatus.isConfigured 
                        ? `Live database endpoint: ${sbStatus.url}` 
                        : 'StorePilot is persisting all stores, products, and orders locally. Add your Supabase credentials below to sync with PostgreSQL.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setSbTesting(true);
                      setSbTestResult(null);
                      const res = await testSupabaseConnection();
                      setSbTesting(false);
                      setSbTestResult(res);
                    }}
                    disabled={sbTesting}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sbTesting ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </div>
              </div>

              {sbTestResult && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  sbTestResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {sbTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div>
                    <p className="font-semibold">{sbTestResult.success ? 'Supabase Connected' : 'Notice'}</p>
                    <p className="mt-0.5">{sbTestResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step-by-step visual helper: Where to find credentials in Supabase */}
            <div className="p-5 bg-linear-to-r from-indigo-50/70 via-purple-50/70 to-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                Where to find your API credentials in Supabase:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-indigo-900">
                <div className="p-3.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                  <span className="font-bold text-indigo-700 text-[11px] uppercase tracking-wide">Method 1 (Fastest):</span>
                  <p className="text-[11px] leading-relaxed">
                    1. Open your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold">supabase.com/dashboard</a>.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    2. Click the green/white <strong>Connect</strong> button in the top navigation bar.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    3. Select <strong>App Frameworks</strong> &rarr; copy <strong>URL</strong> and <strong>Anon Key</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                  <span className="font-bold text-indigo-700 text-[11px] uppercase tracking-wide">Method 2 (Settings Menu):</span>
                  <p className="text-[11px] leading-relaxed">
                    1. In the left sidebar, click <strong>Project Settings (gear icon ⚙️)</strong>.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    2. Click <strong>API</strong> (or <strong>Data API / API Keys</strong>).
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    3. Copy <strong>Project URL</strong> and the key tagged <strong>anon public</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Input Form */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-5">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Configure Supabase API Credentials
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!sbUrl.trim() || !sbKey.trim()) return;
                  saveSupabaseCredentials(sbUrl, sbKey);
                  const status = getSupabaseStatus();
                  setSbStatus(status);
                  setSbUrl(status.rawUrl || sbUrl.trim());
                  setSbTesting(true);
                  setSbTestResult(null);
                  const res = await testSupabaseConnection();
                  setSbTesting(false);
                  setSbTestResult(res);
                  onRefreshData();
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white text-xs font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format: https://[your-project-ref].supabase.co
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Supabase Anon / Public API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white text-xs font-mono pr-10"
                    />
                    <Key className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Use your public <strong>anon</strong> key. Never use the secret <code>service_role</code> key on the client.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                  {sbStatus.isConfigured ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearSupabaseCredentials();
                        setSbUrl('');
                        setSbKey('');
                        setSbStatus(getSupabaseStatus());
                        setSbTestResult({ success: false, message: 'Switched to local database.' });
                        onRefreshData();
                      }}
                      className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Disconnect & Use Local Engine
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Client-side Row Level Security
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={sbTesting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {sbTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Save & Connect Database
                  </button>
                </div>
              </form>
            </div>

            {/* SQL Migration Schema & One-Click Copy */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600" /> Database Migration Script (schema_full.sql)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Run this once in the Supabase SQL Editor to provision all tables and RLS policies.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/schema_full.sql');
                      const text = await res.text();
                      await navigator.clipboard.writeText(text);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    } catch {
                      setCopiedSql(false);
                    }
                  }}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Complete SQL
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-gray-900 text-gray-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-gray-800">
                <pre>{`-- StorePilot: Complete Unified Supabase Production Schema
-- Contains Plans, Profiles, Stores, Settings, Categories, Products,
-- Product Variants, Customers, Coupons, Orders, and Order Items
-- with Row Level Security (RLS) policies and plan limits.

-- Click "Copy Complete SQL" to copy the full 300+ line script into your clipboard,
-- then open Supabase > SQL Editor > New Query > Paste > Run.`}</pre>
              </div>
            </div>

            {/* Claude Upload File Card */}
            <div className="p-6 bg-linear-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 border border-amber-200/90 rounded-2xl shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    CL
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      Claude Session Upload File (`storepilot_claude_export.md`)
                    </h3>
                    <p className="text-xs text-gray-600">
                      Unified bundle containing the complete StorePilot specification, full SQL migration script, TypeScript models, Supabase client, and component architecture.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href="/storepilot_claude_export.md"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-gray-50 border border-amber-300 text-gray-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" /> View File
                  </a>
                  <a
                    href="/storepilot_claude_export.md"
                    download="storepilot_claude_export.md"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download for Claude
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="e.g. Stoneware Ceramic Pitcher"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Compare-at Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="Optional original price"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Inventory Quantity</label>
                  <input
                    type="number"
                    required
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
                {prodImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={prodImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
                    <span className="text-[11px] text-gray-400">Image preview valid</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Product material, story, and dimensions..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
                >
                  <option value="">General Products</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Create Discount Coupon
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Coupon Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono uppercase text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={couponVal}
                    onChange={(e) => setCouponVal(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Minimum Order Subtotal ($)</label>
                <input
                  type="number"
                  step="1"
                  value={couponMin}
                  onChange={(e) => setCouponMin(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Code
                </button>
              </div>
            </form>
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
