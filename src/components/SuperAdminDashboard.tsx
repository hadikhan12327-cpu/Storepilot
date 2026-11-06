import React, { useState } from 'react';
import { 
  Shield, Users, Store, DollarSign, Database, 
  CheckCircle, AlertCircle, RefreshCw, Lock, Sparkles, 
  Activity, Layers, ArrowUpRight, Copy, Check 
} from 'lucide-react';
import { StorePilotDB, DEFAULT_PLANS } from '../lib/storepilot-db';
import { PlanCode, Profile, Store as StoreType } from '../types/storepilot';
import { getSupabaseStatus, testSupabaseConnection } from '../lib/supabase';

interface SuperAdminDashboardProps {
  onRefreshData: () => void;
  onOpenStorefront: (store: StoreType) => void;
  onOpenSupabaseModal?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onRefreshData,
  onOpenStorefront,
  onOpenSupabaseModal,
}) => {
  const merchants = StorePilotDB.getAllMerchants();
  const stores = StorePilotDB.getAllStoresAdmin();
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [supabaseStatus, setSupabaseStatus] = useState(getSupabaseStatus());
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState<string | null>(null);

  // Calculate platform totals
  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.status === 'active').length;
  const mrr = merchants.reduce((sum, m) => {
    const plan = DEFAULT_PLANS.find(p => p.code === m.plan_code);
    return sum + (plan?.price_monthly || 0);
  }, 0);

  const handleToggleStoreStatus = (storeId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    StorePilotDB.adminSetStoreStatus(storeId, nextStatus);
    onRefreshData();
  };

  const handleUpdateMerchantPlan = (userId: string, newPlan: PlanCode) => {
    StorePilotDB.adminSetPlan(userId, newPlan);
    onRefreshData();
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestMessage(null);
    const res = await testSupabaseConnection();
    setTestingDb(false);
    setDbTestMessage(res.message);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 space-y-8">
      {/* Super Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Super Admin Platform Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                Platform Admin
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Global multi-tenant governance, merchant billing, and Supabase RLS monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Database className="w-3.5 h-3.5" />
              API Credentials & SQL Schema
            </button>
          )}
          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
            Verify Supabase Health
          </button>
        </div>
      </div>

      {dbTestMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{dbTestMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <span className="text-xs font-semibold text-gray-400">Monthly Recurring Revenue (MRR)</span>
          <div className="text-2xl font-black text-gray-900 font-mono">
            ${mrr.toFixed(2)} / mo
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Based on active merchant plans
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <span className="text-xs font-semibold text-gray-400">Total Registered Merchants</span>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {merchants.length}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            100% tenant profile isolation
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <span className="text-xs font-semibold text-gray-400">Active Tenant Stores</span>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {activeStores} / {totalStores}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            {totalStores - activeStores} suspended
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <span className="text-xs font-semibold text-gray-400">Database Engine</span>
          <div className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${supabaseStatus.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {supabaseStatus.isConfigured ? 'Remote Supabase' : 'Local Storage Engine'}
          </div>
          <div className="text-[11px] text-gray-400">
            RLS security policies enforced
          </div>
        </div>
      </div>

      {/* Merchants Management */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Merchants & Subscription Plan Overrides</h2>
            <p className="text-xs text-gray-500">Super admins can upgrade or downgrade merchant tiers directly</p>
          </div>
          <span className="text-xs font-mono text-gray-400 font-semibold">{merchants.length} Merchant Accounts</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Merchant Name</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Current Plan</th>
              <th className="py-3 px-4">Store Capacity</th>
              <th className="py-3 px-4 text-right">Admin Plan Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {merchants.map((m) => {
              const plan = DEFAULT_PLANS.find(p => p.code === m.plan_code);
              return (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-900">{m.full_name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono">{m.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                      {m.plan_code} (${plan?.price_monthly}/mo)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    Up to <span className="font-bold">{plan?.max_stores}</span> store(s)
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={m.plan_code}
                      onChange={(e) => handleUpdateMerchantPlan(m.id, e.target.value as PlanCode)}
                      className="px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="free">Free ($0/mo)</option>
                      <option value="starter">Starter ($9/mo)</option>
                      <option value="business">Business ($19/mo)</option>
                      <option value="professional">Professional ($39/mo)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stores Multi-Tenant Governance */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-900">All Multi-Tenant Stores</h2>
            <p className="text-xs text-gray-500">Suspend violating stores or inspect their public catalog</p>
          </div>
          <span className="text-xs font-mono text-gray-400 font-semibold">{stores.length} Active Tenants</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Store Name</th>
              <th className="py-3 px-4">Subdomain / Slug</th>
              <th className="py-3 px-4">Currency</th>
              <th className="py-3 px-4">Tenant Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stores.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                <td className="py-3 px-4 font-mono text-gray-500">/{s.slug}</td>
                <td className="py-3 px-4 font-mono font-semibold text-gray-700">{s.currency}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => onOpenStorefront(s)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Visit Store
                  </button>
                  <button
                    onClick={() => handleToggleStoreStatus(s.id, s.status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      s.status === 'active'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {s.status === 'active' ? 'Suspend Store' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plans & Pricing Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Platform Subscription Tiers Configuration</h2>
          <p className="text-xs text-gray-500">Current tier limits synced with database triggers in `public.plans`</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_PLANS.map((plan) => (
            <div key={plan.code} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                <span className="font-mono font-black text-indigo-600 text-base">${plan.price_monthly}</span>
              </div>
              <p className="text-xs text-gray-500">
                Max Allowed Stores: <span className="font-bold text-gray-800">{plan.max_stores}</span>
              </p>
              <ul className="text-[11px] text-gray-600 space-y-1 pt-1 border-t border-gray-200">
                {plan.features.slice(0, 3).map((f, i) => (
                  <li key={i}>&bull; {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
