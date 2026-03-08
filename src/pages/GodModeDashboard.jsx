import React, { useState, useEffect } from 'react';
import BridgePathwaySplit from '@/components/admin/BridgePathwaySplit';
import PathwayConversionDashboard from '@/components/admin/PathwayConversionDashboard';
import PathwayNurtureConfig from '@/components/admin/PathwayNurtureConfig';
import PathwaySettingsConfig from '@/components/admin/PathwaySettingsConfig';
import TenantModal from '@/components/admin/TenantModal';
import ResourcesManager from '@/components/admin/ResourcesManager';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Settings, Users, BarChart3, Globe, Shield, Zap, Search,
  CheckCircle, XCircle, AlertCircle, Database, TrendingUp, Activity, BookOpen
} from 'lucide-react';

// ─── Mock / Default Data ──────────────────────────────────────────────────────
const MOCK_TENANTS = [
  { id: '1', name: 'Acme Digital', subdomain: 'acme', custom_domain: 'seo.acme.com', status: 'active', plan_id: 'enterprise', domain_verified: true, active_users: 12, current_audits: 456, health_status: 'healthy', last_check_at: new Date().toISOString() },
  { id: '2', name: 'Metro Plumbing', subdomain: 'metro-plumbing', status: 'active', plan_id: 'growth', domain_verified: false, active_users: 3, current_audits: 89, health_status: 'healthy', last_check_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', name: 'Elite Roofing', subdomain: 'elite-roofing', status: 'suspended', plan_id: 'starter', domain_verified: true, active_users: 0, current_audits: 0, health_status: 'unhealthy', last_check_at: new Date(Date.now() - 86400000 * 3).toISOString() },
];

const DEFAULT_FEATURES = [
  { key: 'seo_audit',        name: 'SEO Audits',             enabled: true,  category: 'analytics'    },
  { key: 'ai_content',       name: 'AI Content Generation',  enabled: true,  category: 'content'      },
  { key: 'custom_domain',    name: 'Custom Domains',         enabled: true,  category: 'white_label'  },
  { key: 'white_label',      name: 'White Label Mode',       enabled: false, category: 'white_label'  },
  { key: 'api_access',       name: 'API Access',             enabled: true,  category: 'integrations' },
  { key: 'priority_support', name: 'Priority Support',       enabled: false, category: 'general'      },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const V = {
    active:    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
    pending:   { bg: 'bg-amber-500/20',   text: 'text-amber-400',   icon: AlertCircle },
    suspended: { bg: 'bg-red-500/20',     text: 'text-red-400',     icon: XCircle     },
    cancelled: { bg: 'bg-gray-500/20',    text: 'text-gray-400',    icon: XCircle     },
  };
  const v = V[status] || V.pending;
  const Icon = v.icon;
  return (
    <Badge className={`${v.bg} ${v.text} border-0 flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const HealthDot = ({ status }) => {
  const colors = { healthy: 'bg-emerald-500', degraded: 'bg-amber-500', unhealthy: 'bg-red-500', unknown: 'bg-gray-500' };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown} animate-pulse`} />
      <span className="text-xs text-gray-400 capitalize">{status}</span>
    </div>
  );
};

const TenantCard = ({ tenant, onManage }) => (
  <motion.div
    layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
          {tenant.domain_verified
            ? <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
            : <AlertCircle className="w-4 h-4 text-amber-400 ml-auto" />
          }
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Users,    color: 'text-[#00F2FF]',    value: tenant.active_users,  label: 'Users'  },
          { icon: Activity, color: 'text-[#c8ff00]',    value: tenant.current_audits, label: 'Audits' },
          { icon: Database, color: 'text-emerald-400',  value: tenant.plan_id,        label: 'Plan',  capitalize: true },
        ].map(({ icon: Icon, color, value, label, capitalize }) => (
          <div key={label} className="bg-gray-900/50 rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className={`text-lg font-bold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
        <HealthDot status={tenant.health_status} />
        <Button
          variant="ghost" size="sm"
          className="text-[#00F2FF] hover:text-[#00F2FF] hover:bg-[#00F2FF]/10"
          onClick={() => onManage(tenant)}
        >
          Manage
        </Button>
      </div>
    </div>
  </motion.div>
);

const CATEGORY_COLORS = {
  analytics:   '#00F2FF',
  content:     '#a855f7',
  white_label: '#ec4899',
  integrations:'#f59e0b',
  general:     '#c8ff00',
};

const FeatureCard = ({ feature, onToggle }) => {
  const [toggling, setToggling] = useState(false);
  const color = CATEGORY_COLORS[feature.category] || '#c8ff00';

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(feature.key, !feature.enabled);
    setToggling(false);
  };

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
        <Switch
          checked={feature.enabled}
          onCheckedChange={handleToggle}
          disabled={toggling}
          className="data-[state=checked]:bg-[#00F2FF]"
        />
      </div>
      <p className="text-xs mt-1">
        {feature.enabled
          ? <span className="text-emerald-500">● Enabled</span>
          : <span className="text-gray-600">○ Disabled</span>
        }
        {toggling && <span className="ml-2 text-gray-500">Saving…</span>}
      </p>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function GodModeDashboard() {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [activeTab, setActiveTab] = useState('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [loading, setLoading] = useState(true);
  const [useRealData, setUseRealData] = useState(false);
  const [kpiStats, setKpiStats] = useState(null);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [featureSettingId, setFeatureSettingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantsRes, statsRes, featuresRes] = await Promise.allSettled([
          base44.entities?.Tenant?.list({ sort: { field: 'created_at', direction: 'desc' } }),
          base44.functions.invoke('admin/getDashboardStats', {}),
          base44.entities.AppSettings.filter({ setting_key: 'feature_flags' }),
        ]);

        if (tenantsRes.status === 'fulfilled' && tenantsRes.value?.length > 0) {
          setTenants(tenantsRes.value);
          setUseRealData(true);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setKpiStats(statsRes.value.data);
        }
        if (featuresRes.status === 'fulfilled' && featuresRes.value?.length > 0) {
          setFeatureSettingId(featuresRes.value[0].id);
          setFeatures(featuresRes.value[0].setting_value?.features || DEFAULT_FEATURES);
        }
      } catch (error) {
        console.log('Using mock data:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleTenantStatus = (tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
    toast.success(`Tenant "${tenant.name}" ${newStatus === 'active' ? 'reactivated' : 'suspended'}`);
  };

  const handleToggleFeature = async (featureKey, newEnabled) => {
    const newFeatures = features.map(f => f.key === featureKey ? { ...f, enabled: newEnabled } : f);
    const previousFeatures = features;
    setFeatures(newFeatures);
    try {
      const data = {
        setting_key: 'feature_flags',
        setting_value: { features: newFeatures },
        category: 'general',
        description: 'Platform feature flag configuration',
      };
      if (featureSettingId) {
        await base44.entities.AppSettings.update(featureSettingId, data);
      } else {
        const created = await base44.entities.AppSettings.create(data);
        setFeatureSettingId(created.id);
      }
      toast.success(`"${featureKey}" ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      setFeatures(previousFeatures); // rollback
      toast.error(`Failed to save: ${e.message}`);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const TABS = [
    { value: 'tenants',   icon: Globe,      label: 'Tenants'   },
    { value: 'features',  icon: Zap,        label: 'Features'  },
    { value: 'resources', icon: BookOpen,   label: 'Resources' },
    { value: 'pathways',  icon: TrendingUp, label: 'Pathways'  },
    { value: 'nurture',   icon: Activity,   label: 'Nurture'   },
    { value: 'settings',  icon: Settings,   label: 'Settings'  },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 hidden sm:block">System Healthy</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Data mode indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${useRealData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-sm text-gray-400">
            {useRealData ? 'Live Data' : 'Demo Data'}{loading && ' — Loading…'}
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Scrollable tab bar on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="bg-gray-900/50 border border-gray-800 p-1 inline-flex min-w-max w-full sm:w-auto">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[#00F2FF]/20 data-[state=active]:text-[#00F2FF] whitespace-nowrap"
                >
                  <tab.icon className="w-4 h-4 mr-1.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Tenants ── */}
          <TabsContent value="tenants" className="mt-0 space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'MRR (This Month)', value: kpiStats ? `$${Number(kpiStats.monthRevenue).toLocaleString()}` : '—', sub: kpiStats?.revenueChange ? `${kpiStats.revenueChange} vs last mo` : null, color: 'text-[#c8ff00]' },
                { label: 'Total Revenue',    value: kpiStats ? `$${Number(kpiStats.totalRevenue).toLocaleString()}` : '—', sub: kpiStats?.completedOrders ? `${kpiStats.completedOrders} orders` : null, color: 'text-[#00F2FF]' },
                { label: 'Leads This Month', value: kpiStats ? kpiStats.leadsThisMonth : '—', sub: kpiStats?.leadsChange ? `${kpiStats.leadsChange} vs last mo` : null, color: 'text-emerald-400' },
                { label: 'Conversion Rate',  value: kpiStats ? kpiStats.conversionRate : '—', sub: null, color: 'text-purple-400' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
                </div>
              ))}
            </div>

            {kpiStats?.bridge && <BridgePathwaySplit bridge={kpiStats.bridge} />}

            {/* Search + filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tenants…"
                  className="pl-10 bg-gray-900/50 border-gray-800 text-white"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'active', 'pending', 'suspended'].map(status => (
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

            {/* Tenant grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map(tenant => (
                <TenantCard key={tenant.id} tenant={tenant} onManage={setSelectedTenant} />
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

          {/* ── Features ── */}
          <TabsContent value="features" className="mt-0 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Feature Toggles</h2>
              <p className="text-gray-400 text-sm mt-1">Enable or disable platform capabilities. Changes persist immediately to the database.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(feature => (
                <FeatureCard key={feature.key} feature={feature} onToggle={handleToggleFeature} />
              ))}
            </div>
          </TabsContent>

          {/* ── Resources ── */}
          <TabsContent value="resources" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 sm:p-8">
              <ResourcesManager />
            </div>
          </TabsContent>

          {/* ── Pathways ── */}
          <TabsContent value="pathways" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <PathwayConversionDashboard />
            </div>
          </TabsContent>

          {/* ── Nurture ── */}
          <TabsContent value="nurture" className="mt-0">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
              <PathwayNurtureConfig />
            </div>
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="mt-0 space-y-6">
            {/* Primary: Pathway URL config */}
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 sm:p-8">
              <PathwaySettingsConfig />
            </div>

            {/* Phase 3 planned (informational only — no dead buttons) */}
            <div className="bg-[#0a0a0a]/40 border border-gray-800/30 rounded-2xl p-5">
              <h3 className="text-gray-500 font-semibold text-sm mb-3 uppercase tracking-wide">Planned for Phase 3</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Plan Configuration', 'Domain & SSL Management', 'Billing Settings'].map(name => (
                  <div key={name} className="p-3 bg-gray-900/30 rounded-lg flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{name}</span>
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-600">Phase 3</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Tenant modal */}
      <TenantModal
        tenant={selectedTenant}
        onClose={() => setSelectedTenant(null)}
        onToggleStatus={handleToggleTenantStatus}
      />

      <footer className="border-t border-gray-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-sm text-gray-500">
          <p>LocalRNK Platform v2.0</p>
          <p>God Mode Dashboard</p>
        </div>
      </footer>
    </div>
  );
}