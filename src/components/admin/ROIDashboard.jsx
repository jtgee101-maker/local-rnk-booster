import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Download, DollarSign, Target, 
  Users, Activity, ArrowUpRight, Sparkles 
} from 'lucide-react';

export default function ROIDashboard({ dateRange, data }) {
  if (!data) return null;

  const { summary, by_channel, daily_trend, top_categories } = data;

  const handleExport = () => {
    const csv = [
      ['Metric', 'Value'].join(','),
      ['Total Revenue', summary.total_revenue || 0],
      ['Total Orders', summary.total_orders || 0],
      ['Revenue per Lead', summary.revenue_per_lead || 0],
      ['LTV', summary.ltv || 0],
      ['CAC', summary.estimated_cac || 0],
      ['LTV:CAC Ratio', summary.ltv_cac_ratio || 0],
      '',
      ['Channel Performance'],
      ['Channel', 'Revenue', 'Orders', 'Conversion Rate'].join(','),
      ...(by_channel || []).map(ch => [ch.channel, ch.revenue, ch.orders, ch.conversion_rate].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  // Calculate insights
  const bestChannel = by_channel?.reduce((best, ch) => 
    ch.revenue > (best?.revenue || 0) ? ch : best, null
  );
  const worstChannel = by_channel?.reduce((worst, ch) => 
    ch.conversion_rate < (worst?.conversion_rate || 100) ? ch : worst, null
  );

  return (
    <div className="space-y-6">
      {/* Channel Performance */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Revenue by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={by_channel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="channel" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#c8ff00" name="Revenue ($)" />
              <Bar dataKey="orders" fill="#8b5cf6" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {by_channel?.map((channel, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">{channel.channel}</div>
                <div className="text-xl font-bold text-white mb-1">
                  ${channel.revenue?.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{channel.orders} orders</span>
                  <span className="text-[#c8ff00]">
                    {channel.conversion_rate?.toFixed(1)}% CR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Daily Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#c8ff00" 
                strokeWidth={2}
                name="Revenue ($)"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Orders"
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top_categories?.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-600">#{idx + 1}</div>
                  <div>
                    <div className="text-white font-semibold capitalize">
                      {cat.category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-400">
                      {cat.orders} orders • ${cat.avg_order_value?.toFixed(2)} AOV
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#c8ff00]">
                    ${cat.revenue?.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-500">
                    <TrendingUp className="w-3 h-3" />
                    Revenue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Revenue/Lead</div>
              <div className="text-xl font-bold text-white">
                ${summary.revenue_per_lead?.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">LTV</div>
              <div className="text-xl font-bold text-white">
                ${summary.ltv?.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Est. CAC</div>
              <div className="text-xl font-bold text-white">
                ${summary.estimated_cac?.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">LTV:CAC</div>
              <div className="text-xl font-bold text-green-500">
                {summary.ltv_cac_ratio?.toFixed(1)}x
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}