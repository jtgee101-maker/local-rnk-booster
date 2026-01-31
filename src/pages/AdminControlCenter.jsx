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
  Loader2, ChevronDown, ChevronUp, ExternalLink, Sparkles, FileText
} from 'lucide-react';

// Lazy load components
const AdminMetrics = lazy(() => import('@/components/admin/AdminMetrics'));
const AdminLeadsSection = lazy(() => import('@/components/admin/AdminLeadsSection'));
const AdminOrdersSection = lazy(() => import('@/components/admin/AdminOrdersSection'));
const AdminAutomations = lazy(() => import('@/components/admin/AdminAutomations'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const EmailRetryManager = lazy(() => import('@/components/admin/EmailRetryManager'));
const SecurityStatusCard = lazy(() => import('@/components/admin/SecurityStatusCard'));
const AdminSecurityAudit = lazy(() => import('@/components/admin/AdminSecurityAudit'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const EmailAnalyticsDashboard = lazy(() => import('@/components/admin/EmailAnalyticsDashboard'));
const ErrorMonitoring = lazy(() => import('@/components/admin/ErrorMonitoring'));
const LeadNurture = lazy(() => import('@/components/admin/LeadNurture'));
const AdminABTests = lazy(() => import('@/components/admin/AdminABTests'));
const TestModeIndicator = lazy(() => import('@/components/admin/TestModeIndicator'));
const DynamicFunnelAnalytics = lazy(() => import('@/components/admin/DynamicFunnelAnalytics'));
const AffiliateAnalytics = lazy(() => import('@/components/admin/AffiliateAnalytics'));
const HealthCheckHistory = lazy(() => import('@/components/admin/HealthCheckHistory'));
const LeadScoringDashboard = lazy(() => import('@/components/admin/LeadScoringDashboard'));
const RevenueAttribution = lazy(() => import('@/components/analytics/RevenueAttribution'));
const AdvancedAnalytics = lazy(() => import('@/components/admin/AdvancedAnalytics'));
const PredictiveAnalytics = lazy(() => import('@/components/admin/PredictiveAnalytics'));
const SegmentManager = lazy(() => import('@/components/admin/SegmentManager'));
const SystemHealthMonitor = lazy(() => import('@/components/admin/SystemHealthMonitor'));
const ErrorTrackingDashboard = lazy(() => import('@/components/admin/ErrorTrackingDashboard'));
const BehavioralCommandCenter = lazy(() => import('@/components/admin/BehavioralCommandCenter'));
const CampaignManager = lazy(() => import('@/components/admin/CampaignManager'));
const AdvancedSegmentation = lazy(() => import('@/components/admin/AdvancedSegmentation'));
const RevenueAttributionPanel = lazy(() => import('@/components/admin/RevenueAttributionPanel'));
const CohortAnalysis = lazy(() => import('@/components/admin/CohortAnalysis'));
const ABTestManager = lazy(() => import('@/components/admin/ABTestManager'));
const CustomerJourneyMap = lazy(() => import('@/components/admin/CustomerJourneyMap'));
const RealTimeActivityFeed = lazy(() => import('@/components/admin/RealTimeActivityFeed'));
const FunnelDropoffAnalysis = lazy(() => import('@/components/admin/FunnelDropoffAnalysis'));
const CampaignPerformanceDashboard = lazy(() => import('@/components/admin/CampaignPerformanceDashboard'));
const EmailHeatmapAnalytics = lazy(() => import('@/components/admin/EmailHeatmapAnalytics'));
const AIRecommendationEngine = lazy(() => import('@/components/admin/AIRecommendationEngine'));
const RevenueForecastModel = lazy(() => import('@/components/admin/RevenueForecastModel'));
const PredictiveLeadScoringV2 = lazy(() => import('@/components/admin/PredictiveLeadScoringV2'));
const SystemStatusDashboard = lazy(() => import('@/components/admin/SystemStatusDashboard'));
const AdvancedErrorAnalytics = lazy(() => import('@/components/admin/AdvancedErrorAnalytics'));
const PerformanceMetricsDashboard = lazy(() => import('@/components/admin/PerformanceMetricsDashboard'));
const AutomatedReportGenerator = lazy(() => import('@/components/admin/AutomatedReportGenerator'));
const NotificationCenter = lazy(() => import('@/components/admin/NotificationCenter'));
const QuickActionsPanel = lazy(() => import('@/components/admin/QuickActionsPanel'));
const AdminActivityLog = lazy(() => import('@/components/admin/AdminActivityLog'));
const IntegrationHealthMonitor = lazy(() => import('@/components/admin/IntegrationHealthMonitor'));
const DataBackupTools = lazy(() => import('@/components/admin/DataBackupTools'));
const KeyboardShortcuts = lazy(() => import('@/components/admin/KeyboardShortcuts'));
const MobileOptimizedHeader = lazy(() => import('@/components/admin/MobileOptimizedHeader'));
const SystemTestingDashboard = lazy(() => import('@/components/admin/SystemTestingDashboard'));
const PerformanceMonitor = lazy(() => import('@/components/admin/PerformanceMonitor'));
const ProductionReadinessChecklist = lazy(() => import('@/components/admin/ProductionReadinessChecklist'));
const RealTimeSystemTest = lazy(() => import('@/components/admin/RealTimeSystemTest'));
const ControlActionsVerifier = lazy(() => import('@/components/admin/ControlActionsVerifier'));
const EndToEndFlowTest = lazy(() => import('@/components/admin/EndToEndFlowTest'));
const SecurityComplianceTest = lazy(() => import('@/components/admin/SecurityComplianceTest'));

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
  const [geeniusPathways, setGeeniusPathways] = useState({
    pathway1_url: 'https://example.com/govtech-grant',
    pathway2_url: 'https://example.com/done-for-you',
    pathway3_checkout_url: 'https://buy.stripe.com/test_example'
  });
  const [isEditingGeenius, setIsEditingGeenius] = useState(false);

  useEffect(() => {
    loadFunnelMode();
  }, []);

  const loadFunnelMode = async () => {
    try {
      const [modeSettings, linkSettings, timerSettings, geeniusSettings] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'funnel_mode' }),
        base44.entities.AppSettings.filter({ setting_key: 'affiliate_link' }),
        base44.entities.AppSettings.filter({ setting_key: 'bridge_timer' }),
        base44.entities.AppSettings.filter({ setting_key: 'geenius_pathways' })
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
      if (geeniusSettings.length > 0) {
        setGeeniusPathways(geeniusSettings[0].setting_value);
      }
    } catch (error) {
      console.error('Error loading funnel mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = async (mode) => {
    if (!['v2', 'v3', 'geenius'].includes(mode)) {
      alert('Invalid funnel mode');
      return;
    }
    
    setIsSwitching(true);
    try {
      const existing = await base44.entities.AppSettings.filter({ setting_key: 'funnel_mode' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { mode, updated_at: new Date().toISOString(), updated_by: 'admin' }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'funnel_mode',
          setting_value: { mode, updated_at: new Date().toISOString(), updated_by: 'admin' },
          category: 'general',
          description: 'Active funnel mode: v2 (Stripe), v3 (Affiliate), or geenius (3-Pathway)'
        });
      }
      
      setCurrentMode(mode);
      
      // Track mode switch
      await base44.analytics.track({ 
        eventName: 'funnel_mode_switched', 
        properties: { mode, previous_mode: currentMode, timestamp: new Date().toISOString() }
      }).catch(() => {});
      
      // Success feedback
      alert(`✓ Successfully switched to ${mode === 'v2' ? 'Quiz V2 (Stripe)' : mode === 'v3' ? 'Quiz V3 (Affiliate)' : 'QuizGeenius (3-Pathway)'}`);
      
    } catch (error) {
      console.error('Error switching mode:', error);
      alert('Failed to switch funnel mode. Please try again.');
      
      // Log error
      await base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: `Failed to switch funnel mode to ${mode}`,
        stack_trace: error.stack || error.message,
        metadata: { component: 'FunnelModeSwitcher', action: 'switchMode', target_mode: mode }
      }).catch(() => {});
      
    } finally {
      setIsSwitching(false);
    }
  };

  const updateAffiliateLink = async () => {
    // Validate URL
    if (!affiliateLink || affiliateLink.trim() === '') {
      alert('Affiliate link cannot be empty');
      return;
    }
    
    try {
      new URL(affiliateLink);
    } catch (e) {
      alert('Please enter a valid URL (must start with http:// or https://)');
      return;
    }
    
    try {
      const existing = await base44.entities.AppSettings.filter({ setting_key: 'affiliate_link' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { url: affiliateLink.trim(), updated_at: new Date().toISOString() }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'affiliate_link',
          setting_value: { url: affiliateLink.trim(), updated_at: new Date().toISOString() },
          category: 'general',
          description: 'Affiliate redirect URL for V3 funnel'
        });
      }
      
      setIsEditingLink(false);
      await base44.analytics.track({ eventName: 'affiliate_link_updated', properties: { url: affiliateLink.trim() } }).catch(() => {});
      alert('✓ Affiliate link updated successfully');
      
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      alert('Failed to update affiliate link. Please try again.');
      
      await base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to update affiliate link',
        stack_trace: error.stack || error.message,
        metadata: { component: 'FunnelModeSwitcher', action: 'updateAffiliateLink' }
      }).catch(() => {});
    }
  };

  const updateBridgeTimer = async () => {
    const seconds = parseInt(bridgeTimer);
    
    // Validate input
    if (isNaN(seconds)) {
      alert('Please enter a valid number');
      return;
    }
    
    if (seconds < 1 || seconds > 10) {
      alert('Timer must be between 1-10 seconds');
      return;
    }

    try {
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
      await base44.analytics.track({ eventName: 'bridge_timer_updated', properties: { seconds } }).catch(() => {});
      alert(`✓ Bridge timer set to ${seconds} second${seconds !== 1 ? 's' : ''}`);
      
    } catch (error) {
      console.error('Error updating timer:', error);
      alert('Failed to update bridge timer. Please try again.');
      
      await base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to update bridge timer',
        stack_trace: error.stack || error.message,
        metadata: { component: 'FunnelModeSwitcher', action: 'updateBridgeTimer', seconds }
      }).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  const updateGeeniusPathways = async () => {
    // Validate all URLs
    const urlFields = [
      { key: 'pathway1_url', label: 'Pathway #1 (Gov Tech Grant)' },
      { key: 'pathway2_url', label: 'Pathway #2 (Done For You)' },
      { key: 'pathway3_checkout_url', label: 'Pathway #3 (DIY Checkout)' }
    ];
    
    for (const field of urlFields) {
      const url = geeniusPathways[field.key];
      if (!url || url.trim() === '') {
        alert(`${field.label} URL cannot be empty`);
        return;
      }
      
      try {
        new URL(url);
      } catch (e) {
        alert(`${field.label}: Please enter a valid URL (must start with http:// or https://)`);
        return;
      }
    }
    
    try {
      const sanitizedPathways = {
        pathway1_url: geeniusPathways.pathway1_url.trim(),
        pathway2_url: geeniusPathways.pathway2_url.trim(),
        pathway3_checkout_url: geeniusPathways.pathway3_checkout_url.trim()
      };
      
      const existing = await base44.entities.AppSettings.filter({ setting_key: 'geenius_pathways' });
      
      if (existing.length > 0) {
        await base44.entities.AppSettings.update(existing[0].id, {
          setting_value: { ...sanitizedPathways, updated_at: new Date().toISOString() }
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'geenius_pathways',
          setting_value: { ...sanitizedPathways, updated_at: new Date().toISOString() },
          category: 'general',
          description: 'GeeNius pathway URLs configuration'
        });
      }
      
      setGeeniusPathways(sanitizedPathways);
      setIsEditingGeenius(false);
      await base44.analytics.track({ eventName: 'geenius_pathways_updated' }).catch(() => {});
      alert('✓ GeeNius pathways updated successfully');
      
    } catch (error) {
      console.error('Error updating geenius pathways:', error);
      alert('Failed to update GeeNius pathways. Please try again.');
      
      await base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'medium',
        message: 'Failed to update GeeNius pathways',
        stack_trace: error.stack || error.message,
        metadata: { component: 'FunnelModeSwitcher', action: 'updateGeeniusPathways' }
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('geenius')}
          disabled={isSwitching}
          className={`relative p-6 rounded-xl border-2 text-left transition-all ${
            currentMode === 'geenius'
              ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-transparent'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
          } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {currentMode === 'geenius' && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-purple-500 text-black font-bold">ACTIVE</Badge>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">QuizGeenius</h3>
            </div>
            
            <p className="text-sm text-gray-400">
              3-pathway bridge: Gov Grant, DFY, DIY
            </p>
            
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                Quiz → Results → 3 Pathways
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                Gov Tech Grant eligibility
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                DFY + DIY options
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
            : currentMode === 'v3'
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-purple-500/30 bg-purple-500/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentMode === 'v2' ? 'bg-[#c8ff00]' : 
              currentMode === 'v3' ? 'bg-green-500' : 
              'bg-purple-500'
            } animate-pulse`} />
            <div>
              <p className="text-white font-semibold text-sm">
                Currently Running: {
                  currentMode === 'v2' ? 'Quiz V2 (Stripe)' : 
                  currentMode === 'v3' ? 'Quiz V3 (Affiliate)' :
                  'QuizGeenius (3-Pathway)'
                }
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentMode === 'v2' 
                  ? 'Users see pricing & checkout after quiz'
                  : currentMode === 'v3'
                  ? 'Users see results with affiliate CTA'
                  : 'Users choose from 3 exclusive pathways'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">V2 Entry Point</p>
                <code className="text-sm text-[#c8ff00] font-mono">/Quiz</code>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">V3 Entry Point</p>
                <code className="text-sm text-green-400 font-mono">/QuizV3</code>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">GeeNius Entry Point</p>
                <code className="text-sm text-purple-400 font-mono">/QuizGeenius</code>
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

                {/* GeeNius Pathways Configuration */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-semibold text-white">GeeNius Pathway URLs</h4>
                    </div>
                    <Button
                      onClick={() => setIsEditingGeenius(!isEditingGeenius)}
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {isEditingGeenius ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditingGeenius ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #1: Gov Tech Grant</label>
                        <Input
                          value={geeniusPathways.pathway1_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway1_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #2: Done For You</label>
                        <Input
                          value={geeniusPathways.pathway2_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway2_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #3: DIY Checkout</label>
                        <Input
                          value={geeniusPathways.pathway3_checkout_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway3_checkout_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://buy.stripe.com/..."
                        />
                      </div>
                      <Button
                        onClick={updateGeeniusPathways}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Pathways
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #1</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway1_url}</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #2</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway2_url}</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #3</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway3_checkout_url}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* GeeNius Specific Controls */}
            {currentMode === 'geenius' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* GeeNius Pathways Configuration */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-semibold text-white">GeeNius Pathway URLs</h4>
                    </div>
                    <Button
                      onClick={() => setIsEditingGeenius(!isEditingGeenius)}
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {isEditingGeenius ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditingGeenius ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #1: Gov Tech Grant</label>
                        <Input
                          value={geeniusPathways.pathway1_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway1_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #2: Done For You</label>
                        <Input
                          value={geeniusPathways.pathway2_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway2_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Pathway #3: DIY Checkout</label>
                        <Input
                          value={geeniusPathways.pathway3_checkout_url}
                          onChange={(e) => setGeeniusPathways({...geeniusPathways, pathway3_checkout_url: e.target.value})}
                          className="bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
                          placeholder="https://buy.stripe.com/..."
                        />
                      </div>
                      <Button
                        onClick={updateGeeniusPathways}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Pathways
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #1</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway1_url}</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #2</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway2_url}</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded">
                        <div className="text-xs text-gray-400 mb-1">Pathway #3</div>
                        <div className="font-mono text-xs text-purple-400 break-all">{geeniusPathways.pathway3_checkout_url}</div>
                      </div>
                    </div>
                  )}
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
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setError(null);
      
      // Check for admin key in URL
      const urlParams = new URLSearchParams(window.location.search);
      const providedKey = urlParams.get('key');
      
      if (providedKey) {
        try {
          const response = await base44.functions.invoke('admin/validateAdminKey', { key: providedKey });
          if (response.data?.valid) {
            setUser({ email: 'admin@key-access', role: 'admin', full_name: 'Admin (Key Access)' });
            setLoading(false);
            return;
          }
        } catch (keyError) {
          console.error('Admin key validation failed:', keyError);
          setError('Invalid admin access key');
        }
      }
      
      // Fallback to normal user auth
      const currentUser = await base44.auth.me();
      
      if (!currentUser) {
        setError('Authentication required');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      
      if (currentUser.role !== 'admin') {
        setError('Admin access required');
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }
      
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Failed to verify admin access');
      
      // Log error to ErrorLog entity
      try {
        await base44.entities.ErrorLog.create({
          error_type: 'system_error',
          severity: 'medium',
          message: 'Admin auth check failed',
          stack_trace: error.stack || error.message,
          metadata: { component: 'AdminControlCenter', action: 'checkAuth' }
        });
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
      
      setTimeout(() => window.location.href = '/', 2000);
    }
  };

  const handleRefresh = () => {
    // Just reload - no error handling needed
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin mx-auto" />
          <p className="text-gray-400">
            {error || 'Loading Admin Control Center...'}
          </p>
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Redirecting...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabConfig = [
    { value: 'overview', icon: BarChart3, label: 'Overview', color: 'blue' },
    { value: 'realtime', icon: Activity, label: 'Live Feed', color: 'red' },
    { value: 'journey', icon: Users, label: 'Journey', color: 'blue' },
    { value: 'dropoff', icon: TrendingDown, label: 'Drop-offs', color: 'orange' },
    { value: 'campaigns', icon: Target, label: 'Campaigns', color: 'purple' },
    { value: 'leads', icon: Users, label: 'Leads', color: 'indigo' },
    { value: 'orders', icon: DollarSign, label: 'Orders', color: 'green' },
    { value: 'analytics', icon: TrendingUp, label: 'Analytics', color: 'purple' },
    { value: 'cohorts', icon: Users, label: 'Cohorts', color: 'indigo' },
    { value: 'attribution', icon: BarChart3, label: 'Revenue', color: 'amber' },
    { value: 'predictive', icon: Brain, label: 'AI Insights', color: 'pink' },
    { value: 'forecast', icon: TrendingUp, label: 'Forecast', color: 'green' },
    { value: 'email-heat', icon: Mail, label: 'Email Heat', color: 'red' },
    { value: 'scoring-v2', icon: Target, label: 'Scoring V2', color: 'purple' },
    { value: 'behavior', icon: Activity, label: 'Behavior', color: 'cyan' },
    { value: 'segments', icon: Target, label: 'Segments', color: 'yellow' },
    { value: 'abtests', icon: Eye, label: 'A/B Tests', color: 'cyan' },
    { value: 'automations', icon: Repeat, label: 'Automations', color: 'orange' },
    { value: 'emails', icon: Mail, label: 'Emails', color: 'red' },
    { value: 'security', icon: Shield, label: 'Security', color: 'red' },
    { value: 'nurture', icon: Activity, label: 'Nurture', color: 'teal' },
    { value: 'scoring', icon: Target, label: 'Scoring', color: 'lime' },
    { value: 'health', icon: Activity, label: 'Health', color: 'emerald' },
    { value: 'system-status', icon: CheckCircle2, label: 'Status', color: 'green' },
    { value: 'errors', icon: Bug, label: 'Errors', color: 'rose' },
    { value: 'error-analytics', icon: AlertCircle, label: 'Error Analytics', color: 'orange' },
    { value: 'performance', icon: Zap, label: 'Performance', color: 'cyan' },
    { value: 'reports', icon: FileText, label: 'Reports', color: 'blue' },
    { value: 'users', icon: Lock, label: 'Users', color: 'violet' },
    { value: 'settings', icon: Settings, label: 'Settings', color: 'slate' },
    { value: 'testing', icon: CheckCircle2, label: 'Testing & QA', color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Keyboard Shortcuts */}
      <Suspense fallback={null}>
        <KeyboardShortcuts onNavigate={setActiveTab} />
      </Suspense>

      {/* Mobile Optimized Header */}
      <Suspense fallback={null}>
        <MobileOptimizedHeader 
          lastRefresh={lastRefresh}
          onRefresh={handleRefresh}
        />
      </Suspense>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Test Mode Indicator & Error Display */}
        <Suspense fallback={null}>
          <TestModeIndicator isTestMode={true} />
        </Suspense>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
        
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList className="inline-flex h-auto p-1 bg-gray-800/50 border border-gray-700 rounded-xl gap-1 flex-nowrap">
              {tabConfig.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all whitespace-nowrap"
                >
                  <tab.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span className="text-xs lg:text-sm font-medium">{tab.label}</span>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <QuickActionsPanel />
                    <DataBackupTools />
                  </div>
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <IntegrationHealthMonitor />
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <AdminLeadsSection />
                    <AdminOrdersSection />
                    <AdminSecurityAudit />
                  </div>
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <AdminActivityLog />
                </Suspense>
              </TabsContent>

              <TabsContent value="predictive" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AIRecommendationEngine />
                </Suspense>
              </TabsContent>

              <TabsContent value="forecast" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <RevenueForecastModel />
                </Suspense>
              </TabsContent>

              <TabsContent value="email-heat" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <EmailHeatmapAnalytics />
                </Suspense>
              </TabsContent>

              <TabsContent value="scoring-v2" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <PredictiveLeadScoringV2 />
                </Suspense>
              </TabsContent>

              <TabsContent value="segments" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdvancedSegmentation />
                </Suspense>
              </TabsContent>

              <TabsContent value="cohorts" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <CohortAnalysis />
                </Suspense>
              </TabsContent>

              <TabsContent value="realtime" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <RealTimeActivityFeed />
                </Suspense>
              </TabsContent>

              <TabsContent value="journey" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <CustomerJourneyMap />
                </Suspense>
              </TabsContent>

              <TabsContent value="dropoff" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <FunnelDropoffAnalysis />
                </Suspense>
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <CampaignPerformanceDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="behavior" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <BehavioralCommandCenter />
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
                  <ABTestManager />
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

              <TabsContent value="security" className="space-y-6 mt-0">
                <Suspense fallback={<TabLoader />}>
                  <SecurityStatusCard />
                  <EmailRetryManager />
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

              <TabsContent value="system-status" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <SystemStatusDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="errors" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <ErrorTrackingDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="error-analytics" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdvancedErrorAnalytics />
                </Suspense>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <PerformanceMetricsDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AutomatedReportGenerator />
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
                  <RevenueAttributionPanel />
                </Suspense>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Suspense fallback={<TabLoader />}>
                  <AdminSettings />
                </Suspense>
              </TabsContent>

              <TabsContent value="testing" className="space-y-6 mt-0">
                <Suspense fallback={<TabLoader />}>
                  <ProductionReadinessChecklist />
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SystemTestingDashboard />
                    <PerformanceMonitor />
                  </div>
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RealTimeSystemTest />
                    <ControlActionsVerifier />
                  </div>
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <EndToEndFlowTest />
                </Suspense>
                <Suspense fallback={<TabLoader />}>
                  <SecurityComplianceTest />
                </Suspense>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Dynamic Funnel Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Suspense fallback={<TabLoader />}>
                <DynamicFunnelAnalytics />
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