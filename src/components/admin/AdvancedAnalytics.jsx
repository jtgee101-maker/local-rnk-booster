import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Target, BarChart3, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import CustomerJourneyView from '@/components/admin/CustomerJourneyView';
import RevenueAttributionChart from '@/components/admin/RevenueAttributionChart';
import CohortTable from '@/components/admin/CohortTable';
import FunnelVisualization from '@/components/admin/FunnelVisualization';
import ROIDashboard from '@/components/admin/ROIDashboard';

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  });

  // Fetch ROI metrics for overview
  const { data: roiData, isLoading, refetch } = useQuery({
    queryKey: ['roi-metrics', dateRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/roiMetrics', { date_range: dateRange });
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

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
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
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
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 text-xs">
            <Calendar className="w-3 h-3" />
            Last 30 days
          </Badge>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
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
        <Tabs defaultValue="roi" className="space-y-4">
          <TabsList className="inline-flex h-auto p-1 bg-gray-800/50 border border-gray-700 rounded-xl gap-1">
            <TabsTrigger 
              value="roi"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <DollarSign className="w-4 h-4" />
              ROI Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="funnel"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <Target className="w-4 h-4" />
              Funnel Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="attribution"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black text-gray-400 hover:text-white transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Attribution
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

        <TabsContent value="roi">
          <ROIDashboard dateRange={dateRange} data={roiData} />
        </TabsContent>

        <TabsContent value="funnel">
          <FunnelVisualization dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="attribution">
          <RevenueAttributionChart dateRange={dateRange} />
        </TabsContent>

          <TabsContent value="cohorts">
            <CohortTable />
          </TabsContent>

          <TabsContent value="journey">
            <CustomerJourneyView />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}