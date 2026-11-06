import React, { useState, useEffect } from 'react';
import { StorePilotDB } from './lib/storepilot-db';
import { Store as StoreType, Profile, StoreSettings } from './types/storepilot';
import { Navbar, AppView } from './components/Navbar';
import { PublicWebsite } from './components/PublicWebsite';
import { MerchantDashboard } from './components/MerchantDashboard';
import { Storefront } from './components/Storefront';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { CreateStoreModal } from './components/CreateStoreModal';
import { SupabaseModal } from './components/SupabaseModal';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('website');
  const [profile, setProfile] = useState<Profile>(StorePilotDB.getProfile());
  const [stores, setStores] = useState<StoreType[]>(StorePilotDB.getStores());
  const [activeStoreId, setActiveStoreId] = useState<string>(StorePilotDB.getActiveStoreId());
  
  // Modals
  const [createStoreModalOpen, setCreateStoreModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Sync active store
  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0] || {
    id: 'temp_store',
    owner_id: profile.id,
    name: 'My Store',
    slug: 'my-store',
    currency: 'USD',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activeSettings: StoreSettings = StorePilotDB.getSettings(activeStore.id);

  const refreshAllData = () => {
    setProfile(StorePilotDB.getProfile());
    const refreshedStores = StorePilotDB.getStores();
    setStores(refreshedStores);
    const activeId = StorePilotDB.getActiveStoreId();
    setActiveStoreId(activeId);
  };

  const handleSelectStore = (store: StoreType) => {
    StorePilotDB.setActiveStoreId(store.id);
    setActiveStoreId(store.id);
  };

  const handleStoreCreated = (newStore: StoreType) => {
    refreshAllData();
    setActiveStoreId(newStore.id);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        activeStore={activeStore}
        stores={stores}
        onSelectStore={handleSelectStore}
        onCreateStoreClick={() => setCreateStoreModalOpen(true)}
        profile={profile}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {currentView === 'website' && (
          <PublicWebsite
            onGetStarted={() => setCurrentView('dashboard')}
            onExploreStorefront={() => setCurrentView('storefront')}
            onOpenDashboard={() => setCurrentView('dashboard')}
            currentProfile={profile}
            onProfileUpdate={(updated) => setProfile(updated)}
          />
        )}

        {currentView === 'dashboard' && (
          <MerchantDashboard
            store={activeStore}
            stores={stores}
            settings={activeSettings}
            profile={profile}
            onRefreshData={refreshAllData}
            onOpenStorefront={() => setCurrentView('storefront')}
            onOpenCreateStore={() => setCreateStoreModalOpen(true)}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          />
        )}

        {currentView === 'storefront' && (
          <Storefront
            store={activeStore}
            settings={activeSettings}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'superadmin' && (
          <SuperAdminDashboard
            onRefreshData={refreshAllData}
            onOpenStorefront={(store) => {
              handleSelectStore(store);
              setCurrentView('storefront');
            }}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          />
        )}
      </div>

      {/* Global Modals */}
      <CreateStoreModal
        isOpen={createStoreModalOpen}
        onClose={() => setCreateStoreModalOpen(false)}
        onStoreCreated={handleStoreCreated}
        profile={profile}
        currentStoresCount={stores.length}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onSuccess={() => refreshAllData()}
      />
    </div>
  );
}
