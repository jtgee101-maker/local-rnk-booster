import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceMetricsDashboard() {
  const { data: perfData, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const leads = await base44.entities.Lead.list('-created_date', 100);
      const orders = await base44.entities.Order.list('-created_date', 100);
      
      // Calculate conversion funnel speed
      const avgTimeToConversion = orders
        .filter(o => o.lead_id)
        .map(o => {
          const lead = leads.find(l => l.id === o.lead_id);
          if (!lead) return null;
          const diff = new Date(o.created_date) - new Date(lead.created_date);
          return diff / (1000 * 60 * 60); // hours
        })
        .filter(t => t !== null && t > 0);

      const avgHours = avgTimeToConversion.length > 0
        ? avgTimeToConversion.reduce((a, b) => a + b, 0) / avgTimeToConversion.length
        : 0;

      // Mock performance timeline
      const timeline = [
        { date: '6h ago', conversions: 3, avgTime: 4.2 },
        { date: '5h ago', conversions: 5, avgTime: 3.8 },
        { date: '4h ago', conversions: 2, avgTime: 5.1 },
        { date: '3h ago', conversions: 4, avgTime: 3.5 },
        { date: '2h ago', conversions: 6, avgTime: 2.9 },
        { date: '1h ago', conversions: 3, avgTime: 3.2 },
        { date: 'Now', conversions: 4, avgTime: 2.8 }
      ];

      return {
        avgConversionTime: avgHours.toFixed(1),
        leadsLast24h: leads.filter(l => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(l.created_date) > dayAgo;
        }).length,
        conversionRate: leads.length > 0 ? (orders.length / leads.length * 100).toFixed(1) : 0,
        timeline
      };
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Loading performance data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Avg Conversion Time</span>
            </div>
            <div className="text-2xl font-bold text-white">{perfData?.avgConversionTime}h</div>
            <div className="text-xs text-gray-500 mt-1">From lead to customer</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Leads (24h)</span>
            </div>
            <div className="text-2xl font-bold text-white">{perfData?.leadsLast24h}</div>
            <div className="text-xs text-gray-500 mt-1">New leads captured</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Conversion Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{perfData?.conversionRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Overall funnel performance</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-400">Conversion Speed Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={perfData?.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#c8ff00" 
                strokeWidth={2}
                name="Avg Hours to Convert"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}