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
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-[#c8ff00]" />
      </div>
    );
  }

  const summary = roiData?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          <p className="text-gray-400">Complete journey tracking, attribution & ROI insights</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${summary.total_revenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.total_orders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#c8ff00]">
              {summary.conversion_rate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.total_leads || 0} leads
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${summary.avg_order_value?.toFixed(2) || '0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              LTV : CAC Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {summary.ltv_cac_ratio?.toFixed(1) || '∞'}x
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Profitability index
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs defaultValue="roi" className="space-y-4">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="roi">ROI Dashboard</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="journey">Customer Journey</TabsTrigger>
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
    </div>
  );
}