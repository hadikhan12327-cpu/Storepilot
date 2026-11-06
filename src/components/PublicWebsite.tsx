import React, { useState } from 'react';
import { 
  ShoppingBag, ArrowRight, CheckCircle2, Zap, Shield, 
  BarChart3, Globe2, Sparkles, Layers, DollarSign, Send, 
  Store, Check, Lock, ChevronRight 
} from 'lucide-react';
import { DEFAULT_PLANS, StorePilotDB } from '../lib/storepilot-db';
import { PlanCode, Profile } from '../types/storepilot';

interface PublicWebsiteProps {
  onGetStarted: () => void;
  onExploreStorefront: () => void;
  onOpenDashboard: () => void;
  currentProfile: Profile;
  onProfileUpdate: (updated: Profile) => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onGetStarted,
  onExploreStorefront,
  onOpenDashboard,
  currentProfile,
  onProfileUpdate,
}) => {
  const [activePlan, setActivePlan] = useState<PlanCode>(currentProfile.plan_code);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  const handlePlanSelect = (code: PlanCode) => {
    setActivePlan(code);
    const updated = StorePilotDB.updateProfile({ plan_code: code });
    onProfileUpdate(updated);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    const updated = StorePilotDB.updateProfile({
      email: authEmail,
      full_name: authName || authEmail.split('@')[0],
    });
    onProfileUpdate(updated);
    setAuthModalOpen(false);
    onOpenDashboard();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-linear-to-b from-indigo-50/50 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Next-Generation Multi-Tenant E-Commerce
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
              Build your online store. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">
                Grow your business.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
              StorePilot gives creators, merchants, and international brands the modern tools to launch storefronts, manage products, fulfill orders, and scale global sales.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
              >
                Launch Your Store Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onExploreStorefront}
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Store className="w-4 h-4 text-emerald-600" />
                View Live Customer Storefront
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free 14-day trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supabase RLS Security
              </span>
            </div>
          </div>

          {/* Interactive Platform Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl p-2 bg-gray-900/5 ring-1 ring-gray-900/10 shadow-2xl backdrop-blur-xs">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-inner">
              {/* Fake browser chrome bar */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="px-6 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-500 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  https://storepilot.io/aura-living
                </div>
                <div className="text-xs text-gray-400 font-semibold">StorePilot v1.0</div>
              </div>

              {/* Preview Content Inside Browser */}
              <div className="p-6 md:p-8 bg-linear-to-b from-gray-50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Merchant Storefront</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Aura Living</h3>
                    <p className="text-xs text-gray-500 mt-1">Minimalist sustainable lifestyle and artisan ceramics.</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-600">Active & Published</span>
                      <span className="font-mono text-gray-600 font-bold">$342.91 Today</span>
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Processing</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Order #SP-1003</h3>
                    <p className="text-xs text-gray-500 mt-1">2 items &bull; Elena Rostova &bull; San Francisco, CA</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Processing</span>
                      <span className="font-mono text-gray-900 font-bold">$78.79</span>
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Multi-Tenant Cloud</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Supabase PostgreSQL</h3>
                    <p className="text-xs text-gray-500 mt-1">Hardened with Row Level Security (RLS) data isolation.</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 font-semibold">Postgres RLS</span>
                      <span className="text-gray-400">0ms Leak Risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Features Grid */}
      <section id="features" className="py-20 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enterprise Capability</h2>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Everything you need to sell globally
            </h3>
            <p className="text-sm text-gray-600">
              From store customization and inventory tracking to checkout and automated invoices, StorePilot gives you full commerce control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Multi-Store Tenant Management</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Run multiple distinct online stores from one unified merchant account. Set custom slugs, logos, themes, and regional settings per store.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Responsive Shopping Cart & Checkout</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ultra-smooth mobile drawer cart with live coupon discounts, subtotal calculations, shipping rates, and tax computing.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Product Variants & Inventory</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Add size and color variants with independent SKUs, barcode support, automated stock deduction, and low-inventory alerts.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">International Taxes & Shipping</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Configure percentage tax rates, flat-rate shipping, free shipping thresholds, and local currencies for your global audience.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Supabase Row Level Security</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your database is bulletproof. Every merchant only accesses their own records; customers only view published products.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Sales Analytics & Invoicing</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Track revenue, orders count, average order value, customer repeat rates, and generate branded PDF-printable invoices with 1 click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Transparent Pricing</h2>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Predictable plans that scale with your revenue
            </h3>
            <p className="text-sm text-gray-600">
              No hidden fees. Switch or upgrade anytime directly from your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEFAULT_PLANS.map((plan) => {
              const isCurrent = activePlan === plan.code;
              const isPopular = plan.code === 'business';

              return (
                <div
                  key={plan.code}
                  className={`relative rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    isPopular
                      ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/20 bg-white'
                      : 'border-gray-200 hover:border-gray-300 bg-white shadow-2xs'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide uppercase">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {plan.max_stores === 1 ? '1 online store' : `Up to ${plan.max_stores} stores`}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">${plan.price_monthly}</span>
                      <span className="text-xs text-gray-500">/ month</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100">
                    <button
                      onClick={() => handlePlanSelect(plan.code)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {isCurrent ? 'Active Plan' : `Select ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Store Templates Showcase */}
      <section id="templates" className="py-20 bg-gray-50/70 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Customizable Themes</h2>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Built for high-converting shopping experiences
            </h3>
            <p className="text-sm text-gray-600">
              Every template is mobile-responsive, lightning-fast, and customizable with your branding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
                  alt="Aura Studio Minimalist"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold rounded-md">
                  Lifestyle & Ceramics
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">Aura Minimalist (Active Demo)</h4>
                <p className="text-xs text-gray-500">Neutral tones, serif typography, and generous negative space.</p>
                <div className="pt-3 flex justify-between items-center text-xs">
                  <span className="text-indigo-600 font-semibold">Included in all plans</span>
                  <button
                    onClick={onExploreStorefront}
                    className="text-gray-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Preview <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                  alt="Atelier Fashion"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold rounded-md">
                  Apparel & Streetwear
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">Vogue Boutique</h4>
                <p className="text-xs text-gray-500">Bold editorial photography with instant size swatch selection.</p>
                <div className="pt-3 flex justify-between items-center text-xs">
                  <span className="text-indigo-600 font-semibold">Included in all plans</span>
                  <button
                    onClick={onExploreStorefront}
                    className="text-gray-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Preview <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                  alt="Pulse Audio & Tech"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold rounded-md">
                  Electronics & Gear
                </div>
              </div>
              <div className="p-5 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">Nexus Tech</h4>
                <p className="text-xs text-gray-500">Feature spec comparison tables and high-contrast dark accents.</p>
                <div className="pt-3 flex justify-between items-center text-xs">
                  <span className="text-indigo-600 font-semibold">Included in all plans</span>
                  <button
                    onClick={onExploreStorefront}
                    className="text-gray-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Preview <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">About StorePilot</span>
              <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Designed for ambitious merchants worldwide
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                StorePilot was engineered to eliminate the complexity of traditional e-commerce platforms. With built-in multi-tenancy, instant Supabase Row Level Security, and automated invoicing, you can focus on building your brand and delighting customers.
              </p>
              <div className="space-y-3 pt-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Instant store provisioning with zero code setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Customizable shipping rates & automatic sales tax</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Supabase PostgreSQL database connectivity out of the box</span>
                </div>
              </div>
            </div>

            {/* Functional Contact Form */}
            <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl border border-gray-200">
              <h4 className="text-base font-bold text-gray-900 mb-1">Get in Touch with our Commerce Team</h4>
              <p className="text-xs text-gray-500 mb-5">Have a question about migration or custom enterprise setups?</p>

              {contactSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-xs text-emerald-900">Message Received!</p>
                  <p className="text-[11px] text-emerald-700">Our merchant specialist will reply within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@yourbrand.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your store or products..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              SP
            </div>
            <span className="font-bold text-white text-sm">StorePilot</span>
            <span className="text-gray-500">&copy; 2026 StorePilot Inc. All rights reserved.</span>
          </div>

          <div className="flex gap-6">
            <button onClick={onOpenDashboard} className="hover:text-white transition-colors cursor-pointer">
              Merchant Login
            </button>
            <button onClick={onExploreStorefront} className="hover:text-white transition-colors cursor-pointer">
              Storefront Preview
            </button>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Sign In / Sign Up) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {authMode === 'signup' ? 'Create StorePilot Account' : 'Merchant Sign In'}
              </h3>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    placeholder="Alex Chen"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white text-xs"
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  placeholder="alex@aurastudio.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {authMode === 'signup' ? 'Create Account & Continue' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                  className="text-indigo-600 hover:underline text-xs"
                >
                  {authMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
