import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Sparkles, 
  Globe, 
  Palette, 
  BarChart3, 
  Puzzle,
  Zap,
  Shield,
  Users,
  Bot,
  FileSearch,
  TrendingUp,
  CreditCard,
  Mail,
  Sliders,
  Check,
  X,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Feature categories with icons
const FEATURE_CATEGORIES = {
  general: { icon: Sliders, label: 'General', color: '#00F2FF' },
  analytics: { icon: BarChart3, label: 'Analytics', color: '#c8ff00' },
  content: { icon: Sparkles, label: 'AI Content', color: '#a855f7' },
  integrations: { icon: Puzzle, label: 'Integrations', color: '#f59e0b' },
  white_label: { icon: Palette, label: 'White Label', color: '#ec4899' },
  security: { icon: Shield, label: 'Security', color: '#ef4444' },
};

// Feature definitions with descriptions and default values
const FEATURE_DEFINITIONS = {
  // General Features
  seo_audit: {
    name: 'SEO Audit',
    description: 'Run comprehensive SEO audits on websites',
    category: 'analytics',
    defaultLimit: 100,
    unit: 'audits/month',
    icon: FileSearch
  },
  team_collaboration: {
    name: 'Team Collaboration',
    description: 'Invite team members and collaborate on projects',
    category: 'general',
    defaultLimit: 5,
    unit: 'users',
    icon: Users
  },
  bulk_operations: {
    name: 'Bulk Operations',
    description: 'Perform bulk actions on multiple items',
    category: 'general',
    defaultLimit: null,
    unit: null,
    icon: Zap
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Access to priority customer support',
    category: 'general',
    defaultLimit: null,
    unit: null,
    icon: Mail
  },
  
  // Analytics Features
  advanced_reporting: {
    name: 'Advanced Reporting',
    description: 'Generate detailed PDF and Excel reports',
    category: 'analytics',
    defaultLimit: null,
    unit: null,
    icon: TrendingUp
  },
  competitor_tracking: {
    name: 'Competitor Tracking',
    description: 'Monitor competitor websites and rankings',
    category: 'analytics',
    defaultLimit: 5,
    unit: 'competitors',
    icon: Globe
  },
  custom_dashboards: {
    name: 'Custom Dashboards',
    description: 'Create and customize analytics dashboards',
    category: 'analytics',
    defaultLimit: 3,
    unit: 'dashboards',
    icon: BarChart3
  },
  data_export: {
    name: 'Data Export',
    description: 'Export data in various formats',
    category: 'analytics',
    defaultLimit: null,
    unit: null,
    icon: Zap
  },
  
  // AI Content Features
  ai_content: {
    name: 'AI Content Generation',
    description: 'Generate content using AI',
    category: 'content',
    defaultLimit: 100,
    unit: 'generations/month',
    icon: Sparkles
  },
  ai_optimization: {
    name: 'AI Optimization',
    description: 'AI-powered content optimization suggestions',
    category: 'content',
    defaultLimit: 50,
    unit: 'optimizations/month',
    icon: Bot
  },
  content_calendar: {
    name: 'Content Calendar',
    description: 'Plan and schedule content',
    category: 'content',
    defaultLimit: null,
    unit: null,
    icon: Sliders
  },
  plagiarism_check: {
    name: 'Plagiarism Check',
    description: 'Check content for plagiarism',
    category: 'content',
    defaultLimit: 50,
    unit: 'checks/month',
    icon: Shield
  },
  
  // White Label Features
  custom_domain: {
    name: 'Custom Domain',
    description: 'Use your own domain name',
    category: 'white_label',
    defaultLimit: 1,
    unit: 'domain',
    icon: Globe
  },
  white_label: {
    name: 'White Label Mode',
    description: 'Remove LocalRNK branding',
    category: 'white_label',
    defaultLimit: null,
    unit: null,
    icon: Palette
  },
  custom_branding: {
    name: 'Custom Branding',
    description: 'Upload custom logo and colors',
    category: 'white_label',
    defaultLimit: null,
    unit: null,
    icon: Palette
  },
  custom_email_templates: {
    name: 'Custom Email Templates',
    description: 'Customize email templates with your branding',
    category: 'white_label',
    defaultLimit: null,
    unit: null,
    icon: Mail
  },
  
  // Integration Features
  api_access: {
    name: 'API Access',
    description: 'Access to REST API for integrations',
    category: 'integrations',
    defaultLimit: 1000,
    unit: 'requests/month',
    icon: Puzzle
  },
  webhooks: {
    name: 'Webhooks',
    description: 'Configure webhook endpoints',
    category: 'integrations',
    defaultLimit: 10,
    unit: 'endpoints',
    icon: Zap
  },
  zapier_integration: {
    name: 'Zapier Integration',
    description: 'Connect with Zapier',
    category: 'integrations',
    defaultLimit: null,
    unit: null,
    icon: Puzzle
  },
  slack_integration: {
    name: 'Slack Integration',
    description: 'Get notifications in Slack',
    category: 'integrations',
    defaultLimit: null,
    unit: null,
    icon: Puzzle
  },
  
  // Security Features
  sso: {
    name: 'Single Sign-On (SSO)',
    description: 'Enable SSO with SAML/OAuth',
    category: 'security',
    defaultLimit: null,
    unit: null,
    icon: Shield
  },
  audit_logs: {
    name: 'Audit Logs',
    description: 'Access detailed audit logs',
    category: 'security',
    defaultLimit: 90,
    unit: 'days retention',
    icon: FileSearch
  },
  ip_whitelist: {
    name: 'IP Whitelist',
    description: 'Restrict access by IP address',
    category: 'security',
    defaultLimit: 10,
    unit: 'IP addresses',
    icon: Shield
  }
};

