import React, { useState } from 'react';
import { Store, X, Sparkles, AlertCircle, Check } from 'lucide-react';
import { StorePilotDB, DEFAULT_PLANS } from '../lib/storepilot-db';
import { Profile, Store as StoreType } from '../types/storepilot';

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated: (store: StoreType) => void;
  profile: Profile;
  currentStoresCount: number;
}

export const CreateStoreModal: React.FC<CreateStoreModalProps> = ({
  isOpen,
  onClose,
  onStoreCreated,
  profile,
  currentStoresCount,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('United States');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentPlan = DEFAULT_PLANS.find(p => p.code === profile.plan_code) || DEFAULT_PLANS[0];
  const isLimitReached = currentStoresCount >= currentPlan.max_stores;

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    setSlug(generatedSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLimitReached) {
      setError(`Store limit reached for your ${currentPlan.name} plan (Max: ${currentPlan.max_stores}). Please upgrade.`);
      return;
    }

    if (!name.trim() || !slug.trim()) {
      setError('Please provide a store name and slug.');
      return;
    }

    const res = StorePilotDB.createStore({
      name,
      slug,
      description,
      currency,
      country,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.store) {
      onStoreCreated(res.store);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Create New Online Store</h3>
              <p className="text-[11px] text-gray-400">Launch a multi-tenant storefront instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLimitReached ? (
          <div className="my-5 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Store Limit Reached
            </div>
            <p>
              Your active <span className="font-bold">{currentPlan.name}</span> plan permits up to{' '}
              <span className="font-bold">{currentPlan.max_stores}</span> store(s).
            </p>
            <p className="text-[11px] text-amber-800">
              Upgrade your subscription to the Business ($19/mo - 3 stores) or Professional ($39/mo - 10 stores) tier to launch more stores.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  StorePilotDB.updateProfile({ plan_code: 'professional' });
                  window.location.reload();
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Simulate Instant Plan Upgrade
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 my-4 text-xs">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Atelier Living"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Subdomain / URL Slug</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500 font-mono text-xs">
                  storepilot.io/store/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="atelier-living"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-r-xl text-xs font-mono font-semibold focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short bio for your store..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
              >
                Create Store
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
