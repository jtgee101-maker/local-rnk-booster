import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import EmailTracking from '@/components/admin/EmailTracking';
import ErrorMonitoring from '@/components/admin/ErrorMonitoring';
import LeadNurture from '@/components/admin/LeadNurture';
import AdminABTests from '@/components/admin/AdminABTests';

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
            <EmailTracking />
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
      </div>
    </div>
  );
}