// Individual feature toggle card
const FeatureToggleCard = ({ 
  feature, 
  featureKey, 
  onToggle, 
  onLimitChange,
  isOverridden 
}) => {
  const definition = FEATURE_DEFINITIONS[featureKey] || {
    name: featureKey,
    description: 'No description available',
    category: 'general',
    icon: Sliders
  };
  
  const Icon = definition.icon;
  const category = FEATURE_CATEGORIES[definition.category] || FEATURE_CATEGORIES.general;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 ${
        feature.is_enabled 
          ? 'border-gray-800/50 hover:border-[#00F2FF]/30' 
          : 'border-gray-800/30 opacity-60'
      }`}
    >
      {/* Glow effect for enabled features */}
      {feature.is_enabled && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${category.color}, transparent 70%)`
          }}
        />
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${category.color}20`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: category.color }} />
            </div>
            <div>
              <h4 className="font-semibold text-white">{definition.name}</h4>
              <Badge 
                variant="outline" 
                className="text-xs mt-1"
                style={{ borderColor: `${category.color}40`, color: category.color }}
              >
                {category.label}
              </Badge>
            </div>
          </div>
          
          <Switch
            checked={feature.is_enabled}
            onCheckedChange={() => onToggle(featureKey, !feature.is_enabled)}
            className="data-[state=checked]:bg-[#00F2FF]"
          />
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-400 mb-4">{definition.description}</p>
        
        {/* Limit control */}
        {definition.defaultLimit !== null && feature.is_enabled && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-800/50">
            <span className="text-sm text-gray-500">Limit:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={feature.limit_value || definition.defaultLimit}
                onChange={(e) => onLimitChange(featureKey, parseInt(e.target.value) || 0)}
                className="w-24 h-8 bg-gray-800/50 border-gray-700 text-white text-sm"
                min={0}
              />
              <span className="text-sm text-gray-500">{definition.unit}</span>
            </div>
          </div>
        )}
        
        {/* Override indicator */}
        {isOverridden && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#c8ff00]" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Feature limit overridden from default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
};

// Bulk actions bar
const BulkActionsBar = ({ 
  selectedTenant, 
  features, 
  onBulkEnable, 
  onBulkDisable,
  onResetDefaults 
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const enabledCount = Object.values(features).filter(f => f.is_enabled).length;
  const totalCount = Object.keys(FEATURE_DEFINITIONS).length;
  
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00F2FF]" />
            <span className="text-white font-medium">
              {enabledCount} of {totalCount} features enabled
            </span>
          </div>
          
          <div className="h-6 w-px bg-gray-800 hidden md:block" />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkEnable}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Check className="w-4 h-4 mr-1" />
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDisable}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-1" />
              Disable All
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {showResetConfirm ? (
            <>
              <span className="text-sm text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Reset all to defaults?
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="text-gray-400"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onResetDefaults();
                  setShowResetConfirm(false);
                }}
              >
                Reset
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-gray-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset to Defaults
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main FeatureToggles component
export default function FeatureToggles({ tenantId }) {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFeatures, setOriginalFeatures] = useState({});
  
  // Fetch features
  const fetchFeatures = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const response = await base44.entities.FeatureOverride.filter(
        { tenant_id: tenantId },
        { limit: 100 }
      );
      
      const featuresMap = {};
      response.forEach(feature => {
        featuresMap[feature.feature_key] = feature;
      });
      
      // Fill in missing features with defaults
      Object.keys(FEATURE_DEFINITIONS).forEach(key => {
        if (!featuresMap[key]) {
          const def = FEATURE_DEFINITIONS[key];
          featuresMap[key] = {
            feature_key: key,
            is_enabled: false,
            limit_value: def.defaultLimit,
            feature_category: def.category
          };
        }
      });
      
      setFeatures(featuresMap);
      setOriginalFeatures(JSON.parse(JSON.stringify(featuresMap)));
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFeatures();
  }, [tenantId]);
  
  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(features) !== JSON.stringify(originalFeatures);
    setHasChanges(changed);
  }, [features, originalFeatures]);
  
  // Filter features
  const filteredFeatures = Object.entries(features).filter(([key, feature]) => {
    const definition = FEATURE_DEFINITIONS[key];
    const matchesSearch = 
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      definition?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      feature.feature_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group by category
  const groupedFeatures = filteredFeatures.reduce((acc, [key, feature]) => {
    const category = feature.feature_category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push([key, feature]);
    return acc;
  }, {});
  
  // Actions
  const handleToggle = (featureKey, enabled) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        is_enabled: enabled
      }
    }));
  };
  
  const handleLimitChange = (featureKey, limit) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        limit_value: limit
      }
    }));
  };
  
  const handleSave = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const updates = Object.entries(features).map(async ([key, feature]) => {
        const definition = FEATURE_DEFINITIONS[key];
        
        if (feature.id) {
          // Update existing
          return base44.entities.FeatureOverride.update(feature.id, {
            is_enabled: feature.is_enabled,
            limit_value: feature.limit_value
          });
        } else {
          // Create new
          return base44.entities.FeatureOverride.create({
            tenant_id: tenantId,
            feature_key: key,
            feature_category: definition?.category || 'general',
            is_enabled: feature.is_enabled,
            limit_value: feature.limit_value
          });
        }
      });
      
      await Promise.all(updates);
      setOriginalFeatures(JSON.parse(JSON.stringify(features)));
      setHasChanges(false);
      alert('Features saved successfully!');
    } catch (error) {
      console.error('Error saving features:', error);
      alert('Failed to save features');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBulkEnable = () => {
    setFeatures(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], is_enabled: true };
      });
      return updated;
    });
  };
  
  const handleBulkDisable = () => {
    setFeatures(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], is_enabled: false };
      });
      return updated;
    });
  };
  
  const handleResetDefaults = () => {
    setFeatures(prev => {
      const updated = {};
      Object.keys(FEATURE_DEFINITIONS).forEach(key => {
        const def = FEATURE_DEFINITIONS[key];
        updated[key] = {
          ...prev[key],
          is_enabled: false,
          limit_value: def.defaultLimit
        };
      });
      return updated;
    });
  };
  
  if (!tenantId) {
    return (
      <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
        <Sliders className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Select a Tenant</h3>
        <p className="text-gray-400">Choose a tenant to manage their feature toggles</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Feature Toggles</h1>
          <p className="text-gray-400 mt-1">Manage features and limits for this tenant</p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`${
            hasChanges 
              ? 'bg-[#c8ff00] hover:bg-[#d4ff33] text-black' 
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features..."
            className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' 
              ? 'bg-[#00F2FF]/20 text-[#00F2FF] border-[#00F2FF]/50' 
              : 'border-gray-700 text-gray-400'
            }
          >
            All
          </Button>
          {Object.entries(FEATURE_CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className={selectedCategory === key 
                ? 'border-gray-700' 
                : 'border-gray-700 text-gray-400'
              }
              style={selectedCategory === key ? {
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}50`
              } : {}}
            >
              <category.icon className="w-3 h-3 mr-1" />
              {category.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Bulk actions */}
      <BulkActionsBar
        selectedTenant={tenantId}
        features={features}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onResetDefaults={handleResetDefaults}
      />
      
      {/* Features grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
            const categoryInfo = FEATURE_CATEGORIES[category] || FEATURE_CATEGORIES.general;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <categoryInfo.icon className="w-5 h-5" style={{ color: categoryInfo.color }} />
                  <h3 className="text-lg font-semibold text-white">{categoryInfo.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryFeatures.length}
                  </Badge>
                </div>
                
                <motion.div 
                  layout
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <AnimatePresence mode="popLayout">
                    {categoryFeatures.map(([key, feature]) => (
                      <FeatureToggleCard
                        key={key}
                        featureKey={key}
                        feature={feature}
                        onToggle={handleToggle}
                        onLimitChange={handleLimitChange}
                        isOverridden={feature.limit_value !== FEATURE_DEFINITIONS[key]?.defaultLimit}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
          
          {filteredFeatures.length === 0 && (
            <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No features found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
