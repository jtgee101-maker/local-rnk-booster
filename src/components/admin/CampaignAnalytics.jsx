import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MousePointer, Target, MapPin } from 'lucide-react';

export default function CampaignAnalytics({ campaigns }) {
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns?.[0]?.id || null);

  const { data: clicks } = useQuery({
    queryKey: ['campaign-clicks', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      return await base44.asServiceRole.entities.CampaignClick.filter({
        campaign_id: selectedCampaign
      });
    },
    enabled: !!selectedCampaign
  });

  const { data: links } = useQuery({
    queryKey: ['campaign-links', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      return await base44.asServiceRole.entities.CampaignLink.filter({
        campaign_id: selectedCampaign
      });
    },
    enabled: !!selectedCampaign
  });

  const deviceData = clicks?.reduce((acc, click) => {
    const device = click.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const pieData = deviceData ? Object.keys(deviceData).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: deviceData[key]
  })) : [];

  const COLORS = ['#c8ff00', '#00C49F', '#FFBB28', '#FF8042'];

  const topLinks = links?.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Campaign Analytics</CardTitle>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-64 bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns?.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Links */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#c8ff00]/20 rounded-full flex items-center justify-center text-[#c8ff00] font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{link.purl || link.short_code}</div>
                      {link.recipient_name && (
                        <div className="text-xs text-gray-400">{link.recipient_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{link.clicks || 0}</div>
                    <div className="text-xs text-gray-400">clicks</div>
                  </div>
                </div>
              ))}
              {topLinks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No link data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Click Timeline */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Click Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            {clicks && clicks.length > 0 ? (
              <p>Timeline visualization coming soon - {clicks.length} total clicks tracked</p>
            ) : (
              <p>No click data available yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}