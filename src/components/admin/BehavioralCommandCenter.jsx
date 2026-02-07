import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, TrendingUp, Eye, Clock, 
  Users, Target, Activity, Settings, RefreshCw, ExternalLink, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BehavioralCommandCenter() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch behavioral data
  const { data: behaviorData, isLoading } = useQuery({
    queryKey: ['user-behavior'],
    queryFn: async () => {
      const data = await base44.asServiceRole.entities.UserBehavior.list('-updated_date', 100);
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch tracking settings
  const { data: trackingSettings } = useQuery({
    queryKey: ['tracking-settings'],
    queryFn: async () => {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({
        setting_key: 'behavioral_tracking_enabled'
      });
      return settings[0] || { setting_value: { enabled: true } };
    }
  });

  // Toggle tracking mutation
  const toggleTrackingMutation = useMutation({
    mutationFn: async (enabled) => {
      if (trackingSettings?.id) {
        await base44.asServiceRole.entities.AppSettings.update(trackingSettings.id, {
          setting_value: { enabled }
        });
      } else {
        await base44.asServiceRole.entities.AppSettings.create({
          setting_key: 'behavioral_tracking_enabled',
          setting_value: { enabled },
          category: 'general',
          description: 'Global behavioral tracking toggle'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tracking-settings']);
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries(['user-behavior']);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const calculateAverages = () => {
    if (!behaviorData || behaviorData.length === 0) {
      return { 
        avgEngagement: 0, 
        avgScrollDepth: 0, 
        avgTimeOnPage: 0, 
        totalUsers: 0,
        affiliateTraffic: 0,
        paidTraffic: 0,
        organicTraffic: 0
      };
    }

    const total = behaviorData.reduce((acc, record) => ({
      engagement: acc.engagement + (record.engagement_score || 0),
      scroll: acc.scroll + (record.scroll_depth || 0),
      time: acc.time + (record.time_on_page || 0)
    }), { engagement: 0, scroll: 0, time: 0 });

    // Calculate traffic source breakdown
    const affiliateTraffic = behaviorData.filter(r => 
      r.traffic_source?.first_touch?.affiliate_id
    ).length;
    
    const paidTraffic = behaviorData.filter(r => 
      r.traffic_source?.first_touch?.fbclid || 
      r.traffic_source?.first_touch?.gclid ||
      (r.traffic_source?.first_touch?.utm_medium && 
       ['cpc', 'ppc', 'paid'].includes(r.traffic_source.first_touch.utm_medium))
    ).length;

    const organicTraffic = behaviorData.filter(r => 
      r.traffic_source?.first_touch?.utm_source === 'organic' ||
      !r.traffic_source?.first_touch?.utm_source
    ).length;

    return {
      avgEngagement: Math.round(total.engagement / behaviorData.length),
      avgScrollDepth: Math.round(total.scroll / behaviorData.length),
      avgTimeOnPage: Math.round(total.time / behaviorData.length),
      totalUsers: behaviorData.length,
      affiliateTraffic,
      paidTraffic,
      organicTraffic
    };
  };

  const getEngagementColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEngagementLabel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const stats = calculateAverages();
  const isTrackingEnabled = trackingSettings?.setting_value?.enabled !== false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-2xl">
                <Brain className="w-6 h-6 text-[#c8ff00]" />
                Behavioral Command Center
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Real-time user intelligence and engagement analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Tracking</span>
                <Switch
                  checked={isTrackingEnabled}
                  onCheckedChange={(checked) => toggleTrackingMutation.mutate(checked)}
                />
                <Badge className={isTrackingEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {isTrackingEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Attribution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-600/20 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-300 mb-1">Affiliate Traffic</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.affiliateTraffic}</div>
                  <div className="text-xs text-purple-300/70 mt-1">
                    {stats.totalUsers > 0 ? Math.round((stats.affiliateTraffic / stats.totalUsers) * 100) : 0}% of total
                  </div>
                </div>
                <ExternalLink className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-600/20 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-300 mb-1">Paid Traffic</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.paidTraffic}</div>
                  <div className="text-xs text-blue-300/70 mt-1">
                    {stats.totalUsers > 0 ? Math.round((stats.paidTraffic / stats.totalUsers) * 100) : 0}% of total
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-900/20 to-green-600/20 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-300 mb-1">Organic Traffic</div>
                  <div className="text-3xl font-bold text-green-400">{stats.organicTraffic}</div>
                  <div className="text-xs text-green-300/70 mt-1">
                    {stats.totalUsers > 0 ? Math.round((stats.organicTraffic / stats.totalUsers) * 100) : 0}% of total
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                </div>
                <Users className="w-8 h-8 text-[#c8ff00]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Avg Engagement</div>
                  <div className="text-3xl font-bold text-[#c8ff00]">{stats.avgEngagement}</div>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Avg Scroll Depth</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.avgScrollDepth}%</div>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Avg Time</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.avgTimeOnPage}s</div>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Behavior Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#c8ff00]" />
            User Intelligence Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Session ID</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Attribution</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Engagement</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Scroll</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Clicks</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Time</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Quiz</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {behaviorData && behaviorData.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="py-3 text-sm text-gray-300 font-mono">
                      {record.session_id?.substring(0, 8)}...
                    </td>
                    <td className="py-3">
                      <div className="space-y-1">
                        {record.traffic_source?.first_touch?.affiliate_id && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            🎯 {record.traffic_source.first_touch.affiliate_id}
                          </Badge>
                        )}
                        {record.traffic_source?.first_touch?.utm_campaign && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            📢 {record.traffic_source.first_touch.utm_campaign}
                          </Badge>
                        )}
                        {record.traffic_source?.first_touch?.fbclid && (
                          <Badge className="bg-indigo-500/20 text-indigo-400 text-xs">
                            Meta
                          </Badge>
                        )}
                        {record.traffic_source?.first_touch?.utm_source === 'organic' && !record.traffic_source?.first_touch?.affiliate_id && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Organic
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${getEngagementColor(record.engagement_score)}`}>
                          {record.engagement_score || 0}
                        </div>
                        <Badge className={`${record.engagement_score >= 70 ? 'bg-green-500/20 text-green-400' : record.engagement_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {getEngagementLabel(record.engagement_score)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-300">
                      {record.scroll_depth || 0}%
                    </td>
                    <td className="py-3 text-sm text-gray-300">
                      {record.click_count || 0}
                    </td>
                    <td className="py-3 text-sm text-gray-300">
                      {record.time_on_page || 0}s
                    </td>
                    <td className="py-3 text-sm text-gray-300">
                      {Math.round(record.quiz_completion || 0)}%
                    </td>
                    <td className="py-3">
                      <Badge className={record.is_returning ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}>
                        {record.is_returning ? 'Returning' : 'New'}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!behaviorData || behaviorData.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No behavioral data collected yet.</p>
              <p className="text-sm mt-2">Data will appear once users accept cookie consent.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}