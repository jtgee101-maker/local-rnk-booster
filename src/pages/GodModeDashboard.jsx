import React, { useState, useEffect } from 'react';
import BridgePathwaySplit from '@/components/admin/BridgePathwaySplit';
import PathwayConversionDashboard from '@/components/admin/PathwayConversionDashboard';
import PathwayNurtureConfig from '@/components/admin/PathwayNurtureConfig';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  BarChart3,
  Globe,
  Shield,
  Zap,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  TrendingUp,
  Activity
} from 'lucide-react';

// Mock data fallback (used when backend entities not available)
const MOCK_TENANTS = [
  {
    id: '1',
    name: 'Acme Digital',
    subdomain: 'acme',
    custom_domain: 'seo.acme.com',
    status: 'active',
    plan_id: 'enterprise',
    domain_verified: true,
    active_users: 12,
    current_audits: 456,
    health_status: 'healthy',
    last_check_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Metro Plumbing',
    subdomain: 'metro-plumbing',
    status: 'active',
    plan_id: 'growth',
    domain_verified: false,
    active_users: 3,
    current_audits: 89,
    health_status: 'healthy',
    last_check_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '3',
    name: 'Elite Roofing',
    subdomain: 'elite-roofing',
    status: 'suspended',
    plan_id: 'starter',
    domain_verified: true,
    active_users: 0,
    current_audits: 0,
    health_status: 'unhealthy',
    last_check_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

const MOCK_FEATURES = [
  { key: 'seo_audit', name: 'SEO Audits', enabled: true, limit: 1000, category: 'analytics' },
  { key: 'ai_content', name: 'AI Content Generation', enabled: true, limit: 500, category: 'content' },
  { key: 'custom_domain', name: 'Custom Domains', enabled: true, limit: 1, category: 'white_label' },
  { key: 'white_label', name: 'White Label Mode', enabled: false, limit: null, category: 'white_label' },
  { key: 'api_access', name: 'API Access', enabled: true, limit: 10000, category: 'integrations' },
  { key: 'priority_support', name: 'Priority Support', enabled: false, limit: null, category: 'general' },
];

// Status badge component
const StatusBadge = ({ status }) => {
  const variants = {
    active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertCircle },
    suspended: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
  };
  
  const variant = variants[status] || variants.pending;
  const Icon = variant.icon;
  
  return (
    <Badge className={`${variant.bg} ${variant.text} border-0 flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

// Health indicator
const HealthIndicator = ({ status }) => {
  const colors = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-500'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown} animate-pulse`} />
      <span className="text-xs text-gray-400 capitalize">{status}</span>
    </div>
  );
};

// Tenant card component
const TenantCard = ({ tenant, onManage }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-[#00F2FF]/30 transition-all duration-300"
      style={{ boxShadow: '0 4px 24px rgba(0, 242, 255, 0.05)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F2FF]/20 to-[#c8ff00]/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#00F2FF]" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{tenant.name}</h3>
              <p className="text-sm text-gray-400">{tenant.subdomain}.localrnk.io</p>
            </div>
          </div>
          <StatusBadge status={tenant.status} />
        </div>
        
        {tenant.custom_domain && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-800/50 rounded-lg">
            <Globe className="w-4 h-4 text-[#c8ff00]" />
            <span className="text-sm text-gray-300">{tenant.custom_domain}</span>
            {tenant.domain_verified ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 ml-auto" />
            )}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-[#00F2FF] mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{tenant.active_users}</p>
            <p className="text-xs text-gray-500">Users</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Activity className="w-4 h-4 text-[#c8ff00] mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{tenant.current_audits}</p>
            <p className="text-xs text-gray-500">Audits</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Database className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white capitalize">{tenant.plan_id}</p>
            <p className="text-xs text-gray-500">Plan</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
          <HealthIndicator status={tenant.health_status} />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#00F2FF] hover:text-[#00F2FF] hover:bg-[#00F2FF]/10"
            onClick={() => onManage(tenant)}
          >
            Manage
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Feature toggle card
const FeatureCard = ({ feature }) => {
  const categoryColors = {
    analytics: '#00F2FF',
    content: '#a855f7',
    white_label: '#ec4899',
    integrations: '#f59e0b',
    general: '#c8ff00'
  };
  
  const color = categoryColors[feature.category] || '#c8ff00';
  
  return (
    <div className={`relative bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 ${feature.enabled ? 'border-gray-800/50 hover:border-[#00F2FF]/30' : 'border-gray-800/30 opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Zap className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{feature.name}</h4>
            <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: `${color}40`, color }}>
              {feature.category}
            </Badge>
          </div>
        </div>
        <Switch checked={feature.enabled} className="data-[state=checked]:bg-[#00F2FF]" />
      </div>
      
      {feature.limit && feature.enabled && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-800/50">
          <span className="text-sm text-gray-500">Limit:</span>
          <Input
            type="number"
            value={feature.limit}
            className="w-24 h-8 bg-gray-800/50 border-gray-700 text-white text-sm"
            readOnly
          />
          <span className="text-sm text-gray-500">/month</span>
        </div>
      )}
    </div>
  );
};

// Main God Mode Dashboard
export default function GodModeDashboard() {
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [activeTab, setActiveTab] = useState('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [kpiStats, setKpiStats] = useState(null);

  const handleManageTenant = (tenant) => {
    setSelectedTenantId(tenant.id);
    alert(`Managing tenant: ${tenant.name}\nID: ${tenant.id}\n\nTenant management interface coming soon!`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantsRes, statsRes] = await Promise.allSettled([
          base44.entities?.Tenant?.list({ sort: { field: 'created_at', direction: 'desc' } }),
          base44.functions.invoke('admin/getDashboardStats', {})
        ]);

        if (tenantsRes.status === 'fulfilled' && tenantsRes.value?.length > 0) {
          setTenants(tenantsRes.value);
          setUseRealData(true);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setKpiStats(statsRes.value.data);
        }
      } catch (error) {
        console.log('Using mock data:', error.message);
        setUseRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F2FF] to-[#c8ff00] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold">God Mode v2</h1>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${useRealData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-sm text-gray-400">
              {useRealData ? 'Live Data' : 'Demo Data'} 
              {loading && '- Loading...'}
            </span>
          </div>
          {!useRealData && (
            <span className="text-xs text-gray-500">
              Entities deploying to Base44...
            </span>
          )}
        </div>

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
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <Zap className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger 
              value="resources"
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger 
              value="pathways"
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Pathways
            </TabsTrigger>
            <TabsTrigger 
              value="nurture"
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <Activity className="w-4 h-4 mr-2" />
              Nurture
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-0 space-y-6">
            {/* KPI Cards — real revenue & conversion data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">MRR (This Month)</p>
                <p className="text-2xl font-bold text-[#c8ff00]">
                  {kpiStats ? `$${Number(kpiStats.monthRevenue).toLocaleString()}` : '—'}
                </p>
                {kpiStats && <p className="text-xs text-gray-500 mt-1">{kpiStats.revenueChange} vs last mo</p>}
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[#00F2FF]">
                  {kpiStats ? `$${Number(kpiStats.totalRevenue).toLocaleString()}` : '—'}
                </p>
                {kpiStats && <p className="text-xs text-gray-500 mt-1">{kpiStats.completedOrders} orders</p>}
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Leads This Month</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {kpiStats ? kpiStats.leadsThisMonth : '—'}
                </p>
                {kpiStats && <p className="text-xs text-gray-500 mt-1">{kpiStats.leadsChange} vs last mo</p>}
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-400">
                  {kpiStats ? kpiStats.conversionRate : '—'}
                </p>
                {kpiStats && (
                  <p className="text-xs text-gray-500 mt-1">
                    {kpiStats.criticalErrors > 0
                      ? <span className="text-red-400">{kpiStats.criticalErrors} critical errors</span>
                      : <span className="text-emerald-400">No critical errors</span>}
                  </p>
                )}
              </div>
            </div>
            
            {/* Bridge Pathway Split */}
            {kpiStats?.bridge && (
              <BridgePathwaySplit bridge={kpiStats.bridge} />
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tenants..."
                  className="pl-10 bg-gray-900/50 border-gray-800 text-white"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'suspended'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? 'bg-[#00F2FF]/20 text-[#00F2FF] border-[#00F2FF]/50' : 'border-gray-700 text-gray-400'}
                  >
                    <span className="capitalize">{status}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} onManage={handleManageTenant} />
              ))}
            </div>
            
            {filteredTenants.length === 0 && (
              <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No tenants found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_FEATURES.map((feature) => (
                <FeatureCard key={feature.key} feature={feature} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pathways" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <PathwayConversionDashboard />
            </div>
          </TabsContent>

          <TabsContent value="nurture" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <PathwayNurtureConfig />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Resource Limits</h2>
              <p className="text-gray-400">Resource management will be available once backend entities are deployed.</p>
            </div>
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