import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Database, 
  Users, 
  FileSearch, 
  FolderOpen,
  HardDrive,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw,
  Plus,
  Minus,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Resource definitions
const RESOURCE_DEFINITIONS = {
  max_audits: {
    name: 'Monthly Audits',
    description: 'Maximum number of SEO audits per month',
    icon: FileSearch,
    min: 0,
    max: 10000,
    step: 10,
    presets: [50, 100, 250, 500, 1000, 5000, 10000],
    unit: 'audits'
  },
  max_users: {
    name: 'Team Members',
    description: 'Maximum number of user seats',
    icon: Users,
    min: 1,
    max: 100,
    step: 1,
    presets: [1, 3, 5, 10, 25, 50, 100],
    unit: 'users'
  },
  max_projects: {
    name: 'Projects',
    description: 'Maximum number of active projects',
    icon: FolderOpen,
    min: 1,
    max: 500,
    step: 5,
    presets: [5, 10, 25, 50, 100, 250, 500],
    unit: 'projects'
  },
  storage_limit_mb: {
    name: 'Storage',
    description: 'Storage limit for files and data',
    icon: HardDrive,
    min: 100,
    max: 102400,
    step: 100,
    presets: [1024, 5120, 10240, 51200, 102400],
    unit: 'MB',
    displayUnit: 'GB',
    convertToDisplay: (val) => (val / 1024).toFixed(1)
  }
};

// Plan presets
const PLAN_PRESETS = {
  starter: {
    name: 'Starter',
    max_audits: 100,
    max_users: 3,
    max_projects: 10,
    storage_limit_mb: 1024
  },
  growth: {
    name: 'Growth',
    max_audits: 500,
    max_users: 10,
    max_projects: 50,
    storage_limit_mb: 5120
  },
  pro: {
    name: 'Pro',
    max_audits: 2000,
    max_users: 25,
    max_projects: 200,
    storage_limit_mb: 51200
  },
  enterprise: {
    name: 'Enterprise',
    max_audits: 10000,
    max_users: 100,
    max_projects: 500,
    storage_limit_mb: 102400
  }
};

