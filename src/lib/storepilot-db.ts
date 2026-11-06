import { 
  Store, Product, Category, Customer, Order, Coupon, 
  StoreSettings, Profile, Plan, PlanCode, ProductVariant, OrderItem, CartItem 
} from '../types/storepilot';
import { getSupabaseClient } from './supabase';

const DB_STORAGE_KEY = 'storepilot_data_store_v1';
const CURRENT_USER_KEY = 'storepilot_active_user_v1';
const CURRENT_STORE_KEY = 'storepilot_active_store_id_v1';

export const DEFAULT_PLANS: Plan[] = [
  {
    code: 'free',
    name: 'Free',
    price_monthly: 0,
    max_stores: 1,
    features: ['1 Online Store', 'Up to 25 Products', 'Standard Checkout', 'Basic Sales Analytics', 'Community Support']
  },
  {
    code: 'starter',
    name: 'Starter',
    price_monthly: 9,
    max_stores: 1,
    features: ['1 Online Store', 'Unlimited Products', 'Custom Domain Support', 'Discount Coupons', 'Standard Analytics', 'Email Support']
  },
  {
    code: 'business',
    name: 'Business',
    price_monthly: 19,
    max_stores: 3,
    features: ['3 Online Stores', 'Unlimited Products', 'Inventory Alerts', 'Customer Accounts', 'Automated Invoicing', 'Priority Support']
  },
  {
    code: 'professional',
    name: 'Professional',
    price_monthly: 39,
    max_stores: 10,
    features: ['10 Online Stores', 'Dedicated Account Manager', 'Custom Themes & CSS', 'Multi-Currency & Tax Engine', 'Advanced Analytics', '24/7 Phone & Chat Support']
  }
];

// Seed initial high quality multi-tenant store
const INITIAL_STORE_ID = 'store_aura_001';
const INITIAL_USER_ID = 'usr_merchant_001';

const INITIAL_PROFILE: Profile = {
  id: INITIAL_USER_ID,
  email: 'merchant@storepilot.io',
  full_name: 'Alex Chen',
  plan_code: 'business',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  is_admin: false,
};

const INITIAL_STORE: Store = {
  id: INITIAL_STORE_ID,
  owner_id: INITIAL_USER_ID,
  name: 'Aura Living',
  slug: 'aura-living',
  description: 'Minimalist sustainable homeware, artisan ceramics, and organic textiles crafted for mindful living.',
  currency: 'USD',
  country: 'United States',
  status: 'active',
  created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  updated_at: new Date().toISOString()
};

