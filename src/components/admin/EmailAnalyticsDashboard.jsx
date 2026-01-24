import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Link2, AlertCircle, LogOut, TrendingUp, Mail, RefreshCw, Download, Loader2, Send, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailAnalyticsDashboard() {
  const [emailType, setEmailType] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resending, setResending] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    
    switch (timeRange) {
      case '1d': start.setDate(start.getDate() - 1); break;
      case '7d': start.setDate(start.getDate() - 7); break;
      case '30d': start.setDate(start.getDate() - 30); break;
      case 'custom': start = new Date(startDate);
    }
    
    return {
      startDate: startDate && timeRange === 'custom' ? startDate : start.toISOString(),
      endDate: endDate && timeRange === 'custom' ? endDate : now.toISOString()
    };
  };

  const dateRange = getDateRange();

  const { data: analytics = {}, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['email-analytics', emailType, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin/getEmailAnalytics', {
        type: emailType === 'all' ? null : emailType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      return response.data;
    },
    staleTime: 60000,
    retry: 3
  });

  const metrics = analytics.metrics || {};
  const dailySummary = analytics.dailySummary || {};
  const typeSummary = analytics.typeSummary || {};

  const handleResendUnopenedEmails = async () => {
    if (!emailType || emailType === 'all') {
      toast.error('Select an email type to resend');
      return;
    }

    setResending(true);
    try {
      const response = await base44.functions.invoke('admin/resendToUnopenedEmails', {
        emailType,
        hoursDelay: 24,
        limit: 100
      });

      toast.success(`Resent ${response.data.resent} emails`);
      refetch();
    } catch (error) {
      toast.error('Failed to resend emails');
    } finally {
      setResending(false);
    }
  };

  const handleExport = () => {
    if (!analytics.metrics) return;
    
    const csv = [
      ['Email Analytics Report'],
      ['Email Type', emailType],
      ['Time Range', timeRange],
      ['Generated', new Date().toISOString()],
      '',
      ['Overall Metrics'],
      ['Total Sent', analytics.metrics.totalSent || 0],
      ['Open Rate', (analytics.metrics.openRate || 0) + '%'],
      ['Click Rate', (analytics.metrics.clickRate || 0) + '%'],
      ['Bounce Rate', (analytics.metrics.bounceRate || 0) + '%'],
      ['Unsubscribe Rate', (analytics.metrics.unsubscribeRate || 0) + '%'],
      ['Delivery Rate', (analytics.metrics.deliveryRate || 0) + '%'],
      '',
      ['Performance by Type'],
      ['Type', 'Sent', 'Opened', 'Open Rate', 'Clicked', 'Click Rate', 'Failed'].join(','),
      ...Object.entries(analytics.typeSummary || {}).map(([type, data]) => [
        type,
        data.sent,
        data.opened,
        data.openRate + '%',
        data.clicked,
        data.clickRate + '%',
        data.failed
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-analytics-${emailType}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const KPICard = ({ icon: Icon, label, value, unit = '', color = 'text-blue-400', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}{unit}</p>
            </div>
            <div className={`p-2 rounded-lg bg-${color.split('-')[1]}-500/10`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Mail className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Email Campaign Analytics</h3>
            <p className="text-sm text-gray-400">Track email performance and engagement</p>
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
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Filters & Controls</CardTitle>
            <CardDescription className="text-xs">Filter analytics and manage campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                <SelectItem value="nurture">Nurture</SelectItem>
                <SelectItem value="post_conversion">Post-Conversion</SelectItem>
                <SelectItem value="payment_confirmation">Payment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {timeRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </>
            )}

            <Button
              onClick={handleResendUnopenedEmails}
              disabled={resending || !emailType || emailType === 'all'}
              size="sm"
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black gap-2"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {resending ? 'Resending...' : 'Resend Unopened'}
            </Button>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              variant="outline"
              size="sm"
              className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Key Metrics */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            <KPICard icon={Mail} label="Total Sent" value={metrics.totalSent || 0} color="text-cyan-400" delay={0} />
            <KPICard icon={Eye} label="Open Rate" value={metrics.openRate || 0} unit="%" color="text-blue-400" delay={0.05} />
            <KPICard icon={Link2} label="Click Rate" value={metrics.clickRate || 0} unit="%" color="text-green-400" delay={0.1} />
            <KPICard icon={AlertCircle} label="Bounce Rate" value={metrics.bounceRate || 0} unit="%" color="text-red-400" delay={0.15} />
            <KPICard icon={LogOut} label="Unsubscribe Rate" value={metrics.unsubscribeRate || 0} unit="%" color="text-orange-400" delay={0.2} />
            <KPICard icon={TrendingUp} label="Delivery Rate" value={metrics.deliveryRate || 0} unit="%" color="text-green-400" delay={0.25} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Summary */}
      {!isLoading && Object.keys(typeSummary).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-white">Performance by Email Type</CardTitle>
              </div>
              <CardDescription className="text-xs">Detailed breakdown of email campaign metrics</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400 text-right">Sent</TableHead>
                    <TableHead className="text-gray-400 text-right">Opened</TableHead>
                    <TableHead className="text-gray-400 text-right">Open Rate</TableHead>
                    <TableHead className="text-gray-400 text-right">Clicked</TableHead>
                    <TableHead className="text-gray-400 text-right">Click Rate</TableHead>
                    <TableHead className="text-gray-400 text-right">Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(typeSummary).map(([type, data]) => (
                    <TableRow key={type} className="border-gray-700">
                      <TableCell className="font-medium text-white capitalize">{type.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right text-gray-300">{data.sent}</TableCell>
                      <TableCell className="text-right text-gray-300">{data.opened}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-blue-500/20 text-blue-400">{data.openRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right text-gray-300">{data.clicked}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-500/20 text-green-400">{data.clickRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-red-500/20 text-red-400">{data.failed}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trend */}
      {!isLoading && Object.keys(dailySummary).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">Daily Trend</CardTitle>
              </div>
              <CardDescription className="text-xs">Daily email performance metrics</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(dailySummary)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 30)
                .map(([date, data]) => (
                  <div key={date} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                    <span className="text-sm text-gray-400">{new Date(date).toLocaleDateString()}</span>
                    <div className="flex gap-6 text-sm">
                      <div className="text-gray-300">Sent: <span className="text-white font-bold">{data.sent}</span></div>
                      <div className="text-blue-400">Opened: <span className="font-bold">{data.opened}</span></div>
                      <div className="text-green-400">Clicked: <span className="font-bold">{data.clicked}</span></div>
                      <div className="text-red-400">Failed: <span className="font-bold">{data.failed}</span></div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  );
}