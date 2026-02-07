import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, AlertCircle, Mail, Zap, RefreshCw, Download, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function AdminMetrics() {
  const [previousData, setPreviousData] = useState(null);

  const { data: leads = [], refetch: refetchLeads, isRefetching: isRefetchingLeads } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
    staleTime: 30000,
    gcTime: 300000,
  });

  const { data: orders = [], refetch: refetchOrders, isRefetching: isRefetchingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    staleTime: 30000,
    gcTime: 300000,
  });

  const { data: emailLogs = [], refetch: refetchEmails, isRefetching: isRefetchingEmails } = useQuery({
    queryKey: ['admin-emails'],
    queryFn: () => base44.entities.EmailLog.list('-created_date', 500),
    staleTime: 30000,
    gcTime: 300000,
  });

  const { data: nurtures = [], refetch: refetchNurtures, isRefetching: isRefetchingNurtures } = useQuery({
    queryKey: ['admin-nurtures'],
    queryFn: () => base44.entities.LeadNurture.filter({ status: 'active' }, '-created_date', 200),
    staleTime: 30000,
    gcTime: 300000,
  });

  const isRefreshing = isRefetchingLeads || isRefetchingOrders || isRefetchingEmails || isRefetchingNurtures;

  const handleRefreshAll = () => {
    refetchLeads();
    refetchOrders();
    refetchEmails();
    refetchNurtures();
  };

  // Calculate metrics
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const conversionRate = leads.length > 0 ? ((orders.filter(o => o.status === 'completed').length / leads.length) * 100) : 0;
  const emailsSent24h = emailLogs.filter(e => new Date(e.created_date) > new Date(Date.now() - 86400000)).length;
  const emailFailures = emailLogs.filter(e => e.status === 'failed').length;
  const activeNurtures = nurtures.filter(n => n.status === 'active').length;

  // Calculate trends (compare last 7 days vs previous 7 days)
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const leadsLast7d = leads.filter(l => new Date(l.created_date).getTime() > sevenDaysAgo).length;
  const leadsPrev7d = leads.filter(l => {
    const time = new Date(l.created_date).getTime();
    return time > fourteenDaysAgo && time <= sevenDaysAgo;
  }).length;
  const leadsTrend = leadsPrev7d > 0 ? ((leadsLast7d - leadsPrev7d) / leadsPrev7d) * 100 : 0;

  const ordersLast7d = orders.filter(o => o.status === 'completed' && new Date(o.created_date).getTime() > sevenDaysAgo).length;
  const ordersPrev7d = orders.filter(o => {
    const time = new Date(o.created_date).getTime();
    return o.status === 'completed' && time > fourteenDaysAgo && time <= sevenDaysAgo;
  }).length;
  const revenueTrend = ordersPrev7d > 0 ? ((ordersLast7d - ordersPrev7d) / ordersPrev7d) * 100 : 0;

  const handleExport = () => {
    const csv = [
      ['KPI Snapshot Report'],
      ['Generated', new Date().toISOString()],
      '',
      ['Metric', 'Value', '7d Trend'],
      ['Total Leads', leads.length, `${leadsTrend >= 0 ? '+' : ''}${leadsTrend.toFixed(1)}%`],
      ['Total Revenue', `$${totalRevenue.toFixed(0)}`, `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`],
      ['Conversion Rate', `${conversionRate.toFixed(1)}%`, ''],
      ['Active Nurtures', activeNurtures, ''],
      ['Emails Sent (24h)', emailsSent24h, ''],
      ['Email Failures', emailFailures, '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-snapshot-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const metrics = [
    {
      title: 'Total Leads',
      value: leads.length,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: leadsTrend,
      subtitle: `${leadsLast7d} in last 7d`
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      trend: revenueTrend,
      subtitle: `${ordersLast7d} orders in 7d`
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      subtitle: `${orders.filter(o => o.status === 'completed').length} conversions`
    },
    {
      title: 'Active Nurtures',
      value: activeNurtures,
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      subtitle: `${nurtures.length} total sequences`
    },
    {
      title: 'Emails Sent (24h)',
      value: emailsSent24h,
      icon: Mail,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      subtitle: `${emailLogs.length} total logs`
    },
    {
      title: 'Email Failures',
      value: emailFailures,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      subtitle: emailFailures > 0 ? 'Requires attention' : 'All healthy',
      alert: emailFailures > 10
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#c8ff00]" />
          <h3 className="text-lg font-semibold text-white">Key Performance Indicators</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all ${metric.alert ? 'ring-1 ring-red-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">{metric.title}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${metric.bg}`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{metric.subtitle}</p>
                    {metric.trend !== undefined && (
                      <Badge 
                        className={`text-xs gap-1 ${
                          metric.trend > 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : metric.trend < 0 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {metric.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : metric.trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {Math.abs(metric.trend).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}