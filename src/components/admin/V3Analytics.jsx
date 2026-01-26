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

      // Step analytics with completion rates
      const stepViews = {};
      const stepCompletions = {};
      events.filter(e => e.event_name === 'quizv3_step_viewed').forEach(e => {
        const step = e.properties?.step || 'unknown';
        stepViews[step] = (stepViews[step] || 0) + 1;
      });

      // Time on step analysis
      const stepTimes = events.filter(e => e.time_on_step).reduce((acc, e) => {
        const step = e.properties?.step || 'unknown';
        if (!acc[step]) acc[step] = [];
        acc[step].push(e.time_on_step);
        return acc;
      }, {});

      const avgStepTimes = Object.entries(stepTimes).reduce((acc, [step, times]) => {
        acc[step] = times.reduce((sum, t) => sum + t, 0) / times.length;
        return acc;
      }, {});

      // Session behavior metrics
      const sessionIds = [...new Set(events.map(e => e.session_id).filter(Boolean))];
      const uniqueSessions = sessionIds.length;
      
      const sessionBehavior = sessionIds.map(sessionId => {
        const sessionEvents = events.filter(e => e.session_id === sessionId).sort((a, b) => 
          new Date(a.created_date) - new Date(b.created_date)
        );
        const firstEvent = sessionEvents[0];
        const lastEvent = sessionEvents[sessionEvents.length - 1];
        const duration = lastEvent ? (new Date(lastEvent.created_date) - new Date(firstEvent.created_date)) / 1000 : 0;
        const completed = sessionEvents.some(e => e.event_name === 'quizv3_completed');
        const redirected = sessionEvents.some(e => e.event_name === 'affiliate_redirect_initiated');
        
        return { sessionId, duration, completed, redirected, eventCount: sessionEvents.length };
      });

      const avgSessionDuration = sessionBehavior.length > 0
        ? sessionBehavior.reduce((sum, s) => sum + s.duration, 0) / sessionBehavior.length
        : 0;

      const bounceRate = uniqueSessions > 0 
        ? ((sessionBehavior.filter(s => s.eventCount === 1).length / uniqueSessions) * 100)
        : 0;

      // Exit points analysis
      const exitPoints = {};
      sessionBehavior.filter(s => !s.completed).forEach(session => {
        const sessionEvents = events.filter(e => e.session_id === session.sessionId);
        const lastStep = sessionEvents[sessionEvents.length - 1]?.properties?.step || 'unknown';
        exitPoints[lastStep] = (exitPoints[lastStep] || 0) + 1;
      });

      // Pain point distribution
      const painPointDist = v3Leads.reduce((acc, lead) => {
        const pp = lead.pain_point || 'unknown';
        acc[pp] = (acc[pp] || 0) + 1;
        return acc;
      }, {});

      // Business category breakdown
      const categoryDist = v3Leads.reduce((acc, lead) => {
        const cat = lead.business_category || 'unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      return {
        totalStarts: starts,
        totalCompletions: completions,
        totalCTAClicks: ctaClicks,
        totalRedirects: redirects,
        conversionRate: convRate,
        avgHealthScore: Math.round(avgHealth),
        dropoffPoints: stepViews,
        exitPoints,
        avgStepTimes,
        uniqueSessions,
        avgSessionDuration: Math.round(avgSessionDuration),
        bounceRate: bounceRate.toFixed(1),
        painPointDistribution: painPointDist,
        categoryDistribution: categoryDist,
        totalLeads: v3Leads.length
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2 font-bold">
                <Award className="w-4 h-4 text-blue-400" />
                Avg Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white mb-2">
                {stats.avgHealthScore}/100
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Lower scores = more urgency
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-purple-400" />
                Avg Session Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white mb-2">
                {Math.floor(stats.avgSessionDuration / 60)}m {stats.avgSessionDuration % 60}s
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Time to complete quiz
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2 font-bold">
                <Users className="w-4 h-4 text-green-400" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white mb-2">
                {stats.totalLeads}
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Qualified V3 leads
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white mb-2">
                {stats.bounceRate}%
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Single interaction exits
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exit Points Analysis */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Exit Point Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.exitPoints || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([step, count], index) => {
                  const percentage = stats.uniqueSessions > 0 ? ((count / stats.uniqueSessions) * 100).toFixed(1) : 0;
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-900 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold capitalize">{step.replace(/_/g, ' ')}</span>
                        <Badge className="bg-orange-500/20 text-orange-300 font-bold">
                          {percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              {Object.keys(stats.exitPoints || {}).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">No exit data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pain Point Distribution */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
              <Target className="w-5 h-5 text-red-400" />
              Pain Point Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.painPointDistribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([painPoint, count], index) => {
                  const percentage = stats.totalLeads > 0 ? ((count / stats.totalLeads) * 100).toFixed(1) : 0;
                  const labels = {
                    not_in_map_pack: 'Not in Map Pack',
                    low_reviews: 'Low Reviews',
                    no_calls: 'No Calls',
                    not_optimized: 'Not Optimized'
                  };
                  return (
                    <motion.div
                      key={painPoint}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-900 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{labels[painPoint] || painPoint}</span>
                        <Badge className="bg-red-500/20 text-red-300 font-bold">
                          {count} leads
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              {Object.keys(stats.painPointDistribution || {}).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">No pain point data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Category Breakdown */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-lg font-black">
            <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
            Business Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.categoryDistribution || {})
              .sort((a, b) => b[1] - a[1])
              .map(([category, count], index) => {
                const labels = {
                  home_services: 'Home Services',
                  medical: 'Medical',
                  retail: 'Retail',
                  professional: 'Professional',
                  other: 'Other'
                };
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-gray-700 text-center hover:border-[#c8ff00]/50 transition-all"
                  >
                    <div className="text-3xl font-black text-white mb-2">{count}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {labels[category] || category}
                    </div>
                  </motion.div>
                );
              })}
            {Object.keys(stats.categoryDistribution || {}).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-bold">No category data yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}