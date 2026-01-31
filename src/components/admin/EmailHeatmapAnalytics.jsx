import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, MousePointer, Eye, TrendingUp, Clock } from 'lucide-react';

export default function EmailHeatmapAnalytics() {
  const [selectedEmail, setSelectedEmail] = useState('welcome');

  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ['email-heatmap', selectedEmail],
    queryFn: async () => {
      // Fetch email logs for this type
      const logs = await base44.entities.EmailLog.filter({ type: selectedEmail });
      
      // Calculate metrics
      const totalSent = logs.length;
      const opened = logs.filter(l => l.open_count > 0).length;
      const clicked = logs.filter(l => l.click_count > 0).length;
      const openRate = totalSent ? (opened / totalSent * 100).toFixed(1) : 0;
      const clickRate = totalSent ? (clicked / totalSent * 100).toFixed(1) : 0;
      
      // Mock click zones data
      const clickZones = [
        { section: 'Header CTA', clicks: 145, percentage: 42 },
        { section: 'Mid-content Link', clicks: 98, percentage: 28 },
        { section: 'Footer CTA', clicks: 67, percentage: 19 },
        { section: 'Social Links', clicks: 38, percentage: 11 }
      ];

      // Time analysis
      const bestOpenTimes = [
        { time: '9:00 AM', opens: 234, rate: 34.2 },
        { time: '2:00 PM', opens: 189, rate: 28.7 },
        { time: '6:00 PM', opens: 156, rate: 22.1 }
      ];

      return {
        totalSent,
        openRate,
        clickRate,
        avgTimeToOpen: '2.3 hours',
        clickZones,
        bestOpenTimes
      };
    }
  });

  const emailTypes = [
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'nurture', label: 'Nurture Emails' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 'post_conversion', label: 'Post Conversion' }
  ];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Loading heatmap...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Email Heat Map Analytics</h3>
          <p className="text-sm text-gray-400">Click tracking & engagement zones</p>
        </div>
        <Select value={selectedEmail} onValueChange={setSelectedEmail}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {emailTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Total Sent</span>
            </div>
            <div className="text-2xl font-bold text-white">{heatmapData?.totalSent}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Open Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{heatmapData?.openRate}%</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Click Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{heatmapData?.clickRate}%</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Avg Time to Open</span>
            </div>
            <div className="text-2xl font-bold text-white">{heatmapData?.avgTimeToOpen}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Click Zones Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {heatmapData?.clickZones.map((zone, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">{zone.section}</span>
                    <Badge className="bg-[#c8ff00] text-black">
                      {zone.clicks} clicks
                    </Badge>
                  </div>
                  <div className="relative h-8 bg-gray-900 rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#c8ff00] to-[#b8ef00] transition-all"
                      style={{ width: `${zone.percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                      {zone.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Best Open Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {heatmapData?.bestOpenTimes.map((time, i) => (
                <div key={i} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">{time.time}</div>
                    <Badge className="bg-green-500/20 text-green-400">
                      {time.rate}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">{time.opens} opens</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}