const INITIAL_SETTINGS: StoreSettings = {
  store_id: INITIAL_STORE_ID,
  theme_color: '#4f46e5',
  font_family: 'Inter',
  logo_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80',
  banner_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
  banner_heading: 'Mindful Objects for Modern Living',
  banner_subheading: 'Ethically crafted ceramics, handwoven linens, and warm natural lighting designed to elevate your everyday sanctuary.',
  announcement: '✨ Spring Equinox: Enjoy free international delivery on orders over $75 with code SPRING75',
  show_announcement: true,
  tax_rate: 6.5,
  shipping_flat_rate: 8.50,
  free_shipping_threshold: 75.00,
  social_instagram: 'https://instagram.com/auraliving',
  social_twitter: 'https://twitter.com/auraliving',
  social_facebook: 'https://facebook.com/auraliving',
  meta_title: 'Aura Living — Sustainable Lifestyle & Home Goods',
  meta_description: 'Discover handcrafted organic home goods and ceramics designed for mindful, peaceful spaces.'
};

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_ceramics',
    store_id: INITIAL_STORE_ID,
    name: 'Ceramics & Tableware',
    slug: 'ceramics-tableware',
    description: 'Hand-thrown stoneware and artisanal dinner sets.',
    image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_lighting',
    store_id: INITIAL_STORE_ID,
    name: 'Lighting & Ambiance',
    slug: 'lighting-ambiance',
    description: 'Warm mood lamps, ribbed lanterns, and soy candles.',
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'cat_textiles',
    store_id: INITIAL_STORE_ID,
    name: 'Linen & Textiles',
    slug: 'linen-textiles',
    description: 'Stone-washed European flax blankets and linen cushions.',
    image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString()
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_matte_pitcher',
    store_id: INITIAL_STORE_ID,
    category_id: 'cat_ceramics',
    title: 'Kinfolk Hand-Thrown Ceramic Pitcher',
    slug: 'kinfolk-ceramic-pitcher',
    description: 'Sculptural stoneware pitcher glazed in chalk white matte finish. Holds 1.4 liters of cold beverages or displays dry botanical stems gracefully.',
    price: 64.00,
    compare_at_price: 78.00,
    cost_per_item: 24.00,
    sku: 'AURA-CER-001',
    barcode: '849204018291',
    track_quantity: true,
    quantity: 18,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['Ceramics', 'Handmade', 'Kitchen', 'Bestseller'],
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_flax_throw',
    store_id: INITIAL_STORE_ID,
    category_id: 'cat_textiles',
    title: 'Washed Belgian Linen Throw Blanket',
    slug: 'washed-belgian-linen-throw',
    description: 'Crafted from 100% pre-washed French flax linen. Exceptionally breathable, naturally hypoallergenic, and softens with every wash.',
    price: 110.00,
    compare_at_price: 135.00,
    cost_per_item: 48.00,
    sku: 'AURA-TEX-004',
    barcode: '849204018305',
    track_quantity: true,
    quantity: 24,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['Linen', 'Living Room', 'Organic', 'Cozy'],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_wabi_lamp',
    store_id: INITIAL_STORE_ID,
    category_id: 'cat_lighting',
    title: 'Wabi-Sabi Pleated Table Lamp',
    slug: 'wabi-sabi-pleated-lamp',
    description: 'Textured cast iron base with an origami-folded rice paper shade that diffuses a warm amber glow. Includes warm 2700K dimmable LED bulb.',
    price: 89.00,
    compare_at_price: 99.00,
    cost_per_item: 35.00,
    sku: 'AURA-LGT-009',
    barcode: '849204018440',
    track_quantity: true,
    quantity: 9,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['Lighting', 'Bedroom', 'Dimmable'],
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_tea_mugs',
    store_id: INITIAL_STORE_ID,
    category_id: 'cat_ceramics',
    title: 'Earth & Ash Speckled Mug Set (Pair)',
    slug: 'earth-ash-speckled-mugs',
    description: 'A duo of wheel-thrown ceramic mugs with raw toasted clay bottom and satin oatmeal glaze. Ergonomic handle tailored for comfort.',
    price: 42.00,
    cost_per_item: 16.00,
    sku: 'AURA-CER-012',
    barcode: '849204018912',
    track_quantity: true,
    quantity: 32,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['Ceramics', 'Coffee', 'Gift Guide'],
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cedar_candle',
    store_id: INITIAL_STORE_ID,
    category_id: 'cat_lighting',
    title: 'Hinoki & Smoked Cedar Soy Candle',
    slug: 'hinoki-cedar-soy-candle',
    description: 'Poured in small batches using 100% renewable US soy wax, organic cotton wick, and pure botanical essential oils. Burn time 55 hours.',
    price: 34.00,
    cost_per_item: 11.00,
    sku: 'AURA-CND-003',
    barcode: '849204018774',
    track_quantity: true,
    quantity: 45,
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['Candle', 'Aromatherapy', 'Wellness'],
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup_spring75',
    store_id: INITIAL_STORE_ID,
    code: 'SPRING75',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 50,
    usage_limit: 500,
    times_used: 42,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'coup_welcome10',
    store_id: INITIAL_STORE_ID,
    code: 'WELCOME10',
    discount_type: 'fixed',
    discount_value: 10,
    min_order_amount: 40,
    usage_limit: 1000,
    times_used: 128,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_001',
    store_id: INITIAL_STORE_ID,
    email: 'sophia.vance@example.com',
    first_name: 'Sophia',
    last_name: 'Vance',
    phone: '+1 (555) 234-5678',
    address: {
      line1: '742 Evergreen Terrace',
      city: 'Portland',
      state: 'OR',
      country: 'United States',
      postal_code: '97201'
    },
    orders_count: 3,
    total_spent: 312.00,
    notes: 'Architect interior enthusiast, loves ceramics.',
    created_at: new Date(Date.now() - 22 * 86400000).toISOString()
  },
  {
    id: 'cust_002',
    store_id: INITIAL_STORE_ID,
    email: 'marcus.lindqvist@example.com',
    first_name: 'Marcus',
    last_name: 'Lindqvist',
    phone: '+46 8 123 4567',
    address: {
      line1: 'Birger Jarlsgatan 14',
      city: 'Stockholm',
      state: 'Stockholm',
      country: 'Sweden',
      postal_code: '114 34'
    },
    orders_count: 2,
    total_spent: 174.00,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'cust_003',
    store_id: INITIAL_STORE_ID,
    email: 'elena.rostova@example.com',
    first_name: 'Elena',
    last_name: 'Rostova',
    phone: '+1 (415) 890-1234',
    address: {
      line1: '388 Market St Suite 1200',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postal_code: '94111'
    },
    orders_count: 1,
    total_spent: 89.00,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    store_id: INITIAL_STORE_ID,
    order_number: '#SP-1001',
    customer_id: 'cust_001',
    customer_email: 'sophia.vance@example.com',
    customer_name: 'Sophia Vance',
    subtotal: 153.00,
    discount: 15.00,
    tax: 8.97,
    shipping: 0,
    total: 146.97,
    currency: 'USD',
    status: 'delivered',
    payment_status: 'paid',
    shipping_address: {
      line1: '742 Evergreen Terrace',
      city: 'Portland',
      state: 'OR',
      country: 'United States',
      postal_code: '97201'
    },
    tracking_number: 'SP-USPS-940011189922',
    items: [
      {
        id: 'item_1',
        order_id: 'ord_1001',
        store_id: INITIAL_STORE_ID,
        product_id: 'prod_matte_pitcher',
        product_title: 'Kinfolk Hand-Thrown Ceramic Pitcher',
        price: 64.00,
        quantity: 1,
        line_total: 64.00,
        image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'item_2',
        order_id: 'ord_1001',
        store_id: INITIAL_STORE_ID,
        product_id: 'prod_wabi_lamp',
        product_title: 'Wabi-Sabi Pleated Table Lamp',
        price: 89.00,
        quantity: 1,
        line_total: 89.00,
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80'
      }
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'ord_1002',
    store_id: INITIAL_STORE_ID,
    order_number: '#SP-1002',
    customer_id: 'cust_002',
    customer_email: 'marcus.lindqvist@example.com',
    customer_name: 'Marcus Lindqvist',
    subtotal: 110.00,
    discount: 0,
    tax: 7.15,
    shipping: 0,
    total: 117.15,
    currency: 'USD',
    status: 'shipped',
    payment_status: 'paid',
    shipping_address: {
      line1: 'Birger Jarlsgatan 14',
      city: 'Stockholm',
      state: 'Stockholm',
      country: 'Sweden',
      postal_code: '114 34'
    },
    tracking_number: 'DHL-EX-992182741SE',
    items: [
      {
        id: 'item_3',
        order_id: 'ord_1002',
        store_id: INITIAL_STORE_ID,
        product_id: 'prod_flax_throw',
        product_title: 'Washed Belgian Linen Throw Blanket',
        price: 110.00,
        quantity: 1,
        line_total: 110.00,
        image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80'
      }
    ],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'ord_1003',
    store_id: INITIAL_STORE_ID,
    order_number: '#SP-1003',
    customer_id: 'cust_003',
    customer_email: 'elena.rostova@example.com',
    customer_name: 'Elena Rostova',
    subtotal: 76.00,
    discount: 10.00,
    tax: 4.29,
    shipping: 8.50,
    total: 78.79,
    currency: 'USD',
    status: 'processing',
    payment_status: 'paid',
    shipping_address: {
      line1: '388 Market St Suite 1200',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postal_code: '94111'
    },
    items: [
      {
        id: 'item_4',
        order_id: 'ord_1003',
        store_id: INITIAL_STORE_ID,
        product_id: 'prod_tea_mugs',
        product_title: 'Earth & Ash Speckled Mug Set (Pair)',
        price: 42.00,
        quantity: 1,
        line_total: 42.00,
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'item_5',
        order_id: 'ord_1003',
        store_id: INITIAL_STORE_ID,
        product_id: 'prod_cedar_candle',
        product_title: 'Hinoki & Smoked Cedar Soy Candle',
        price: 34.00,
        quantity: 1,
        line_total: 34.00,
        image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80'
      }
    ],
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export interface StorePilotState {
  profile: Profile;
  stores: Store[];
  settings: Record<string, StoreSettings>;
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  customers: Customer[];
  orders: Order[];
}

export class StorePilotDB {
  private static loadState(): StorePilotState {
    if (typeof window === 'undefined') {
      return {
        profile: INITIAL_PROFILE,
        stores: [INITIAL_STORE],
        settings: { [INITIAL_STORE_ID]: INITIAL_SETTINGS },
        categories: INITIAL_CATEGORIES,
        products: INITIAL_PRODUCTS,
        coupons: INITIAL_COUPONS,
        customers: INITIAL_CUSTOMERS,
        orders: INITIAL_ORDERS,
      };
    }

    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse StorePilot DB from localStorage', e);
    }

    // Seed defaults
    const state: StorePilotState = {
      profile: INITIAL_PROFILE,
      stores: [INITIAL_STORE],
      settings: { [INITIAL_STORE_ID]: INITIAL_SETTINGS },
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      coupons: INITIAL_COUPONS,
      customers: INITIAL_CUSTOMERS,
      orders: INITIAL_ORDERS,
    };
    StorePilotDB.saveState(state);
    return state;
  }

  private static saveState(state: StorePilotState): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
    }
  }

  // Active Store & User state
  static getActiveStoreId(): string {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CURRENT_STORE_KEY);
      if (saved) return saved;
    }
    return INITIAL_STORE_ID;
  }

  static setActiveStoreId(storeId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_STORE_KEY, storeId);
    }
  }

  static getProfile(): Profile {
    const state = this.loadState();
    return state.profile;
  }

  static updateProfile(partial: Partial<Profile>): Profile {
    const state = this.loadState();
    state.profile = { ...state.profile, ...partial };
    this.saveState(state);
    return state.profile;
  }

  // Stores
  static getStores(): Store[] {
    const state = this.loadState();
    return state.stores;
  }

  static getStoreById(storeId: string): Store | undefined {
    return this.getStores().find(s => s.id === storeId);
  }

  static getStoreBySlug(slug: string): Store | undefined {
    return this.getStores().find(s => s.slug.toLowerCase() === slug.toLowerCase());
  }

  static createStore(params: { name: string; slug: string; description?: string; currency?: string; country?: string }): { store?: Store; error?: string } {
    const state = this.loadState();
    const currentPlan = DEFAULT_PLANS.find(p => p.code === state.profile.plan_code) || DEFAULT_PLANS[0];

    if (state.stores.length >= currentPlan.max_stores) {
      return { 
        error: `Your current ${currentPlan.name} plan allows up to ${currentPlan.max_stores} store(s). Please upgrade to create more.` 
      };
    }

    const cleanSlug = params.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (state.stores.some(s => s.slug === cleanSlug)) {
      return { error: 'A store with this sub-domain / slug already exists.' };
    }

    const newStore: Store = {
      id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      owner_id: state.profile.id,
      name: params.name.trim(),
      slug: cleanSlug,
      description: params.description || '',
      currency: params.currency || 'USD',
      country: params.country || 'United States',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newSettings: StoreSettings = {
      store_id: newStore.id,
      theme_color: '#4f46e5',
      font_family: 'Inter',
      banner_heading: `Welcome to ${newStore.name}`,
      banner_subheading: newStore.description || 'Quality curated goods.',
      announcement: 'Welcome to our online store! Shipping worldwide.',
      show_announcement: true,
      tax_rate: 5.0,
      shipping_flat_rate: 6.00,
      free_shipping_threshold: 50.00,
    };

    state.stores.push(newStore);
    state.settings[newStore.id] = newSettings;
    this.saveState(state);
    this.setActiveStoreId(newStore.id);
    return { store: newStore };
  }

  static updateStore(storeId: string, partial: Partial<Store>): Store {
    const state = this.loadState();
    const idx = state.stores.findIndex(s => s.id === storeId);
    if (idx !== -1) {
      state.stores[idx] = { ...state.stores[idx], ...partial, updated_at: new Date().toISOString() };
      this.saveState(state);
      return state.stores[idx];
    }
    throw new Error('Store not found');
  }

  static deleteStore(storeId: string): void {
    const state = this.loadState();
    state.stores = state.stores.filter(s => s.id !== storeId);
    delete state.settings[storeId];
    state.products = state.products.filter(p => p.store_id !== storeId);
    state.categories = state.categories.filter(c => c.store_id !== storeId);
    state.orders = state.orders.filter(o => o.store_id !== storeId);
    state.customers = state.customers.filter(c => c.store_id !== storeId);
    state.coupons = state.coupons.filter(c => c.store_id !== storeId);
    this.saveState(state);
    if (state.stores.length > 0) {
      this.setActiveStoreId(state.stores[0].id);
    }
  }

  // Store Settings
  static getSettings(storeId: string): StoreSettings {
    const state = this.loadState();
    if (!state.settings[storeId]) {
      state.settings[storeId] = {
        store_id: storeId,
        theme_color: '#4f46e5',
        font_family: 'Inter',
        banner_heading: 'Welcome to our store',
        banner_subheading: 'Find handpicked products curated just for you.',
        announcement: 'Free worldwide shipping on orders over $50!',
        show_announcement: true,
        tax_rate: 5.0,
        shipping_flat_rate: 5.0,
        free_shipping_threshold: 50.0,
      };
      this.saveState(state);
    }
    return state.settings[storeId];
  }

  static updateSettings(storeId: string, partial: Partial<StoreSettings>): StoreSettings {
    const state = this.loadState();
    const current = this.getSettings(storeId);
    state.settings[storeId] = { ...current, ...partial, updated_at: new Date().toISOString() };
    this.saveState(state);
    return state.settings[storeId];
  }

  // Categories
  static getCategories(storeId: string): Category[] {
    const state = this.loadState();
    return state.categories.filter(c => c.store_id === storeId);
  }

  static addCategory(storeId: string, name: string, description?: string, image_url?: string): Category {
    const state = this.loadState();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat: Category = {
      id: `cat_${Date.now()}`,
      store_id: storeId,
      name,
      slug,
      description,
      image_url,
      created_at: new Date().toISOString(),
    };
    state.categories.push(cat);
    this.saveState(state);
    return cat;
  }

  // Products
  static getProducts(storeId: string): Product[] {
    const state = this.loadState();
    return state.products.filter(p => p.store_id === storeId);
  }

  static getProductById(productId: string): Product | undefined {
    const state = this.loadState();
    return state.products.find(p => p.id === productId);
  }

  static getProductBySlug(storeId: string, slug: string): Product | undefined {
    const state = this.loadState();
    return state.products.find(p => p.store_id === storeId && p.slug === slug);
  }

  static saveProduct(product: Partial<Product> & { store_id: string; title: string; price: number }): Product {
    const state = this.loadState();
    const slug = product.slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (product.id) {
      const idx = state.products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        state.products[idx] = {
          ...state.products[idx],
          ...product,
          slug,
          updated_at: new Date().toISOString(),
        };
        this.saveState(state);
        return state.products[idx];
      }
    }

    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      store_id: product.store_id,
      category_id: product.category_id,
      title: product.title,
      slug,
      description: product.description || '',
      price: product.price,
      compare_at_price: product.compare_at_price,
      cost_per_item: product.cost_per_item || 0,
      sku: product.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: product.barcode || '',
      track_quantity: product.track_quantity !== false,
      quantity: product.quantity ?? 10,
      status: product.status || 'active',
      images: product.images && product.images.length > 0 ? product.images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
      ],
      tags: product.tags || [],
      variants: product.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.products.unshift(newProd);
    this.saveState(state);
    return newProd;
  }

  static deleteProduct(productId: string): void {
    const state = this.loadState();
    state.products = state.products.filter(p => p.id !== productId);
    this.saveState(state);
  }

  // Customers
  static getCustomers(storeId: string): Customer[] {
    const state = this.loadState();
    return state.customers.filter(c => c.store_id === storeId);
  }

  // Coupons
  static getCoupons(storeId: string): Coupon[] {
    const state = this.loadState();
    return state.coupons.filter(c => c.store_id === storeId);
  }

  static saveCoupon(storeId: string, coupon: Omit<Coupon, 'id' | 'store_id' | 'times_used' | 'created_at'> & { id?: string }): Coupon {
    const state = this.loadState();
    if (coupon.id) {
      const idx = state.coupons.findIndex(c => c.id === coupon.id);
      if (idx !== -1) {
        state.coupons[idx] = { ...state.coupons[idx], ...coupon };
        this.saveState(state);
        return state.coupons[idx];
      }
    }

    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      store_id: storeId,
      code: coupon.code.toUpperCase().trim(),
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      usage_limit: coupon.usage_limit,
      times_used: 0,
      is_active: coupon.is_active !== false,
      expires_at: coupon.expires_at,
      created_at: new Date().toISOString(),
    };
    state.coupons.push(newCoupon);
    this.saveState(state);
    return newCoupon;
  }

  static deleteCoupon(couponId: string): void {
    const state = this.loadState();
    state.coupons = state.coupons.filter(c => c.id !== couponId);
    this.saveState(state);
  }

  // Orders
  static getOrders(storeId: string): Order[] {
    const state = this.loadState();
    return state.orders.filter(o => o.store_id === storeId);
  }

  static updateOrderStatus(orderId: string, status: Order['status'], tracking_number?: string): Order {
    const state = this.loadState();
    const idx = state.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      state.orders[idx].status = status;
      if (tracking_number !== undefined) {
        state.orders[idx].tracking_number = tracking_number;
      }
      this.saveState(state);
      return state.orders[idx];
    }
    throw new Error('Order not found');
  }

  // Storefront Checkout: Create Order
  static createStorefrontOrder(params: {
    store_id: string;
    customer_name: string;
    customer_email: string;
    shipping_address: Order['shipping_address'];
    cart: CartItem[];
    coupon_code?: string;
  }): { order: Order; invoice_number: string } {
    const state = this.loadState();
    const settings = this.getSettings(params.store_id);
    const store = this.getStoreById(params.store_id);
    const currency = store?.currency || 'USD';

    // Calculate subtotal
    const subtotal = params.cart.reduce((sum, item) => sum + (item.variant?.price || item.product.price) * item.quantity, 0);

    // Calculate discount
    let discount = 0;
    if (params.coupon_code) {
      const coupon = state.coupons.find(c => c.store_id === params.store_id && c.code.toUpperCase() === params.coupon_code?.toUpperCase() && c.is_active);
      if (coupon && subtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * coupon.discount_value) / 100;
        } else {
          discount = Math.min(coupon.discount_value, subtotal);
        }
        coupon.times_used += 1;
      }
    }

    // Shipping
    const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_flat_rate;

    // Tax
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number(((taxableAmount * settings.tax_rate) / 100).toFixed(2));
    const total = Number((taxableAmount + tax + shipping).toFixed(2));

    const orderNumber = `#SP-${1000 + state.orders.length + 1}`;
    const orderId = `ord_${Date.now()}`;

    const items: OrderItem[] = params.cart.map((item, idx) => ({
      id: `item_${orderId}_${idx}`,
      order_id: orderId,
      store_id: params.store_id,
      product_id: item.product.id,
      product_title: item.product.title,
      variant_title: item.variant?.title,
      sku: item.variant?.sku || item.product.sku,
      price: item.variant?.price || item.product.price,
      quantity: item.quantity,
      line_total: (item.variant?.price || item.product.price) * item.quantity,
      image_url: item.product.images[0]
    }));

    // Deduct inventory
    params.cart.forEach(item => {
      const prod = state.products.find(p => p.id === item.product.id);
      if (prod && prod.track_quantity) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
      }
    });

    // Find or create customer
    let cust = state.customers.find(c => c.store_id === params.store_id && c.email.toLowerCase() === params.customer_email.toLowerCase());
    if (cust) {
      cust.orders_count += 1;
      cust.total_spent += total;
    } else {
      const nameParts = params.customer_name.split(' ');
      cust = {
        id: `cust_${Date.now()}`,
        store_id: params.store_id,
        email: params.customer_email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        address: params.shipping_address,
        orders_count: 1,
        total_spent: total,
        created_at: new Date().toISOString()
      };
      state.customers.push(cust);
    }

    const newOrder: Order = {
      id: orderId,
      store_id: params.store_id,
      order_number: orderNumber,
      customer_id: cust.id,
      customer_email: params.customer_email,
      customer_name: params.customer_name,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      currency,
      status: 'processing',
      payment_status: 'paid',
      shipping_address: params.shipping_address,
      items,
      created_at: new Date().toISOString()
    };

    state.orders.unshift(newOrder);
    this.saveState(state);

    return { order: newOrder, invoice_number: `INV-${orderNumber.replace('#', '')}` };
  }

  // Super Admin functions
  static getAllMerchants(): Profile[] {
    const state = this.loadState();
    return [state.profile];
  }

  static getAllStoresAdmin(): Store[] {
    const state = this.loadState();
    return state.stores;
  }

  static adminSetStoreStatus(storeId: string, status: 'active' | 'suspended'): void {
    this.updateStore(storeId, { status });
  }

  static adminSetPlan(userId: string, planCode: PlanCode): void {
    const state = this.loadState();
    if (state.profile.id === userId) {
      state.profile.plan_code = planCode;
      this.saveState(state);
    }
  }

  static resetToDemo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DB_STORAGE_KEY);
      localStorage.removeItem(CURRENT_STORE_KEY);
    }
  }
}
