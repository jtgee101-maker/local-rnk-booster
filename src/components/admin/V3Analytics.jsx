import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, MousePointer, ExternalLink, Target, Clock, 
  Award, AlertCircle, RefreshCw, Download, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function V3Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  const getDaysFromRange = (range) => {
    switch(range) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      default: return 7;
    }
  };

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['v3-analytics', timeRange],
    queryFn: async () => {
      const now = new Date();
      const daysAgo = getDaysFromRange(timeRange);
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const allEvents = await base44.entities.ConversionEvent.filter({ funnel_version: 'v3' });
      const events = allEvents.filter(e => new Date(e.created_date) >= startDate);

      const starts = events.filter(e => e.event_name === 'quizv3_started').length;
      const completions = events.filter(e => e.event_name === 'quizv3_completed').length;
      const ctaClicks = events.filter(e => e.event_name === 'quizv3_affiliate_cta_clicked').length;
      const redirects = events.filter(e => e.event_name === 'affiliate_redirect_initiated').length;

      const allLeads = await base44.entities.Lead.list('-created_date', 1000);
      const v3Leads = allLeads.filter(l => l.pain_point && new Date(l.created_date) >= startDate);

      const avgHealth = v3Leads.length > 0
        ? v3Leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / v3Leads.length
        : 0;

      const convRate = starts > 0 ? ((redirects / starts) * 100) : 0;

      const stepViews = {};
      events.filter(e => e.event_name === 'quizv3_step_viewed').forEach(e => {
        const step = e.properties?.step || 'unknown';
        stepViews[step] = (stepViews[step] || 0) + 1;
      });

      return {
        totalStarts: starts,
        totalCompletions: completions,
        totalCTAClicks: ctaClicks,
        totalRedirects: redirects,
        conversionRate: convRate,
        avgHealthScore: Math.round(avgHealth),
        dropoffPoints: stepViews
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  const handleExport = () => {
    if (!stats) return;
    
    const csv = [
      ['V3 Funnel Analytics Report'],
      ['Time Range', timeRange],
      ['Generated', new Date().toISOString()],
      '',
      ['Metric', 'Value'],
      ['Quiz Starts', stats.totalStarts],
      ['Completed Audits', stats.totalCompletions],
      ['CTA Clicks', stats.totalCTAClicks],
      ['Affiliate Redirects', stats.totalRedirects],
      ['Overall Conversion Rate', stats.conversionRate.toFixed(2) + '%'],
      ['Avg Health Score', stats.avgHealthScore],
      '',
      ['Step Drop-off Analysis'],
      ['Step', 'Views'],
      ...Object.entries(stats.dropoffPoints).map(([step, count]) => [step, count])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v3-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00] mx-auto" />
          <div className="text-gray-400">Loading V3 analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {['24h', '7d', '30d'].map(range => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              className={timeRange === range ? 'bg-[#c8ff00] text-black hover:bg-[#d4ff33]' : 'border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]'}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            disabled={isRefetching}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Quiz Starts</p>
                  <p className="text-3xl font-bold text-white">{stats.totalStarts}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Completed Audits</p>
                  <p className="text-3xl font-bold text-white">{stats.totalCompletions}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">CTA Clicks</p>
                  <p className="text-3xl font-bold text-white">{stats.totalCTAClicks}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <MousePointer className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#c8ff00]/10 to-[#c8ff00]/5 border-[#c8ff00]/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Affiliate Redirects</p>
                  <p className="text-3xl font-bold text-white">{stats.totalRedirects}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#c8ff00]/20">
                  <ExternalLink className="w-6 h-6 text-[#c8ff00]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Start -> Complete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Quiz Start → Completion</span>
                <span className="text-sm font-semibold text-white">
                  {stats.totalStarts > 0 
                    ? ((stats.totalCompletions / stats.totalStarts) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalStarts > 0 
                      ? (stats.totalCompletions / stats.totalStarts) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Complete -> CTA Click */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Completion → CTA Click</span>
                <span className="text-sm font-semibold text-white">
                  {stats.totalCompletions > 0 
                    ? ((stats.totalCTAClicks / stats.totalCompletions) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalCompletions > 0 
                      ? (stats.totalCTAClicks / stats.totalCompletions) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* CTA -> Redirect */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">CTA Click → Affiliate Redirect</span>
                <span className="text-sm font-semibold text-white">
                  {stats.totalCTAClicks > 0 
                    ? ((stats.totalRedirects / stats.totalCTAClicks) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-[#c8ff00] h-2 rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalCTAClicks > 0 
                      ? (stats.totalRedirects / stats.totalCTAClicks) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Overall Conversion */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Overall Conversion Rate</span>
                <span className="text-2xl font-bold text-[#c8ff00]">
                  {stats.conversionRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quiz starts → Affiliate redirects
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              Average Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {stats.avgHealthScore}/100
            </div>
            <p className="text-xs text-gray-400">
              Lower scores = more compelling audit results
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              Top Drop-off Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.dropoffPoints)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([step, count]) => (
                  <div key={step} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{step.replace('_', ' ')}</span>
                    <span className="text-white font-semibold">{count} views</span>
                  </div>
                ))}
              {Object.keys(stats.dropoffPoints).length === 0 && (
                <p className="text-xs text-gray-500">No step data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}