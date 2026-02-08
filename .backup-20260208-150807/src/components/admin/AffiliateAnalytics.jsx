import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Target, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AffiliateAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: affiliateData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['affiliate-analytics', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get all leads with affiliate data
      const leads = await base44.asServiceRole.entities.Lead.filter({
        created_date: { $gte: startDate }
      }, '-created_date', 500);

      // Get conversion events with affiliate data
      const events = await base44.asServiceRole.entities.ConversionEvent.filter({
        funnel_version: 'v3',
        created_date: { $gte: startDate }
      }, '-created_date', 1000);

      // Aggregate by affiliate code
      const affiliateStats = {};
      
      leads.forEach(lead => {
        const code = lead.affiliate_code || 'organic';
        if (!affiliateStats[code]) {
          affiliateStats[code] = {
            leads: 0,
            conversions: 0,
            revenue: 0,
            sources: {},
            categories: {},
            devices: { mobile: 0, desktop: 0 }
          };
        }
        affiliateStats[code].leads++;
        if (lead.utm_source) {
          affiliateStats[code].sources[lead.utm_source] = (affiliateStats[code].sources[lead.utm_source] || 0) + 1;
        }
        if (lead.business_category) {
          affiliateStats[code].categories[lead.business_category] = (affiliateStats[code].categories[lead.business_category] || 0) + 1;
        }
        if (lead.device_type) {
          affiliateStats[code].devices[lead.device_type] = (affiliateStats[code].devices[lead.device_type] || 0) + 1;
        }
      });

      // Add event data
      const clickEvents = events.filter(e => e.event_name === 'quizv3_affiliate_cta_clicked');
      clickEvents.forEach(event => {
        const code = event.properties?.affiliate_code || 'organic';
        if (affiliateStats[code]) {
          affiliateStats[code].conversions++;
        }
      });

      // Convert to array and calculate conversion rates
      const affiliateArray = Object.entries(affiliateStats).map(([code, stats]) => ({
        code,
        ...stats,
        conversion_rate: stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0,
        top_source: Object.entries(stats.sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
        top_category: Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
        mobile_percent: stats.leads > 0 ? (stats.devices.mobile / stats.leads) * 100 : 0
      })).sort((a, b) => b.leads - a.leads);

      return {
        affiliates: affiliateArray,
        totalLeads: leads.length,
        totalConversions: clickEvents.length,
        totalAffiliates: affiliateArray.filter(a => a.code !== 'organic').length
      };
    },
    staleTime: 2 * 60 * 1000
  });

  const handleExport = () => {
    if (!affiliateData) return;

    const csvData = [
      ['Affiliate Code', 'Leads', 'Conversions', 'Conversion Rate', 'Top Source', 'Top Category', 'Mobile %'],
      ...affiliateData.affiliates.map(a => [
        a.code,
        a.leads,
        a.conversions,
        `${a.conversion_rate.toFixed(2)}%`,
        a.top_source,
        a.top_category,
        `${a.mobile_percent.toFixed(1)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Card className="border-gray-800 bg-gray-900/50">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading affiliate analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Affiliate Performance</h2>
          <p className="text-gray-400 text-sm">Track affiliate sources, conversions, and lead quality</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-gray-800 bg-gradient-to-br from-blue-900/20 to-blue-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {timeRange}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {affiliateData?.totalLeads || 0}
              </div>
              <p className="text-gray-400 text-sm">Total Leads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-gray-800 bg-gradient-to-br from-green-900/20 to-green-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-green-400" />
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Clicks
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {affiliateData?.totalConversions || 0}
              </div>
              <p className="text-gray-400 text-sm">CTA Clicks</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-gray-800 bg-gradient-to-br from-purple-900/20 to-purple-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  Rate
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {affiliateData?.totalLeads > 0 
                  ? ((affiliateData.totalConversions / affiliateData.totalLeads) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-gray-400 text-sm">Click Rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-gray-800 bg-gradient-to-br from-[#c8ff00]/20 to-yellow-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <ExternalLink className="w-8 h-8 text-[#c8ff00]" />
                <Badge variant="outline" className="text-[#c8ff00] border-[#c8ff00]">
                  Active
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {affiliateData?.totalAffiliates || 0}
              </div>
              <p className="text-gray-400 text-sm">Affiliate Sources</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Affiliate Performance Table */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Affiliate Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Affiliate Code</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Leads</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Clicks</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Rate</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Top Source</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Top Category</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-sm font-semibold">Mobile</th>
                </tr>
              </thead>
              <tbody>
                {affiliateData?.affiliates.map((affiliate, idx) => (
                  <motion.tr
                    key={affiliate.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[#c8ff00] border-[#c8ff00]/50">
                        {affiliate.code}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">{affiliate.leads}</td>
                    <td className="py-3 px-4 text-white">{affiliate.conversions}</td>
                    <td className="py-3 px-4">
                      <Badge className={`${
                        affiliate.conversion_rate > 50 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                        affiliate.conversion_rate > 30 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/50'
                      }`}>
                        {affiliate.conversion_rate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{affiliate.top_source}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm capitalize">{affiliate.top_category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{affiliate.mobile_percent.toFixed(0)}%</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}