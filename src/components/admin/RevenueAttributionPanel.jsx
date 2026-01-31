import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, Users, Target, ExternalLink } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RevenueAttributionPanel() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: attributionData, isLoading } = useQuery({
    queryKey: ['revenue-attribution', timeRange],
    queryFn: async () => {
      // In production, call backend analytics function
      return {
        totalRevenue: 45670,
        bySource: [
          { source: 'QuizGeenius', revenue: 28900, orders: 42, percentage: 63 },
          { source: 'Direct', revenue: 8950, orders: 15, percentage: 20 },
          { source: 'Referral', revenue: 5420, orders: 9, percentage: 12 },
          { source: 'Campaign', revenue: 2400, orders: 4, percentage: 5 }
        ],
        byChannel: [
          { name: 'Organic', value: 28900 },
          { name: 'Paid', value: 8950 },
          { name: 'Referral', value: 5420 },
          { name: 'Direct', value: 2400 }
        ],
        timeline: [
          { date: 'Week 1', revenue: 8500, orders: 12 },
          { date: 'Week 2', revenue: 12300, orders: 18 },
          { date: 'Week 3', revenue: 15200, orders: 21 },
          { date: 'Week 4', revenue: 9670, orders: 14 }
        ],
        topCampaigns: [
          { name: 'Home Services QR Campaign', revenue: 15600, roi: 412 },
          { name: 'Medical Professionals Email', revenue: 9200, roi: 287 },
          { name: 'Local Service Ads', revenue: 6800, roi: 198 }
        ]
      };
    }
  });

  const COLORS = ['#c8ff00', '#00bfff', '#ff6b9d', '#ffa500'];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading attribution data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-1">Revenue Attribution</h3>
        <p className="text-sm text-gray-400">Track revenue sources and campaign performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-xs text-gray-400">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${attributionData.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Top Source</span>
            </div>
            <div className="text-lg font-bold text-white">
              {attributionData.bySource[0].source}
            </div>
            <div className="text-xs text-gray-400">
              {attributionData.bySource[0].percentage}% of revenue
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Avg Order Value</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${Math.round(attributionData.totalRevenue / attributionData.bySource.reduce((a, b) => a + b.orders, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {attributionData.bySource.reduce((a, b) => a + b.orders, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="sources">By Source</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Revenue by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={attributionData.byChannel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${(value/1000).toFixed(1)}k`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attributionData.byChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attributionData.bySource.map((source, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{source.source}</span>
                        <Badge className="bg-green-500/20 text-green-400">
                          ${source.revenue.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-[#c8ff00]"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12">{source.percentage}%</span>
                      </div>
                      <div className="text-xs text-gray-500">{source.orders} orders</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attributionData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#c8ff00" name="Revenue ($)" />
                  <Bar dataKey="orders" fill="#00bfff" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attributionData.topCampaigns.map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex-1">
                      <div className="text-white font-medium">{campaign.name}</div>
                      <div className="text-xs text-gray-400">ROI: {campaign.roi}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">${campaign.revenue.toLocaleString()}</div>
                      <Badge className="bg-[#c8ff00] text-black text-xs mt-1">
                        Top {i + 1}
                      </Badge>
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