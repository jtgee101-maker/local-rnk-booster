import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, Target, BarChart3, RefreshCw, Loader2, 
  ArrowUpRight, ArrowDownRight, Calendar, Download, Mail, UserPlus, Send 
} from 'lucide-react';
import CustomerJourneyView from '@/components/admin/CustomerJourneyView';
import RevenueAttributionChart from '@/components/admin/RevenueAttributionChart';
import CohortTable from '@/components/admin/CohortTable';
import FunnelVisualization from '@/components/admin/FunnelVisualization';
import ROIDashboard from '@/components/admin/ROIDashboard';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function AdvancedAnalytics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roi');
  const [dateRangeDays, setDateRangeDays] = useState('30');
  
  const dateRange = {
    start: new Date(Date.now() - parseInt(dateRangeDays) * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  };

  // Fetch ROI metrics for overview
  const { data: roiData = { summary: {} }, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['roi-metrics', dateRange],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('analytics/roiMetrics', { date_range: dateRange });
        return response.data || { summary: {} };
      } catch (err) {
        console.warn('ROI metrics unavailable:', err);
        return { summary: {} };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 0
  });

  // Export all analytics
  const handleExportAll = async () => {
    if (!roiData) return;
    
    const csv = [
      ['Advanced Analytics Report'],
      ['Date Range', `${dateRangeDays} days`],
      ['Generated', new Date().toISOString()],
      '',
      ['Summary Metrics'],
      ['Total Revenue', roiData.summary?.total_revenue || 0],
      ['Total Orders', roiData.summary?.total_orders || 0],
      ['Total Leads', roiData.summary?.total_leads || 0],
      ['Conversion Rate', (roiData.summary?.conversion_rate || 0) + '%'],
      ['Avg Order Value', roiData.summary?.avg_order_value || 0],
      ['LTV:CAC Ratio', roiData.summary?.ltv_cac_ratio || 0],
      '',
      ['Channel Performance'],
      ['Channel', 'Revenue', 'Orders', 'Leads', 'Conv Rate', 'ROI'].join(','),
      ...(roiData.by_channel || []).map(ch => [
        ch.channel,
        ch.revenue,
        ch.orders,
        ch.leads,
        (ch.conversion_rate * 100).toFixed(2) + '%',
        ch.roi
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRangeDays}d-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
        <p className="text-sm text-gray-400">Loading analytics data...</p>
      </div>
    );
  }



  const summary = roiData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            Advanced Analytics
          </h2>
          <p className="text-gray-400 mt-1">Complete journey tracking, attribution & ROI insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRangeDays} onValueChange={setDateRangeDays}>
            <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            size="sm"
            disabled={isRefetching}
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportAll} 
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate(createPageUrl('Admin'))}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-blue-500 hover:text-blue-400"
              >
                <Users className="w-4 h-4" />
                View All Leads
              </Button>
              <Button
                onClick={() => {
                  // Navigate to Admin page and scroll to segments
                  navigate(createPageUrl('Admin'));
                  setTimeout(() => {
                    document.getElementById('segments-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-purple-500 hover:text-purple-400"
              >
                <UserPlus className="w-4 h-4" />
                Create Segment
              </Button>
              <Button
                onClick={() => {
                  navigate(createPageUrl('Admin'));
                  setTimeout(() => {
                    document.getElementById('email-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-green-500 hover:text-green-400"
              >
                <Mail className="w-4 h-4" />
                Email Analytics
              </Button>
              <Button
                onClick={() => {
                  navigate(createPageUrl('Admin'));
                  setTimeout(() => {
                    document.getElementById('broadcast-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
              >
                <Send className="w-4 h-4" />
                Send Broadcast
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm hover:border-green-500/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/10 rounded">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  Total Revenue
                </CardTitle>
                {summary.revenue_change && (
                  <Badge className={`text-xs gap-1 ${summary.revenue_change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {summary.revenue_change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(summary.revenue_change)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${summary.total_revenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total_orders || 0} orders completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm hover:border-[#c8ff00]/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 bg-[#c8ff00]/10 rounded">
                    <Users className="w-4 h-4 text-[#c8ff00]" />
                  </div>
                  Conversion Rate
                </CardTitle>
                {summary.conversion_change && (
                  <Badge className={`text-xs gap-1 ${summary.conversion_change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {summary.conversion_change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(summary.conversion_change)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#c8ff00]">
                {summary.conversion_rate?.toFixed(1) || '0'}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total_leads || 0} total leads
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm hover:border-blue-500/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded">
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  Avg Order Value
                </CardTitle>
                {summary.aov_change && (
                  <Badge className={`text-xs gap-1 ${summary.aov_change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {summary.aov_change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(summary.aov_change)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${summary.avg_order_value?.toFixed(2) || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Per transaction
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  LTV : CAC Ratio
                </CardTitle>
                <Badge className={`text-xs ${(summary.ltv_cac_ratio || 0) >= 3 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {(summary.ltv_cac_ratio || 0) >= 3 ? 'Healthy' : 'Monitor'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {summary.ltv_cac_ratio?.toFixed(1) || '∞'}x
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Profitability index
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Tabbed Analytics Views */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="inline-flex h-auto p-1 bg-gray-800/50 border border-gray-700 rounded-xl gap-1 flex-wrap">
            <TabsTrigger 
              value="roi"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">ROI Dashboard</span>
              <span className="sm:hidden">ROI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="funnel"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Funnel Analysis</span>
              <span className="sm:hidden">Funnel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attribution"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Attribution</span>
              <span className="sm:hidden">Attr</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cohorts"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <Users className="w-4 h-4" />
              Cohorts
            </TabsTrigger>
            <TabsTrigger 
              value="journey"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Journey
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="roi" className="mt-0">
                <ROIDashboard dateRange={dateRange} data={roiData} />
              </TabsContent>

              <TabsContent value="funnel" className="mt-0">
                <FunnelVisualization dateRange={dateRange} />
              </TabsContent>

              <TabsContent value="attribution" className="mt-0">
                <RevenueAttributionChart dateRange={dateRange} />
              </TabsContent>

              <TabsContent value="cohorts" className="mt-0">
                <CohortTable />
              </TabsContent>

              <TabsContent value="journey" className="mt-0">
                <CustomerJourneyView />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}