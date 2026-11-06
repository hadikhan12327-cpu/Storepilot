import React, { useState, useEffect } from 'react';
import { 
  X, Database, CheckCircle2, AlertCircle, Copy, Check, 
  ExternalLink, Key, RefreshCw, ShieldCheck, Terminal 
} from 'lucide-react';
import { 
  getSupabaseStatus, saveSupabaseCredentials, 
  clearSupabaseCredentials, testSupabaseConnection 
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(getSupabaseStatus());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');

  useEffect(() => {
    if (isOpen) {
      setStatus(getSupabaseStatus());
      const storedUrl = localStorage.getItem('storepilot_supabase_url') || '';
      const storedKey = localStorage.getItem('storepilot_supabase_key') || '';
      setUrl(storedUrl);
      setKey(storedKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) return;

    saveSupabaseCredentials(url, key);
    const newStatus = getSupabaseStatus();
    setStatus(newStatus);
    setUrl(newStatus.rawUrl || url.trim());
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult(res);

    if (res.success && onSuccess) {
      onSuccess();
    }
  };

  const handleTestOnly = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult(res);
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setKey('');
    setStatus(getSupabaseStatus());
    setTestResult({ success: false, message: 'Supabase credentials cleared. Switched to offline database engine.' });
  };

  const copySqlSchema = async () => {
    try {
      const res = await fetch('/schema_full.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setCopiedSql(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Supabase Database Integration</h2>
              <p className="text-xs text-gray-500">Row Level Security (RLS), multi-tenant isolation, and storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div className="my-5 p-4 rounded-xl border flex items-center justify-between text-xs transition-colors bg-gray-50/80 border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${status.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="font-semibold text-gray-800">
                {status.isConfigured ? 'Connected to Remote Supabase' : 'Running on Local Multi-Tenant Engine'}
              </span>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {status.isConfigured 
                  ? `Configured with endpoint: ${status.url}`
                  : 'Full persistence in browser storage with instant response. Connect Supabase anytime!'}
              </p>
            </div>
          </div>
          {status.isConfigured && (
            <button
              onClick={handleTestOnly}
              disabled={testing}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-xs cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              Test
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-gray-100 pb-3 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            API Credentials
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            SQL Schema & Policies
          </button>
        </div>

        {/* Test Result alert */}
        {testResult && (
          <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Notice'}</p>
              <p className="mt-0.5 opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        {activeTab === 'credentials' ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 text-xs font-mono"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Found in your Supabase dashboard: Project Settings &rarr; API &rarr; Project URL
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Supabase Anon / Public API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 text-xs font-mono pr-10"
                  required
                />
                <Key className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Only supply your public `anon` key. Never expose your `service_role` key.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              {status.isConfigured ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Disconnect & Revert to Local
                </button>
              ) : (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Credentials stored safely client-side
                </span>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save & Verify
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <p className="font-semibold">Setup Instructions for Supabase:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Create a new project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold">supabase.com</a>.</li>
                <li>Navigate to the <strong>SQL Editor</strong> tab in the left sidebar.</li>
                <li>Copy the complete StorePilot SQL schema below and paste it into the editor.</li>
                <li>Click <strong>Run</strong> to create all tables, triggers, and Row Level Security policies!</li>
              </ol>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 font-mono text-[11px]">
                /public/schema_full.sql (Milestone 1 + 2 + 3)
              </span>
              <button
                onClick={copySqlSchema}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-xs font-medium cursor-pointer transition-colors"
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

            <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-[11px] h-64 overflow-y-auto leading-relaxed border border-gray-800">
              <pre className="text-gray-300">
{`-- StorePilot: Complete Supabase Production Schema
-- Contains Plans, Profiles, Stores, Settings, Categories, Products,
-- Product Variants, Customers, Coupons, Orders, and Order Items
-- with Row Level Security (RLS) policies and plan limits.

-- Click "Copy Complete SQL" above to copy the full 300+ line migration script!
-- Tables included:
-- 1. public.plans
-- 2. public.profiles
-- 3. public.platform_admins
-- 4. public.stores
-- 5. public.store_settings
-- 6. public.categories
-- 7. public.products
-- 8. public.product_variants
-- 9. public.customers
-- 10. public.coupons
-- 11. public.orders
-- 12. public.order_items
-- 13. storage.buckets ('store-assets')`}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs"
              >
                Open Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