// Resource card component
const ResourceCard = ({ 
  resourceKey, 
  value, 
  currentUsage,
  onChange 
}) => {
  const definition = RESOURCE_DEFINITIONS[resourceKey];
  const Icon = definition.icon;
  
  const displayValue = definition.convertToDisplay 
    ? definition.convertToDisplay(value)
    : value;
  const displayUnit = definition.displayUnit || definition.unit;
  
  const usagePercent = definition.max > 0 
    ? Math.min((currentUsage / value) * 100, 100)
    : 0;
  
  const getUsageColor = (percent) => {
    if (percent >= 90) return 'text-red-400';
    if (percent >= 75) return 'text-amber-400';
    return 'text-emerald-400';
  };
  
  const getProgressColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:border-[#00F2FF]/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F2FF]/20 to-[#c8ff00]/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#00F2FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{definition.name}</h3>
            <p className="text-sm text-gray-500">{definition.description}</p>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{definition.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Range: {definition.min.toLocaleString()} - {definition.max.toLocaleString()} {definition.unit}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Current usage */}
      {currentUsage > 0 && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Usage</span>
            <span className={`text-sm font-medium ${getUsageColor(usagePercent)}`}>
              {currentUsage.toLocaleString()} / {displayValue} {displayUnit}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${getProgressColor(usagePercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className={`text-xs mt-1 ${getUsageColor(usagePercent)}`}>
            {usagePercent.toFixed(1)}% used
          </p>
        </div>
      )}
      
      {/* Value input */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-gray-700 text-gray-400 hover:text-white"
            onClick={() => onChange(Math.max(definition.min, value - definition.step))}
            disabled={value <= definition.min}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 text-center">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(Math.max(definition.min, Math.min(definition.max, parseInt(e.target.value) || 0)))}
              className="text-center text-2xl font-bold bg-transparent border-0 text-white focus-visible:ring-0"
            />
            <span className="text-sm text-gray-500">{definition.unit}</span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="border-gray-700 text-gray-400 hover:text-white"
            onClick={() => onChange(Math.min(definition.max, value + definition.step))}
            disabled={value >= definition.max}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Slider */}
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          className="py-2"
        />
        
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {definition.presets.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => onChange(preset)}
              className={`text-xs ${
                value === preset 
                  ? 'bg-[#00F2FF]/20 text-[#00F2FF] border-[#00F2FF]/50' 
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {definition.convertToDisplay 
                ? definition.convertToDisplay(preset)
                : preset.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Usage overview component
const UsageOverview = ({ resources, usage }) => {
  const stats = [
    { 
      label: 'Audits', 
      used: usage.audits_count || 0, 
      total: resources.max_audits,
      icon: FileSearch,
      color: '#00F2FF'
    },
    { 
      label: 'Users', 
      used: usage.users_count || 0, 
      total: resources.max_users,
      icon: Users,
      color: '#c8ff00'
    },
    { 
      label: 'Projects', 
      used: usage.projects_count || 0, 
      total: resources.max_projects,
      icon: FolderOpen,
      color: '#a855f7'
    },
    { 
      label: 'Storage', 
      used: usage.storage_used_mb || 0, 
      total: resources.storage_limit_mb,
      icon: HardDrive,
      color: '#ec4899',
      format: (v) => v >= 1024 ? `${(v/1024).toFixed(1)}GB` : `${v}MB`
    }
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const percent = stat.total > 0 ? (stat.used / stat.total) * 100 : 0;
        const Icon = stat.icon;
        
        return (
          <div 
            key={stat.label}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-5 h-5" style={{ color: stat.color }} />
              <span className={`text-xs ${
                percent >= 90 ? 'text-red-400' : 
                percent >= 75 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {percent.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stat.format ? stat.format(stat.used) : stat.used.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              of {stat.format ? stat.format(stat.total) : stat.total.toLocaleString()} {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// Main ResourceLimits component
export default function ResourceLimits({ tenantId }) {
  const [resources, setResources] = useState({
    max_audits: 100,
    max_users: 5,
    max_projects: 10,
    storage_limit_mb: 1024
  });
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalResources, setOriginalResources] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Fetch tenant resources
  const fetchResources = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const tenant = await base44.entities.Tenant.get(tenantId);
      
      const resourceData = {
        max_audits: tenant.max_audits || 100,
        max_users: tenant.max_users || 5,
        max_projects: tenant.max_projects || 10,
        storage_limit_mb: tenant.storage_limit_mb || 1024
      };
      
      setResources(resourceData);
      setOriginalResources(JSON.parse(JSON.stringify(resourceData)));
      
      // Fetch usage from health check
      const health = await base44.entities.TenantHealthCheck.filter(
        { tenant_id: tenantId },
        { sort: { field: 'created_at', direction: 'desc' }, limit: 1 }
      );
      
      if (health.length > 0) {
        setUsage({
          audits_count: health[0].audits_count || 0,
          users_count: health[0].users_count || 0,
          projects_count: health[0].projects_count || 0,
          storage_used_mb: health[0].storage_used_mb || 0
        });
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchResources();
  }, [tenantId]);
  
  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(resources) !== JSON.stringify(originalResources);
    setHasChanges(changed);
  }, [resources, originalResources]);
  
  const handleResourceChange = (key, value) => {
    setResources(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      await base44.entities.Tenant.update(tenantId, {
        max_audits: resources.max_audits,
        max_users: resources.max_users,
        max_projects: resources.max_projects,
        storage_limit_mb: resources.storage_limit_mb
      });
      
      // Also update corresponding feature overrides
      await base44.entities.FeatureOverride.update(
        { tenant_id: tenantId, feature_key: 'seo_audit' },
        { limit_value: resources.max_audits }
      );
      
      await base44.entities.FeatureOverride.update(
        { tenant_id: tenantId, feature_key: 'team_collaboration' },
        { limit_value: resources.max_users }
      );
      
      setOriginalResources(JSON.parse(JSON.stringify(resources)));
      setHasChanges(false);
      alert('Resource limits saved successfully!');
    } catch (error) {
      console.error('Error saving resources:', error);
      alert('Failed to save resource limits');
    } finally {
      setSaving(false);
    }
  };
  
  const handleApplyPlan = (planKey) => {
    const plan = PLAN_PRESETS[planKey];
    if (plan) {
      setResources({
        max_audits: plan.max_audits,
        max_users: plan.max_users,
        max_projects: plan.max_projects,
        storage_limit_mb: plan.storage_limit_mb
      });
      setSelectedPlan(planKey);
    }
  };
  
  const handleReset = () => {
    setResources(JSON.parse(JSON.stringify(originalResources)));
    setSelectedPlan(null);
  };
  
  if (!tenantId) {
    return (
      <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
        <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Select a Tenant</h3>
        <p className="text-gray-400">Choose a tenant to manage their resource limits</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Resource Limits</h1>
          <p className="text-gray-400 mt-1">Configure usage limits for this tenant</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
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
      </div>
      
      {/* Plan presets */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Apply Plan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PLAN_PRESETS).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => handleApplyPlan(key)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedPlan === key
                  ? 'bg-[#00F2FF]/10 border-[#00F2FF] text-white'
                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              <p className="font-semibold capitalize">{plan.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {plan.max_audits.toLocaleString()} audits
              </p>
              <p className="text-xs text-gray-500">
                {plan.max_users} users
              </p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Usage overview */}
      <UsageOverview resources={resources} usage={usage} />
      
      {/* Resource cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#00F2FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.keys(RESOURCE_DEFINITIONS).map((key) => (
            <ResourceCard
              key={key}
              resourceKey={key}
              value={resources[key]}
              currentUsage={usage[`${key.replace('max_', '').replace('_limit_mb', '')}_count`] || usage[`${key.replace('max_', '').replace('_limit_mb', '')}_used_mb`] || 0}
              onChange={(value) => handleResourceChange(key, value)}
            />
          ))}
        </div>
      )}
      
      {/* Warning for high usage */}
      {usage.audits_count > resources.max_audits * 0.9 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">
            Warning: This tenant is approaching their audit limit. Consider upgrading their plan.
          </p>
        </motion.div>
      )}
    </div>
  );
}
