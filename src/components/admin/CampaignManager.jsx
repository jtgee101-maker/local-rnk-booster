import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, Mail, Link as LinkIcon, BarChart3, Plus, Download,
  ExternalLink, Copy, Check, TrendingUp, Users, MousePointer,
  Calendar, DollarSign, Target, Eye, Zap, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import CampaignBuilder from './CampaignBuilder';
import CampaignAnalytics from './CampaignAnalytics';
import PURLGenerator from './PURLGenerator';

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBuilder, setShowBuilder] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const data = await base44.asServiceRole.entities.Campaign.list('-created_date', 50);
      return data;
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400',
      active: 'bg-green-500/20 text-green-400',
      paused: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-blue-500/20 text-blue-400'
    };
    return colors[status] || colors.draft;
  };

  const getTypeIcon = (type) => {
    const icons = {
      qr_code: QrCode,
      direct_mail: Mail,
      print: LinkIcon,
      email: Mail,
      social: ExternalLink,
      other: Target
    };
    return icons[type] || Target;
  };

  const calculateStats = () => {
    if (!campaigns || campaigns.length === 0) {
      return { total: 0, active: 0, totalClicks: 0, totalConversions: 0, avgCPL: 0 };
    }

    const active = campaigns.filter(c => c.status === 'active').length;
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.total_conversions || 0), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const avgCPL = totalConversions > 0 ? totalBudget / totalConversions : 0;

    return {
      total: campaigns.length,
      active,
      totalClicks,
      totalConversions,
      avgCPL: Math.round(avgCPL * 100) / 100
    };
  };

  const stats = calculateStats();

  if (showBuilder) {
    return (
      <CampaignBuilder
        onClose={() => setShowBuilder(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['campaigns']);
          setShowBuilder(false);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-[#c8ff00]" />
                Campaign Tracking Command Center
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                QR Codes, PURLs, Direct Mail & Multi-Channel Campaign Attribution
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowBuilder(true)}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Campaigns</div>
                  <div className="text-3xl font-bold text-white">{stats.total}</div>
                </div>
                <BarChart3 className="w-8 h-8 text-[#c8ff00]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Active</div>
                  <div className="text-3xl font-bold text-green-400">{stats.active}</div>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Clicks</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.totalClicks}</div>
                </div>
                <MousePointer className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Conversions</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.totalConversions}</div>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Avg CPL</div>
                  <div className="text-3xl font-bold text-yellow-400">${stats.avgCPL}</div>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Campaigns List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#c8ff00]" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns && campaigns.map((campaign, index) => {
              const Icon = getTypeIcon(campaign.type);
              const conversionRate = campaign.total_clicks > 0 
                ? Math.round((campaign.total_conversions / campaign.total_clicks) * 100)
                : 0;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-[#c8ff00]/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-indigo-500/10 rounded-lg">
                        <Icon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold">{campaign.name}</h4>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {campaign.total_links || 0} links
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {campaign.total_clicks || 0} clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {campaign.total_conversions || 0} conversions
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {conversionRate}% CVR
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab('analytics');
                          // Store selected campaign for analytics view
                        }}
                        className="border-gray-600"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {(!campaigns || campaigns.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet.</p>
                <p className="text-sm mt-2">Create your first campaign to start tracking.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="purls">PURL Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <CampaignAnalytics campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="purls">
          <PURLGenerator campaigns={campaigns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}