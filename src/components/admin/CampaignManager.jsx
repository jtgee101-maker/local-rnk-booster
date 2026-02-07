import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, Mail, Link as LinkIcon, BarChart3, Plus,
  ExternalLink, TrendingUp, MousePointer, DollarSign, Target, Eye, Zap, Pause, Play, Trash2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignBuilder from './CampaignBuilder';
import CampaignAnalytics from './CampaignAnalytics';
import PURLGenerator from './PURLGenerator';

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const data = await base44.asServiceRole.entities.Campaign.list('-created_date', 100);
      return data;
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.asServiceRole.entities.Campaign.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.asServiceRole.entities.Campaign.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
    }
  });

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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
      <Card className="bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/10 border-2 border-indigo-500/30 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-3 text-3xl font-black tracking-tight">
                <Target className="w-8 h-8 text-[#c8ff00]" />
                Campaign Tracking Command Center
              </CardTitle>
              <CardDescription className="text-white font-semibold mt-2 text-base">
                QR Codes, PURLs, Direct Mail & Multi-Channel Campaign Attribution
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="lg"
                className="border-2 border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowBuilder(true)}
                size="lg"
                className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-black text-base shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-[#c8ff00]/50 transition-all shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Total Campaigns</div>
                  <div className="text-4xl font-black text-white">{stats.total}</div>
                </div>
                <div className="p-3 bg-[#c8ff00]/10 rounded-xl">
                  <BarChart3 className="w-10 h-10 text-[#c8ff00]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-green-500/50 transition-all shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Active</div>
                  <div className="text-4xl font-black text-green-400">{stats.active}</div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Zap className="w-10 h-10 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-blue-500/50 transition-all shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Total Clicks</div>
                  <div className="text-4xl font-black text-blue-400">{stats.totalClicks}</div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <MousePointer className="w-10 h-10 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-purple-500/50 transition-all shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Conversions</div>
                  <div className="text-4xl font-black text-purple-400">{stats.totalConversions}</div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Target className="w-10 h-10 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-yellow-500/50 transition-all shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Avg CPL</div>
                  <div className="text-4xl font-black text-yellow-400">${stats.avgCPL}</div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <DollarSign className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Campaigns List */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-3 text-2xl font-black">
              <Eye className="w-6 h-6 text-[#c8ff00]" />
              Campaign Management
            </CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-900 border-2 border-gray-700 text-white font-semibold placeholder:text-gray-500 focus:border-[#c8ff00]"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border-2 border-gray-700 text-white font-semibold rounded-md px-4 py-2 focus:border-[#c8ff00] focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <div className="space-y-4">
              {filteredCampaigns && filteredCampaigns.map((campaign, index) => {
              const Icon = getTypeIcon(campaign.type);
              const conversionRate = campaign.total_clicks > 0 
                ? Math.round((campaign.total_conversions / campaign.total_clicks) * 100)
                : 0;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-gray-700 hover:border-[#c8ff00]/70 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                        <Icon className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-black text-xl">{campaign.name}</h4>
                          <Badge className={`${getStatusColor(campaign.status)} font-bold px-3 py-1`}>
                            {campaign.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300">
                          <span className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-[#c8ff00]" />
                            {campaign.total_links || 0} links
                          </span>
                          <span className="flex items-center gap-2">
                            <MousePointer className="w-4 h-4 text-blue-400" />
                            {campaign.total_clicks || 0} clicks
                          </span>
                          <span className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            {campaign.total_conversions || 0} conversions
                          </span>
                          <span className="flex items-center gap-2 text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            {conversionRate}% CVR
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {campaign.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignMutation.mutate({ id: campaign.id, data: { status: 'paused' } })}
                          className="border-2 border-yellow-600 text-yellow-400 hover:bg-yellow-600/20 font-bold"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCampaignMutation.mutate({ id: campaign.id, data: { status: 'active' } })}
                          className="border-2 border-green-600 text-green-400 hover:bg-green-600/20 font-bold"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign.id);
                          setActiveTab('analytics');
                        }}
                        className="border-2 border-indigo-600 text-indigo-400 hover:bg-indigo-600/20 font-bold"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this campaign? This cannot be undone.')) {
                            deleteCampaignMutation.mutate(campaign.id);
                          }
                        }}
                        className="border-2 border-red-600 text-red-400 hover:bg-red-600/20 font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {(!filteredCampaigns || filteredCampaigns.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-white font-bold text-xl mb-2">No campaigns found</p>
                <p className="text-gray-400 font-semibold">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create your first campaign to start tracking'}
                </p>
              </motion.div>
            )}
          </div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-gray-700 p-1.5 rounded-xl shadow-lg">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black font-bold text-white px-6 py-3 rounded-lg transition-all"
          >
            📊 Overview
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black font-bold text-white px-6 py-3 rounded-lg transition-all"
          >
            📈 Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="purls" 
            className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black font-bold text-white px-6 py-3 rounded-lg transition-all"
          >
            🔗 PURL Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <CampaignAnalytics campaigns={campaigns} selectedCampaign={selectedCampaign} />
        </TabsContent>

        <TabsContent value="purls" className="mt-6">
          <PURLGenerator campaigns={campaigns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}