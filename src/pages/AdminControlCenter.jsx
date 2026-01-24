import React, { useState, useEffect, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, DollarSign, TrendingUp, AlertCircle, Mail, Bug, Repeat,
  Settings, Eye, Shield, RefreshCw, Download, Lock, Target, Brain, Zap,
  Activity, TrendingDown, CheckCircle2, XCircle, Clock, ArrowUpRight,
  Loader2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

// Lazy load components
const AdminMetrics = lazy(() => import('@/components/admin/AdminMetrics'));
const AdminLeadsSection = lazy(() => import('@/components/admin/AdminLeadsSection'));
const AdminOrdersSection = lazy(() => import('@/components/admin/AdminOrdersSection'));
const AdminAutomations = lazy(() => import('@/components/admin/AdminAutomations'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const AdminSecurityAudit = lazy(() => import('@/components/admin/AdminSecurityAudit'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const EmailAnalyticsDashboard = lazy(() => import('@/components/admin/EmailAnalyticsDashboard'));
const ErrorMonitoring = lazy(() => import('@/components/admin/ErrorMonitoring'));
const LeadNurture = lazy(() => import('@/components/admin/LeadNurture'));
const AdminABTests = lazy(() => import('@/components/admin/AdminABTests'));
const TestModeIndicator = lazy(() => import('@/components/admin/TestModeIndicator'));
const V3Analytics = lazy(() => import('@/components/admin/V3Analytics'));
const HealthCheckHistory = lazy(() => import('@/components/admin/HealthCheckHistory'));
const LeadScoringDashboard = lazy(() => import('@/components/admin/LeadScoringDashboard'));
const RevenueAttribution = lazy(() => import('@/components/analytics/RevenueAttribution'));
const AdvancedAnalytics = lazy(() => import('@/components/admin/AdvancedAnalytics'));
const PredictiveAnalytics = lazy(() => import('@/components/admin/PredictiveAnalytics'));
const SegmentManager = lazy(() => import('@/components/admin/SegmentManager'));
const SystemHealthMonitor = lazy(() => import('@/components/admin/SystemHealthMonitor'));
const ErrorTrackingDashboard = lazy(() => import('@/components/admin/ErrorTrackingDashboard'));

// Modern loading component with skeleton
const TabLoader = () => (
  <div className="space-y-4">
    <div className="h-32 bg-gray-800/30 rounded-xl animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-48 bg-gray-800/30 rounded-xl animate-pulse" />
      <div className="h-48 bg-gray-800/30 rounded-xl animate-pulse" />
      <div className="h-48 bg-gray-800/30 rounded-xl animate-pulse" />
    </div>
  </div>
);

// Enhanced Metric Card Component
function MetricCard({ icon: Icon, label, value, change, trend, color = "blue", isLoading = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c8ff00]/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-${color}-500/10`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          {change && (
            <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="gap-1">
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}
            </Badge>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-400">{label}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Funnel Mode Switcher Component
function FunnelModeSwitcher() {
  const [currentMode, setCurrentMode] = useState('v2');
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState('https://www.merchynt.com/paige?fpr=mr22&fp_sid=sg');
  const [bridgeTimer, setBridgeTimer] = useState(3);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadFunnelMode();
  }, []);

  const loadFunnelMode = async () => {
    try {
      const [modeSettings, linkSettings, timerSettings] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'funnel_mode' }),
        base44.entities.AppSettings.filter({ setting_key: 'affiliate_link' }),
        base44.entities.AppSettings.filter({ setting_key: 'bridge_timer' })
      ]);
      
      if (modeSettings.length > 0) {
        setCurrentMode(modeSettings[0].setting_value.mode || 'v2');
      }
      if (linkSettings.length > 0) {
        setAffiliateLink(linkSettings[0].setting_value.url || 'https://www.merchynt.com/paige?fpr=mr22&fp_sid=sg');
      }
      if (timerSettings.length > 0) {
        setBridgeTimer(timerSettings[0].setting_value.seconds || 3);
      }
    } catch (error) {
      console.error('Error loading funnel mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = async (mode) => {
    setIsSwitching(true);
    try {
      const existing = await base44.entities.AppSettings.filter({ setting_key: 'funnel_mode' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { mode, updated_at: new Date().toISOString() }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'funnel_mode',
          setting_value: { mode, updated_at: new Date().toISOString() },
          category: 'general',
          description: 'Active funnel mode: v2 (Stripe) or v3 (Affiliate)'
        });
      }
      
      setCurrentMode(mode);
      base44.analytics.track({ eventName: 'funnel_mode_switched', properties: { mode } });
    } catch (error) {
      console.error('Error switching mode:', error);
      alert('Failed to switch mode');
    } finally {
      setIsSwitching(false);
    }
  };

  const updateAffiliateLink = async () => {
    try {
      const existing = await base44.entities.AppSettings.filter({ setting_key: 'affiliate_link' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { url: affiliateLink, updated_at: new Date().toISOString() }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'affiliate_link',
          setting_value: { url: affiliateLink, updated_at: new Date().toISOString() },
          category: 'general',
          description: 'Affiliate redirect URL for V3 funnel'
        });
      }
      
      setIsEditingLink(false);
      base44.analytics.track({ eventName: 'affiliate_link_updated' });
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      alert('Failed to update link');
    }
  };

  const updateBridgeTimer = async () => {
    try {
      const seconds = parseInt(bridgeTimer);
      if (seconds < 1 || seconds > 10) {
        alert('Timer must be between 1-10 seconds');
        return;
      }

      const existing = await base44.entities.AppSettings.filter({ setting_key: 'bridge_timer' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { seconds, updated_at: new Date().toISOString() }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'bridge_timer',
          setting_value: { seconds, updated_at: new Date().toISOString() },
          category: 'general',
          description: 'Bridge page countdown timer in seconds'
        });
      }
      
      setIsEditingTimer(false);
      base44.analytics.track({ eventName: 'bridge_timer_updated', properties: { seconds } });
    } catch (error) {
      console.error('Error updating timer:', error);
      alert('Failed to update timer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('v2')}
          disabled={isSwitching}
          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
            currentMode === 'v2'
              ? 'border-[#c8ff00] bg-gradient-to-br from-[#c8ff00]/10 to-transparent'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
          } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {currentMode === 'v2' && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-[#c8ff00] text-black font-bold">ACTIVE</Badge>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Quiz V2</h3>
            </div>
            
            <p className="text-sm text-gray-400">
              Direct sale funnel with Stripe checkout
            </p>
            
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Quiz → Pricing → Checkout
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                $0.11/day subscription plans
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Direct customer billing
              </div>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('v3')}
          disabled={isSwitching}
          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
            currentMode === 'v3'
              ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-transparent'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
          } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {currentMode === 'v3' && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-black font-bold">ACTIVE</Badge>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <ExternalLink className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Quiz V3</h3>
            </div>
            
            <p className="text-sm text-gray-400">
              Affiliate bridge funnel to Paige AI
            </p>
            
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Quiz → Results → Bridge
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Lost revenue metrics
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Passive commission revenue
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-4 rounded-xl border ${
          currentMode === 'v2' 
            ? 'border-[#c8ff00]/30 bg-[#c8ff00]/5' 
            : 'border-green-500/30 bg-green-500/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentMode === 'v2' ? 'bg-[#c8ff00]' : 'bg-green-500'
            } animate-pulse`} />
            <div>
              <p className="text-white font-semibold text-sm">
                Currently Running: {currentMode === 'v2' ? 'Quiz V2 (Stripe)' : 'Quiz V3 (Affiliate)'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentMode === 'v2' 
                  ? 'Users see pricing & checkout after quiz'
                  : 'Users see results with affiliate CTA'
                }
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-gray-400"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      {/* Advanced Controls (Collapsible) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Entry Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">V2 Entry Point</p>
                <code className="text-sm text-[#c8ff00] font-mono">/Quiz</code>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">V3 Entry Point</p>
                <code className="text-sm text-green-400 font-mono">/QuizV3</code>
              </div>
            </div>

            {/* V3 Specific Controls */}
            {currentMode === 'v3' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Affiliate Link */}
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-green-400" />
                      <h4 className="text-sm font-semibold text-white">Affiliate Redirect URL</h4>
                    </div>
                    <Button
                      onClick={() => setIsEditingLink(!isEditingLink)}
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-green-300"
                    >
                      {isEditingLink ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditingLink ? (
                    <div className="space-y-2">
                      <Input
                        value={affiliateLink}
                        onChange={(e) => setAffiliateLink(e.target.value)}
                        className="bg-gray-900 border-green-500/30 text-white font-mono text-sm"
                        placeholder="https://..."
                      />
                      <Button
                        onClick={updateAffiliateLink}
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Link
                      </Button>
                    </div>
                  ) : (
                    <div className="font-mono text-xs text-green-400 break-all p-3 bg-gray-900/50 rounded-lg">
                      {affiliateLink}
                    </div>
                  )}
                </div>

                {/* Bridge Timer */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-semibold text-white">Bridge Page Timer</h4>
                    </div>
                    <Button
                      onClick={() => setIsEditingTimer(!isEditingTimer)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {isEditingTimer ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditingTimer ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={bridgeTimer}
                          onChange={(e) => setBridgeTimer(e.target.value)}
                          className="bg-gray-900 border-blue-500/30 text-white"
                        />
                        <span className="text-gray-400 text-sm whitespace-nowrap">seconds</span>
                      </div>
                      <Button
                        onClick={updateBridgeTimer}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-black font-semibold"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Timer
                      </Button>
                    </div>
                  ) : (
                    <div className="text-blue-400 font-semibold text-lg">
                      {bridgeTimer} second{bridgeTimer !== 1 ? 's' : ''} countdown
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    How long the "Syncing" screen displays before redirect (1-10s)
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminControlCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for admin key in URL
      const urlParams = new URLSearchParams(window.location.search);
      const providedKey = urlParams.get('key');
      
      if (providedKey) {
        try {
          const response = await base44.functions.invoke('admin/validateAdminKey', { key: providedKey });
          if (response.data.valid) {
            setUser({ email: 'admin@key-access', role: 'admin', full_name: 'Admin (Key Access)' });
            setLoading(false);
            return;
          }
        } catch (keyError) {
          console.error('Invalid admin key');
        }
      }
      
      // Fallback to normal user auth
      const currentUser = await base44.auth.me();
      
      if (currentUser?.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      window.location.href = '/';
    }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Admin Control Center...</p>
        </div>
      </div>
    );
  }

  const tabConfig = [
    { value: 'overview', icon: BarChart3, label: 'Overview', color: 'blue' },
    { value: 'leads', icon: Users, label: 'Leads', color: 'indigo' },
    { value: 'orders', icon: DollarSign, label: 'Orders', color: 'green' },
    { value: 'analytics', icon: TrendingUp, label: 'Analytics', color: 'purple' },
    { value: 'predictive', icon: Brain, label: 'AI Insights', color: 'pink' },
    { value: 'segments', icon: Target, label: 'Segments', color: 'yellow' },
    { value: 'abtests', icon: Eye, label: 'A/B Tests', color: 'cyan' },
    { value: 'automations', icon: Repeat, label: 'Automations', color: 'orange' },
    { value: 'emails', icon: Mail, label: 'Emails', color: 'red' },
    { value: 'nurture', icon: Activity, label: 'Nurture', color: 'teal' },
    { value: 'scoring', icon: Target, label: 'Scoring', color: 'lime' },
    { value: 'health', icon: Activity, label: 'Health', color: 'emerald' },
    { value: 'errors', icon: Bug, label: 'Errors', color: 'rose' },
    { value: 'users', icon: Lock, label: 'Users', color: 'violet' },
    { value: 'attribution', icon: BarChart3, label: 'Revenue', color: 'amber' },
    { value: 'settings', icon: Settings, label: 'Settings', color: 'slate' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Enhanced Fixed Header */}
      <div className="sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-xl bg-[#0a0a0f]/90">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                  <Shield className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Super Admin Control Center</h1>
                  <p className="text-xs text-gray-400">Full system monitoring & control</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Test Mode Indicator */}
        <Suspense fallback={null}>
          <TestModeIndicator isTestMode={true} />
        </Suspense>
        
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Suspense fallback={<TabLoader />}>
            <AdminMetrics />
          </Suspense>
        </motion.div>

        {/* Enhanced Tabs with Better UI */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto p-1 bg-gray-800/50 border border-gray-700 rounded-xl gap-1">
              {tabConfig.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="space-y-6 mt-0">
                <Suspense fallback={<TabLoader />}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <AdminLeadsSection />
                    <AdminOrdersSection />
                    <AdminSecurityAudit />
                  </div>
                </Suspense>
              </TabsContent>

              <TabsContent value="predictive" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <PredictiveAnalytics />
                </Suspense>
              </TabsContent>

              <TabsContent value="segments" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <SegmentManager />
                </Suspense>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdvancedAnalytics />
                </Suspense>
              </TabsContent>

              <TabsContent value="leads" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminLeadsSection expanded />
                </Suspense>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminOrdersSection expanded />
                </Suspense>
              </TabsContent>

              <TabsContent value="abtests" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminABTests />
                </Suspense>
              </TabsContent>

              <TabsContent value="automations" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminAutomations />
                </Suspense>
              </TabsContent>

              <TabsContent value="emails" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <EmailAnalyticsDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="nurture" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <LeadNurture />
                </Suspense>
              </TabsContent>

              <TabsContent value="health" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <HealthCheckHistory />
                </Suspense>
              </TabsContent>

              <TabsContent value="errors" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <ErrorTrackingDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <UserManagement />
                </Suspense>
              </TabsContent>

              <TabsContent value="scoring" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <LeadScoringDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="attribution" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <RevenueAttribution />
                </Suspense>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminSettings />
                </Suspense>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* V3 Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">QuizV3 Affiliate Analytics</CardTitle>
                    <CardDescription>Real-time performance metrics for affiliate funnel</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TabLoader />}>
                <V3Analytics />
              </Suspense>
            </CardContent>
          </Card>
        </motion.div>

        {/* Funnel Mode Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                  <Settings className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div>
                  <CardTitle className="text-white">Funnel Mode Control</CardTitle>
                  <CardDescription>Switch between Stripe direct sales and affiliate funnel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FunnelModeSwitcher />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}