import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Link2, AlertCircle, LogOut, TrendingUp, Mail, RefreshCw } from 'lucide-react';
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

  const { data: analytics = {}, isLoading, refetch } = useQuery({
    queryKey: ['email-analytics', emailType, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin/getEmailAnalytics', {
        type: emailType === 'all' ? null : emailType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      return response.data;
    },
    refetchInterval: 60000
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

  const KPICard = ({ icon: Icon, label, value, unit = '', color = 'text-blue-400' }) => (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}{unit}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filters & Controls</CardTitle>
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
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {resending ? 'Resending...' : 'Resend Unopened'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard icon={Mail} label="Total Sent" value={metrics.totalSent || 0} color="text-cyan-400" />
          <KPICard icon={Eye} label="Open Rate" value={metrics.openRate || 0} unit="%" color="text-blue-400" />
          <KPICard icon={Link2} label="Click Rate" value={metrics.clickRate || 0} unit="%" color="text-green-400" />
          <KPICard icon={AlertCircle} label="Bounce Rate" value={metrics.bounceRate || 0} unit="%" color="text-red-400" />
          <KPICard icon={LogOut} label="Unsubscribe Rate" value={metrics.unsubscribeRate || 0} unit="%" color="text-orange-400" />
          <KPICard icon={TrendingUp} label="Delivery Rate" value={metrics.deliveryRate || 0} unit="%" color="text-green-400" />
        </div>
      )}

      {/* Type Summary */}
      {!isLoading && Object.keys(typeSummary).length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance by Email Type</CardTitle>
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
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Daily Trend</CardTitle>
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
      )}
    </div>
  );
}