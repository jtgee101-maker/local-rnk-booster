import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, MousePointer, ExternalLink, 
  Target, Clock, Award, AlertCircle 
} from 'lucide-react';

export default function V3Analytics() {
  const [stats, setStats] = useState({
    totalStarts: 0,
    totalCompletions: 0,
    totalCTAClicks: 0,
    totalRedirects: 0,
    conversionRate: 0,
    avgHealthScore: 0,
    avgTimeToComplete: 0,
    dropoffPoints: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get date filter
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Fetch all V3 events
      const allEvents = await base44.entities.ConversionEvent.filter({ 
        funnel_version: 'v3'
      });

      // Filter by date
      const events = allEvents.filter(e => new Date(e.created_date) >= startDate);

      // Calculate metrics
      const starts = events.filter(e => e.event_name === 'quizv3_started').length;
      const completions = events.filter(e => e.event_name === 'quizv3_completed').length;
      const ctaClicks = events.filter(e => e.event_name === 'quizv3_affiliate_cta_clicked').length;
      const redirects = events.filter(e => e.event_name === 'affiliate_redirect_initiated').length;

      // Get all V3 leads in time range
      const allLeads = await base44.entities.Lead.list('-created_date', 1000);
      const v3Leads = allLeads.filter(l => 
        l.pain_point && 
        new Date(l.created_date) >= startDate
      );

      // Calculate average health score
      const avgHealth = v3Leads.length > 0
        ? v3Leads.reduce((sum, l) => sum + (l.health_score || 0), 0) / v3Leads.length
        : 0;

      // Calculate conversion rate (starts -> redirects)
      const convRate = starts > 0 ? ((redirects / starts) * 100).toFixed(1) : 0;

      // Analyze drop-off points
      const stepViews = {};
      events.filter(e => e.event_name === 'quizv3_step_viewed').forEach(e => {
        const step = e.properties?.step || 'unknown';
        stepViews[step] = (stepViews[step] || 0) + 1;
      });

      setStats({
        totalStarts: starts,
        totalCompletions: completions,
        totalCTAClicks: ctaClicks,
        totalRedirects: redirects,
        conversionRate: parseFloat(convRate),
        avgHealthScore: Math.round(avgHealth),
        avgTimeToComplete: 0, // Could calculate from session data
        dropoffPoints: stepViews
      });
    } catch (error) {
      console.error('Error loading V3 analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400">Loading V3 analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['24h', '7d', '30d'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === range
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </button>
        ))}
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
                  {stats.conversionRate}%
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