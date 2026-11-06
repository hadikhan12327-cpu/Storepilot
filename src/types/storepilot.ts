export type PlanCode = 'free' | 'starter' | 'business' | 'professional';

export interface Plan {
  code: PlanCode;
  name: string;
  price_monthly: number;
  max_stores: number;
  features: string[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  plan_code: PlanCode;
  created_at: string;
  is_admin?: boolean;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  currency: string;
  country?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  store_id: string;
  theme_color: string;
  font_family: string;
  logo_url?: string;
  banner_url?: string;
  banner_heading: string;
  banner_subheading: string;
  announcement: string;
  show_announcement: boolean;
  tax_rate: number;
  shipping_flat_rate: number;
  free_shipping_threshold: number;
  social_instagram?: string;
  social_twitter?: string;
  social_facebook?: string;
  meta_title?: string;
  meta_description?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  store_id: string;
  title: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku?: string;
  barcode?: string;
  track_quantity: boolean;
  quantity: number;
  status: 'active' | 'draft' | 'archived';
  images: string[];
  tags: string[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  orders_count: number;
  total_spent: number;
  notes?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id?: string;
  product_title: string;
  variant_title?: string;
  sku?: string;
  price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  tracking_number?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
