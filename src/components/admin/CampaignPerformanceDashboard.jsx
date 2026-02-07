import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, TrendingUp, Users, QrCode, Link as LinkIcon, Mail, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CampaignPerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign-performance', timeRange],
    queryFn: async () => {
      // Fetch campaigns and their metrics
      const campaigns = await base44.entities.Campaign.list();
      
      // Mock performance data - in production, aggregate from CampaignClick entity
      return {
        campaigns: campaigns.length > 0 ? campaigns : [
          {
            id: 1,
            name: 'Home Services QR Campaign',
            type: 'qr_code',
            status: 'active',
            total_clicks: 324,
            total_conversions: 42,
            conversion_rate: 13,
            budget: 500,
            cost_per_conversion: 11.9,
            roi: 245
          },
          {
            id: 2,
            name: 'Email Nurture Series',
            type: 'email',
            status: 'active',
            total_clicks: 189,
            total_conversions: 28,
            conversion_rate: 14.8,
            budget: 0,
            cost_per_conversion: 0,
            roi: 999
          },
          {
            id: 3,
            name: 'Direct Mail PURL',
            type: 'direct_mail',
            status: 'completed',
            total_clicks: 156,
            total_conversions: 19,
            conversion_rate: 12.2,
            budget: 800,
            cost_per_conversion: 42.1,
            roi: 89
          }
        ],
        timeline: [
          { date: 'Week 1', clicks: 234, conversions: 18 },
          { date: 'Week 2', clicks: 298, conversions: 31 },
          { date: 'Week 3', clicks: 356, conversions: 42 },
          { date: 'Week 4', clicks: 281, conversions: 28 }
        ],
        byType: [
          { type: 'QR Code', campaigns: 3, conversions: 67, roi: 245 },
          { type: 'Email', campaigns: 5, conversions: 89, roi: 456 },
          { type: 'Direct Mail', campaigns: 2, conversions: 34, roi: 123 },
          { type: 'Social', campaigns: 4, conversions: 56, roi: 189 }
        ]
      };
    }
  });

  const getCampaignIcon = (type) => {
    switch (type) {
      case 'qr_code': return <QrCode className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'direct_mail': return <LinkIcon className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Loading campaigns...
        </CardContent>
      </Card>
    );
  }

  const totalClicks = campaignData?.campaigns.reduce((sum, c) => sum + c.total_clicks, 0);
  const totalConversions = campaignData?.campaigns.reduce((sum, c) => sum + c.total_conversions, 0);
  const avgConversionRate = totalClicks ? (totalConversions / totalClicks * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-1">Campaign Performance</h3>
        <p className="text-sm text-gray-400">Track QR codes, PURLs, and email campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-xs text-gray-400">Active Campaigns</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {campaignData?.campaigns.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Total Clicks</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalClicks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Conversions</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalConversions}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Avg Conv Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{avgConversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="breakdown">By Type</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-3">
          {campaignData?.campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      {getCampaignIcon(campaign.type)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{campaign.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {campaign.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#c8ff00]">
                      {campaign.conversion_rate}%
                    </div>
                    <div className="text-xs text-gray-400">Conv Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Clicks</div>
                    <div className="text-white font-semibold">{campaign.total_clicks}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Conversions</div>
                    <div className="text-white font-semibold">{campaign.total_conversions}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Budget</div>
                    <div className="text-white font-semibold">
                      {campaign.budget ? `$${campaign.budget}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">ROI</div>
                    <Badge className="bg-green-500/20 text-green-400">
                      {campaign.roi}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={campaignData?.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" stroke="#00bfff" strokeWidth={2} name="Clicks" />
                  <Line type="monotone" dataKey="conversions" stroke="#c8ff00" strokeWidth={2} name="Conversions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {campaignData?.byType.map((item, i) => (
                  <div key={i} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold">{item.type}</div>
                      <Badge className="bg-[#c8ff00] text-black">
                        ROI: {item.roi}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Campaigns</div>
                        <div className="text-white font-semibold">{item.campaigns}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Conversions</div>
                        <div className="text-white font-semibold">{item.conversions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}