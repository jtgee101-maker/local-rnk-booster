import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Settings, Shield, Globe, Zap, Activity,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Plus, Search, Filter, Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { colors, glassmorphism } from '@/config/BrandConfig';

/**
 * GodModeDashboard - Super Admin Control Center
 * 
 * Features:
 * - Tenant list with status indicators
 * - Feature toggle switches per tenant
 * - Resource limit management
 * - Domain verification status
 * - Real-time tenant health
 * - Quick actions (suspend, activate, delete)
 * 
 * Design: Tech Noir / Glassmorphism
 */

export default function GodModeDashboard() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tenants');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      // In production, this would call: base44.tenants.list()
      // For now, using mock data
      const mockTenants = [
        {
          id: '1',
          name: 'Acme Digital',
          subdomain: 'acme',
          customDomain: 'seo.acme.com',
          status: 'active',
          planType: 'enterprise',
          domainVerified: true,
          sslStatus: 'active',
          userCount: 12,
          lastActive: '2 minutes ago',
          features: { seo_audits: true, ai_content: true, custom_domain: true },
          limits: { maxAudits: 1000, usedAudits: 456 }
        },
        {
          id: '2',
          name: 'Metro Plumbing',
          subdomain: 'metro-plumbing',
          status: 'active',
          planType: 'growth',
          domainVerified: false,
          sslStatus: 'pending',
          userCount: 3,
          lastActive: '1 hour ago',
          features: { seo_audits: true, ai_content: false, custom_domain: false },
          limits: { maxAudits: 500, usedAudits: 89 }
        },
        {
          id: '3',
          name: 'Elite Roofing',
          subdomain: 'elite-roofing',
          status: 'suspended',
          planType: 'starter',
          domainVerified: true,
          sslStatus: 'active',
          userCount: 1,
          lastActive: '3 days ago',
          features: { seo_audits: false, ai_content: false, custom_domain: false },
          limits: { maxAudits: 100, usedAudits: 0 }
        }
      ];
      
      setTenants(mockTenants);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.status.success.DEFAULT;
      case 'suspended': return colors.status.warning.DEFAULT;
      case 'deleted': return colors.status.error.DEFAULT;
      default: return colors.text.muted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" style={{ color: colors.status.success.DEFAULT }} />;
      case 'suspended': return <AlertCircle className="w-4 h-4" style={{ color: colors.status.warning.DEFAULT }} />;
      default: return <XCircle className="w-4 h-4" style={{ color: colors.status.error.DEFAULT }} />;
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: colors.background.primary }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.brand.DEFAULT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.background.primary }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8" style={{ color: colors.brand.DEFAULT }} />
          <h1 className="text-3xl font-bold text-white">God Mode</h1>
          <Badge 
            className="ml-2" 
            style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
          >
            Super Admin
          </Badge>
        </div>
        <p className="text-gray-400">Manage white-label tenants, features, and system configuration</p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Users} 
          label="Active Tenants" 
          value={tenants.filter(t => t.status === 'active').length}
          color={colors.status.success.DEFAULT}
        />
        <StatCard 
          icon={Globe} 
          label="Custom Domains" 
          value={tenants.filter(t => t.customDomain).length}
          color={colors.brand.DEFAULT}
        />
        <StatCard 
          icon={Shield} 
          label="Verified Domains" 
          value={tenants.filter(t => t.domainVerified).length}
          color={colors.status.info.DEFAULT}
        />
        <StatCard 
          icon={Activity} 
          label="Avg Response Time" 
          value="45ms"
          color={colors.status.success.DEFAULT}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6" style={{ backgroundColor: colors.background.secondary }}>
          <TabsTrigger value="tenants" className="data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Global Features
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <Card style={{ ...glassmorphism.surface, backgroundColor: colors.background.secondary }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">White-Label Tenants</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage customer accounts, features, and domains
                  </CardDescription>
                </div>
                <Button 
                  style={{ backgroundColor: colors.brand.DEFAULT, color: colors.brand.foreground }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tenant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search & Filter */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.DEFAULT }}
                  />
                </div>
                <Button variant="outline" className="gap-2" style={{ borderColor: colors.border.DEFAULT }}>
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>

              {/* Tenant List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTenants.map((tenant) => (
                    <TenantRow 
                      key={tenant.id} 
                      tenant={tenant} 
                      onSelect={() => setSelectedTenant(tenant)}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <FeatureManagementPanel />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigurationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl"
      style={{ 
        ...glassmorphism.surface,
        backgroundColor: colors.background.secondary 
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TenantRow({ tenant, onSelect, getStatusColor, getStatusIcon }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onSelect}
      className="p-4 rounded-lg cursor-pointer transition-all hover:opacity-80"
      style={{ 
        backgroundColor: colors.background.tertiary,
        borderLeft: `3px solid ${getStatusColor(tenant.status)}`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusIcon(tenant.status)}
          <div>
            <h3 className="font-semibold text-white">{tenant.name}</h3>
            <p className="text-sm text-gray-400">
              {tenant.subdomain}.localrnk.com
              {tenant.customDomain && ` → ${tenant.customDomain}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">Plan</p>
            <Badge variant="outline" style={{ borderColor: colors.brand.DEFAULT, color: colors.brand.DEFAULT }}>
              {tenant.planType}
            </Badge>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">Users</p>
            <p className="text-white font-medium">{tenant.userCount}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">Last Active</p>
            <p className="text-white text-sm">{tenant.lastActive}</p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </motion.div>
  );
}

function FeatureManagementPanel() {
  const [features, setFeatures] = useState([
    { key: 'seo_audits', name: 'SEO Audits', enabled: true, global: true },
    { key: 'ai_content', name: 'AI Content Generation', enabled: true, global: true },
    { key: 'custom_domain', name: 'Custom Domains', enabled: true, global: false },
    { key: 'ab_testing', name: 'A/B Testing', enabled: false, global: false },
  ]);

  return (
    <Card style={{ ...glassmorphism.surface, backgroundColor: colors.background.secondary }}>
      <CardHeader>
        <CardTitle className="text-white">Global Feature Management</CardTitle>
        <CardDescription className="text-gray-400">
          Enable or disable features across all tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => (
            <div 
              key={feature.key}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: colors.background.tertiary }}
            >
              <div>
                <h4 className="font-medium text-white">{feature.name}</h4>
                <p className="text-sm text-gray-400">
                  {feature.global ? 'Global feature - affects all tenants' : 'Per-tenant configurable'}
                </p>
              </div>
              <Switch 
                checked={feature.enabled}
                className="data-[state=checked]:bg-[#00F2FF]"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemConfigurationPanel() {
  return (
    <Card style={{ ...glassmorphism.surface, backgroundColor: colors.background.secondary }}>
      <CardHeader>
        <CardTitle className="text-white">System Configuration</CardTitle>
        <CardDescription className="text-gray-400">
          Global system settings and limits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
            <h4 className="font-medium text-white mb-2">Default Plan Limits</h4>
            <div className="grid grid-cols-3 gap-4">
              <LimitSetting label="Starter" value="100" unit="audits/mo" />
              <LimitSetting label="Growth" value="500" unit="audits/mo" />
              <LimitSetting label="Enterprise" value="Unlimited" unit="" />
            </div>
          </div>
          
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background.tertiary }}>
            <h4 className="font-medium text-white mb-2">SSL Configuration</h4>
            <p className="text-sm text-gray-400">Auto-provision via Cloudflare</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LimitSetting({ label, value, unit }) {
  return (
    <div className="text-center p-3 rounded" style={{ backgroundColor: colors.background.secondary }}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-gray-500">{unit}</p>
    </div>
  );
}
