import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Download, DollarSign, Target, 
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
      {/* Key Insights Alert */}
      {(bestChannel || worstChannel) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {bestChannel && (
            <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-gray-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Top Performer</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Highest revenue channel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="text-white font-medium capitalize">{bestChannel.channel}</span> generated{' '}
                    <span className="font-semibold text-green-400">${bestChannel.revenue.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {bestChannel.orders} orders • {bestChannel.conversion_rate?.toFixed(1)}% conversion rate
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {worstChannel && worstChannel.conversion_rate < 5 && (
            <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-gray-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Activity className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Needs Attention</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Low conversion rate detected
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="text-white font-medium capitalize">{worstChannel.channel}</span> has{' '}
                    <span className="font-semibold text-yellow-400">{worstChannel.conversion_rate?.toFixed(1)}%</span> conversion
                  </p>
                  <p className="text-xs text-gray-500">
                    Consider optimizing messaging or targeting for this channel
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Channel Performance */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                <Target className="w-5 h-5 text-[#c8ff00]" />
              </div>
              <div>
                <CardTitle className="text-white">Revenue by Channel</CardTitle>
                <CardDescription>
                  Performance breakdown across acquisition channels
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
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
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            {by_channel?.map((channel, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-[#c8ff00]/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400 capitalize">{channel.channel}</div>
                  {channel === bestChannel && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      Top
                    </Badge>
                  )}
                </div>
                <div className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  ${channel.revenue?.toLocaleString()}
                  <ArrowUpRight className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{channel.orders} orders</span>
                  <span className={`font-medium ${
                    channel.conversion_rate > 10 ? 'text-green-400' : 
                    channel.conversion_rate > 5 ? 'text-[#c8ff00]' : 
                    'text-yellow-400'
                  }`}>
                    {channel.conversion_rate?.toFixed(1)}% CR
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Daily Performance Trend</CardTitle>
              <CardDescription>
                Revenue, orders, and leads over time
              </CardDescription>
            </div>
          </div>
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
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Top Performing Categories</CardTitle>
              <CardDescription>
                Business categories ranked by revenue
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {top_categories?.map((cat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-[#c8ff00]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-gray-500/20 text-gray-300' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-700/50 text-gray-400'
                    }`}>
                      <span className="text-lg font-bold">#{idx + 1}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold capitalize">
                        {cat.category.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center gap-3 mt-1">
                        <span>{cat.orders} orders</span>
                        <span>•</span>
                        <span>${cat.avg_order_value?.toFixed(2)} AOV</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#c8ff00] flex items-center gap-2">
                      ${cat.revenue?.toLocaleString()}
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total Revenue
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Performance Metrics</CardTitle>
              <CardDescription>
                Key financial indicators and ratios
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-gray-800/50 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Revenue/Lead</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${summary.revenue_per_lead?.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Per lead generated</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#c8ff00]/10 to-gray-800/50 border border-[#c8ff00]/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-[#c8ff00]" />
                <span className="text-xs text-gray-400">LTV</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${summary.ltv?.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Lifetime value</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-gray-800/50 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">Est. CAC</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${summary.estimated_cac?.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Customer acq. cost</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-gray-800/50 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">LTV:CAC</span>
              </div>
              <div className={`text-2xl font-bold ${
                summary.ltv_cac_ratio >= 3 ? 'text-green-400' : 
                summary.ltv_cac_ratio >= 1.5 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {summary.ltv_cac_ratio?.toFixed(1)}x
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.ltv_cac_ratio >= 3 ? 'Excellent' : 
                 summary.ltv_cac_ratio >= 1.5 ? 'Good' : 'Needs work'}
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          {(summary.ltv_cac_ratio < 3 || bestChannel) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Performance Insights</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {summary.ltv_cac_ratio < 3 && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          LTV:CAC ratio of {summary.ltv_cac_ratio?.toFixed(1)}x is below the ideal 3:1. 
                          Consider optimizing acquisition costs or increasing customer lifetime value.
                        </span>
                      </li>
                    )}
                    {bestChannel && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          <span className="text-white font-medium capitalize">{bestChannel.channel}</span> is your top performer. 
                          Consider allocating more budget to this channel for optimal ROI.
                        </span>
                      </li>
                    )}
                    {worstChannel && worstChannel.conversion_rate < 5 && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          Review targeting and messaging for <span className="text-white font-medium capitalize">{worstChannel.channel}</span> 
                          - current {worstChannel.conversion_rate?.toFixed(1)}% CR indicates room for optimization.
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}