import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Download, RefreshCw, Loader2, 
  AlertTriangle, Target, BarChart3, Zap
} from 'lucide-react';

const COLORS = ['#c8ff00', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function RevenueAttributionChart({ dateRange }) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['revenue-attribution', dateRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/revenueAttribution', {
        date_range: dateRange
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Revenue Attribution Report'],
      ['Generated', new Date().toISOString()],
      '',
      ['Summary'],
      ['Total Revenue', `$${data.total_revenue?.toLocaleString()}`],
      ['Total Orders', data.total_orders],
      ['Average Order Value', `$${data.average_order_value?.toFixed(2)}`],
      '',
      ['By Category'],
      ['Category', 'Revenue', 'Orders', 'Conversion Rate', 'AOV'].join(','),
      ...(data.attribution?.by_category || []).map(cat => [
        cat.category,
        cat.revenue,
        cat.orders,
        (cat.conversion_rate * 100).toFixed(2) + '%',
        cat.avg_order_value?.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-attribution-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Analyzing revenue attribution...</p>
            <p className="text-xs text-gray-500 mt-1">Processing revenue data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-gray-900/50">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Failed to load attribution data</p>
            <p className="text-xs text-gray-400 mt-1">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { attribution, total_revenue, total_orders, average_order_value } = data || {};
  
  // Calculate insights
  const topCategory = attribution?.by_category?.reduce((top, cat) => 
    cat.revenue > (top?.revenue || 0) ? cat : top, null
  );
  const topFunnel = attribution?.by_funnel?.reduce((top, fun) => 
    fun.revenue > (top?.revenue || 0) ? fun : top, null
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-gray-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  Total Revenue
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    Primary
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-white mt-2">
                  ${total_revenue?.toLocaleString()}
                </div>
                {topCategory && (
                  <div className="text-xs text-gray-500 mt-1">
                    Top: {topCategory.category.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[#c8ff00]/30 bg-gradient-to-br from-[#c8ff00]/10 to-gray-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Total Orders</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {total_orders?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Completed transactions
                </div>
              </div>
              <div className="p-3 bg-[#c8ff00]/10 rounded-lg">
                <TrendingUp className="w-8 h-8 text-[#c8ff00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-gray-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Avg Order Value</div>
                <div className="text-3xl font-bold text-white mt-2">
                  ${average_order_value?.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Per transaction
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attribution by Funnel */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[#c8ff00]" />
              </div>
              <div>
                <CardTitle className="text-white">Revenue by Funnel Version</CardTitle>
                <CardDescription>
                  Compare performance across quiz versions
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => refetch()}
                variant="ghost"
                size="sm"
                disabled={isRefetching}
                className="gap-2 text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
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
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attribution?.by_funnel || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="funnel" stroke="#999" />
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
        </CardContent>
      </Card>

      {/* Attribution by Category */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Revenue by Business Category</CardTitle>
              <CardDescription>
                Distribution across industry segments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attribution?.by_category || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {(attribution?.by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Category Details */}
            <div className="space-y-3">
              <AnimatePresence>
                {attribution?.by_category?.map((cat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-[#c8ff00]/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg" 
                          style={{ 
                            backgroundColor: COLORS[idx % COLORS.length],
                            boxShadow: `0 0 10px ${COLORS[idx % COLORS.length]}50`
                          }}
                        />
                        <span className="text-white font-semibold capitalize">
                          {cat.category.replace(/_/g, ' ')}
                        </span>
                        {cat === topCategory && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Top
                          </Badge>
                        )}
                      </div>
                      <span className="text-[#c8ff00] font-bold text-lg">
                        ${cat.revenue?.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-gray-900/50">
                        <div className="text-xs text-gray-500 mb-1">Orders</div>
                        <div className="text-sm font-semibold text-white">{cat.orders}</div>
                      </div>
                      <div className="p-2 rounded bg-gray-900/50">
                        <div className="text-xs text-gray-500 mb-1">Conv Rate</div>
                        <div className={`text-sm font-semibold ${
                          cat.conversion_rate > 0.15 ? 'text-green-400' : 
                          cat.conversion_rate > 0.1 ? 'text-[#c8ff00]' : 
                          'text-yellow-400'
                        }`}>
                          {(cat.conversion_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-gray-900/50">
                        <div className="text-xs text-gray-500 mb-1">AOV</div>
                        <div className="text-sm font-semibold text-white">
                          ${cat.avg_order_value?.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attribution by Source */}
      {attribution?.by_source && attribution.by_source.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Revenue by Traffic Source</CardTitle>
                  <CardDescription>
                    Attribution across traffic channels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attribution.by_source} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#999" />
                  <YAxis dataKey="source" type="category" stroke="#999" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="revenue" fill="#c8ff00" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Insights */}
      {(topCategory || topFunnel) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-gray-900/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-sm">Revenue Attribution Insights</CardTitle>
                  <CardDescription className="text-xs">
                    Key findings from attribution analysis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-300">
                {topCategory && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#c8ff00] mt-0.5">•</span>
                    <span>
                      <span className="text-white font-medium capitalize">{topCategory.category.replace(/_/g, ' ')}</span> generates 
                      the most revenue with <span className="text-green-400 font-semibold">${topCategory.revenue.toLocaleString()}</span> 
                      {' '}({topCategory.orders} orders, {(topCategory.conversion_rate * 100).toFixed(1)}% conversion rate)
                    </span>
                  </li>
                )}
                {topFunnel && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#c8ff00] mt-0.5">•</span>
                    <span>
                      <span className="text-white font-medium">{topFunnel.funnel}</span> is your top-performing funnel with 
                      {' '}<span className="text-green-400 font-semibold">${topFunnel.revenue.toLocaleString()}</span> in revenue
                    </span>
                  </li>
                )}
                {average_order_value < 150 && (
                  <li className="flex items-start gap-2">
                    <span className="text-[#c8ff00] mt-0.5">•</span>
                    <span>
                      Current AOV of <span className="text-white font-medium">${average_order_value?.toFixed(2)}</span> could be increased 
                      through upsells, bundles, or premium offerings
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}