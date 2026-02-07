import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TenantList, FeatureToggles, ResourceLimits } from '@/components/godmode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  BarChart3,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

// God Mode Dashboard Page
export default function GodModeDashboard() {
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [activeTab, setActiveTab] = useState('tenants');

  const handleTenantSelect = (tenantId) => {
    setSelectedTenantId(tenantId);
    setActiveTab('features');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F2FF] to-[#c8ff00] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold">God Mode</h1>
                <p className="text-xs text-gray-500">Platform Administration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">System Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800 p-1">
            <TabsTrigger 
              value="tenants" 
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <Globe className="w-4 h-4 mr-2" />
              Tenants
            </TabsTrigger>
            <TabsTrigger 
              value="features"
              disabled={!selectedTenantId}
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="resources"
              disabled={!selectedTenantId}
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF] disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-0">
            <TenantList />
          </TabsContent>

          <TabsContent value="features" className="mt-0">
            <FeatureToggles tenantId={selectedTenantId} />
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <ResourceLimits tenantId={selectedTenantId} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-900/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Default Plans</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Configure default resource allocations for each plan tier.
                  </p>
                  <button className="text-[#00F2FF] text-sm hover:underline">
                    Configure Plans →
                  </button>
                </div>
                
                <div className="p-6 bg-gray-900/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Domain Settings</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Manage SSL certificates and domain verification.
                  </p>
                  <button className="text-[#00F2FF] text-sm hover:underline">
                    Domain Settings →
                  </button>
                </div>
                
                <div className="p-6 bg-gray-900/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Feature Defaults</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Set default feature availability for new tenants.
                  </p>
                  <button className="text-[#00F2FF] text-sm hover:underline">
                    Feature Defaults →
                  </button>
                </div>
                
                <div className="p-6 bg-gray-900/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Audit Logs</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    View platform-wide audit logs and activity.
                  </p>
                  <button className="text-[#00F2FF] text-sm hover:underline">
                    View Logs →
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>LocalRNK Platform v2.0</p>
            <p>God Mode Dashboard</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
