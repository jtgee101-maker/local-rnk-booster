import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, DollarSign, TrendingUp, AlertCircle, Mail, Bug, Repeat,
  Settings, Eye, Shield, RefreshCw, Download, Lock
} from 'lucide-react';

// Import sub-components
import AdminMetrics from '@/components/admin/AdminMetrics';
import AdminLeadsSection from '@/components/admin/AdminLeadsSection';
import AdminOrdersSection from '@/components/admin/AdminOrdersSection';
import AdminAutomations from '@/components/admin/AdminAutomations';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminSecurityAudit from '@/components/admin/AdminSecurityAudit';
import UserManagement from '@/components/admin/UserManagement';
import EmailAnalyticsDashboard from '@/components/admin/EmailAnalyticsDashboard';
import ErrorMonitoring from '@/components/admin/ErrorMonitoring';
import LeadNurture from '@/components/admin/LeadNurture';
import AdminABTests from '@/components/admin/AdminABTests';
import TestModeIndicator from '@/components/admin/TestModeIndicator';
import V3Analytics from '@/components/admin/V3Analytics';

function FunnelModeSwitcher() {
  const [currentMode, setCurrentMode] = useState('v2'); // v2 = Stripe, v3 = Affiliate
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState('https://www.merchynt.com/paige?fpr=mr22&fp_sid=sg');
  const [bridgeTimer, setBridgeTimer] = useState(3);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);

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
    return <div className="text-gray-400">Loading funnel mode...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* V2 - Stripe Funnel */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('v2')}
          disabled={isSwitching}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            currentMode === 'v2'
              ? 'border-[#c8ff00] bg-[#c8ff00]/10'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
          } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-2xl font-bold text-white">Quiz V2</div>
            {currentMode === 'v2' && (
              <div className="px-3 py-1 bg-[#c8ff00] text-black text-xs font-bold rounded-full">
                ACTIVE
              </div>
            )}
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Direct sale funnel with Stripe checkout
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div>✓ Quiz → Pricing → Checkout</div>
            <div>✓ $0.11/day plans</div>
            <div>✓ Stripe payment processing</div>
            <div>✓ Direct customer billing</div>
          </div>
        </motion.button>

        {/* V3 - Affiliate Funnel */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('v3')}
          disabled={isSwitching}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            currentMode === 'v3'
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
          } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-2xl font-bold text-white">Quiz V3</div>
            {currentMode === 'v3' && (
              <div className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-full">
                ACTIVE
              </div>
            )}
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Affiliate bridge funnel to Paige AI
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div>✓ Quiz → Results → Bridge</div>
            <div>✓ Lost revenue metrics</div>
            <div>✓ Merchynt affiliate redirect</div>
            <div>✓ Passive commission revenue</div>
          </div>
        </motion.button>
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg border ${
        currentMode === 'v2' 
          ? 'border-[#c8ff00]/30 bg-[#c8ff00]/5' 
          : 'border-green-500/30 bg-green-500/5'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            currentMode === 'v2' ? 'bg-[#c8ff00]' : 'bg-green-500'
          } animate-pulse`} />
          <span className="text-white font-semibold">
            Currently Running: {currentMode === 'v2' ? 'Quiz V2 (Stripe)' : 'Quiz V3 (Affiliate)'}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {currentMode === 'v2' 
            ? 'Users will see pricing page and Stripe checkout after quiz'
            : 'Users will see results with affiliate CTA and redirect to Paige AI'
          }
        </div>
      </div>

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-gray-400 mb-1">V2 Entry Point:</div>
          <div className="text-[#c8ff00] font-mono">/Quiz</div>
        </div>
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-gray-400 mb-1">V3 Entry Point:</div>
          <div className="text-green-400 font-mono">/QuizV3</div>
        </div>
      </div>

      {/* V3 Advanced Controls */}
      {currentMode === 'v3' && (
        <div className="space-y-4">
          {/* Affiliate Link Manager */}
          <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Affiliate Redirect URL</div>
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
                  className="bg-gray-900/50 border-green-500/30 text-white font-mono text-xs"
                  placeholder="https://..."
                />
                <Button
                  onClick={updateAffiliateLink}
                  className="w-full bg-green-500 hover:bg-green-600 text-black"
                  size="sm"
                >
                  Save Link
                </Button>
              </div>
            ) : (
              <div className="font-mono text-xs text-green-400 break-all">
                {affiliateLink}
              </div>
            )}
          </div>

          {/* Bridge Timer Control */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Bridge Page Timer</div>
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
                    className="bg-gray-900/50 border-blue-500/30 text-white"
                  />
                  <span className="text-gray-400 text-sm">seconds</span>
                </div>
                <Button
                  onClick={updateBridgeTimer}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-black"
                  size="sm"
                >
                  Save Timer
                </Button>
              </div>
            ) : (
              <div className="text-blue-400 font-semibold">
                {bridgeTimer} second{bridgeTimer !== 1 ? 's' : ''} countdown
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              How long the "Syncing" screen displays before redirect (1-10s)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminControlCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // Super admin only
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
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#c8ff00]" />
                Super Admin Control Center
              </h1>
              <p className="text-sm text-gray-400 mt-1">Full system monitoring & control</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Test Mode Indicator */}
        <TestModeIndicator isTestMode={true} />
        
        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <AdminMetrics />
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10 h-auto p-1 bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs md:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs md:text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="abtests" className="text-xs md:text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">A/B Tests</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs md:text-sm">
              <Repeat className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Automations</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="text-xs md:text-sm">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="nurture" className="text-xs md:text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Nurture</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs md:text-sm">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Errors</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AdminLeadsSection />
              <AdminOrdersSection />
              <AdminSecurityAudit />
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <AdminLeadsSection expanded />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <AdminOrdersSection expanded />
          </TabsContent>

          {/* A/B Tests Tab */}
          <TabsContent value="abtests">
            <AdminABTests />
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations">
            <AdminAutomations />
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails">
            <EmailAnalyticsDashboard />
          </TabsContent>

          {/* Nurture Tab */}
          <TabsContent value="nurture">
            <LeadNurture />
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors">
            <ErrorMonitoring />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>

        {/* V3 Analytics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                QuizV3 Affiliate Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <V3Analytics />
            </CardContent>
          </Card>
        </motion.div>

        {/* Funnel Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#c8ff00]" />
                Funnel Mode Control
              </CardTitle>
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