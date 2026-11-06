import React from 'react';
import { 
  Store, ShoppingBag, LayoutDashboard, Shield, Globe, 
  Database, ChevronDown, Plus, Sparkles, UserCheck 
} from 'lucide-react';
import { StorePilotDB } from '../lib/storepilot-db';
import { Store as StoreType, Profile } from '../types/storepilot';
import { getSupabaseStatus } from '../lib/supabase';

export type AppView = 'website' | 'dashboard' | 'storefront' | 'superadmin';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  activeStore: StoreType;
  stores: StoreType[];
  onSelectStore: (store: StoreType) => void;
  onCreateStoreClick: () => void;
  profile: Profile;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  activeStore,
  stores,
  onSelectStore,
  onCreateStoreClick,
  profile,
  onOpenSupabaseModal,
}) => {
  const [storeDropdownOpen, setStoreDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const supabaseStatus = getSupabaseStatus();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onViewChange('website')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 tracking-tight text-lg leading-tight flex items-center gap-1.5">
                StorePilot
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                  SaaS
                </span>
              </span>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">Build your online store. Grow your business.</p>
            </div>
          </button>

          {/* Primary View Switcher Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onViewChange('website')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'website'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              Public Site
            </button>
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              Merchant Admin
            </button>
            <button
              onClick={() => onViewChange('storefront')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'storefront'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              Live Storefront
            </button>
            <button
              onClick={() => onViewChange('superadmin')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'superadmin'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              Super Admin
            </button>
          </nav>
        </div>

        {/* Right Section: Store Selector & DB Indicator & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Active Store Selector (when in dashboard or storefront) */}
          {(currentView === 'dashboard' || currentView === 'storefront') && (
            <div className="relative">
              <button
                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-medium text-gray-800 transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate font-semibold">
                  {activeStore?.name || 'Select Store'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {storeDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 font-bold uppercase text-[10px] text-gray-400 tracking-wider">
                    My Stores ({stores.length})
                  </div>
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectStore(s);
                        setStoreDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                        s.id === activeStore?.id ? 'bg-indigo-50/60 font-semibold text-indigo-700' : 'text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="truncate">{s.name}</div>
                        <div className="text-[10px] text-gray-400">/{s.slug}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {s.currency}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1 px-1">
                    <button
                      onClick={() => {
                        setStoreDropdownOpen(false);
                        onCreateStoreClick();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Store
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              supabaseStatus.isConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Configure Supabase Database"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">
              {supabaseStatus.isConfigured ? 'Supabase Connected' : 'Supabase (Setup)'}
            </span>
          </button>

          {/* User Account / Plan Badge */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                {profile.full_name?.charAt(0) || 'M'}
              </div>
              <div className="text-left hidden lg:block">
                <span className="font-semibold text-gray-900 block leading-tight">{profile.full_name}</span>
                <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">
                  {profile.plan_code} plan
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-bold text-gray-900">{profile.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{profile.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                    <Sparkles className="w-2.5 h-2.5" /> {profile.plan_code} Tier
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onViewChange('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                    Merchant Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onViewChange('superadmin');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Super Admin Console
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1 px-1">
                  <button
                    onClick={() => {
                      StorePilotDB.resetToDemo();
                      window.location.reload();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Reset Demo State
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="md:hidden flex border-t border-gray-200 bg-gray-50/90 text-xs font-semibold px-2 py-1 justify-around">
        <button
          onClick={() => onViewChange('website')}
          className={`py-1.5 px-2 rounded-lg ${currentView === 'website' ? 'text-indigo-600 font-bold' : 'text-gray-600'}`}
        >
          Website
        </button>
        <button
          onClick={() => onViewChange('dashboard')}
          className={`py-1.5 px-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-gray-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onViewChange('storefront')}
          className={`py-1.5 px-2 rounded-lg ${currentView === 'storefront' ? 'text-emerald-600 font-bold' : 'text-gray-600'}`}
        >
          Storefront
        </button>
        <button
          onClick={() => onViewChange('superadmin')}
          className={`py-1.5 px-2 rounded-lg ${currentView === 'superadmin' ? 'text-purple-600 font-bold' : 'text-gray-600'}`}
        >
          Admin
        </button>
      </div>
    </header>
  );
};
