import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, MousePointer, Target, MapPin, Download, RefreshCw, Calendar, Clock, Smartphone, Monitor, Tablet, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';

export default function CampaignAnalytics({ campaigns, selectedCampaign: propSelectedCampaign }) {
  const [selectedCampaign, setSelectedCampaign] = useState(propSelectedCampaign || campaigns?.[0]?.id || null);
  const [dateRange, setDateRange] = useState('7d');

  React.useEffect(() => {
    if (propSelectedCampaign) {
      setSelectedCampaign(propSelectedCampaign);
    }
  }, [propSelectedCampaign]);

  const { data: clicks, refetch: refetchClicks } = useQuery({
    queryKey: ['campaign-clicks', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      return await base44.asServiceRole.entities.CampaignClick.filter({
        campaign_id: selectedCampaign
      }, '-created_date', 500);
    },
    enabled: !!selectedCampaign
  });

  const { data: links, refetch: refetchLinks } = useQuery({
    queryKey: ['campaign-links', selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      return await base44.asServiceRole.entities.CampaignLink.filter({
        campaign_id: selectedCampaign
      }, '-created_date', 100);
    },
    enabled: !!selectedCampaign
  });

  const selectedCampaignData = campaigns?.find(c => c.id === selectedCampaign);

  const deviceData = useMemo(() => {
    if (!clicks) return {};
    return clicks.reduce((acc, click) => {
      const device = click.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
  }, [clicks]);

  const pieData = useMemo(() => {
    return deviceData ? Object.keys(deviceData).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: deviceData[key]
    })) : [];
  }, [deviceData]);

  const browserData = useMemo(() => {
    if (!clicks) return [];
    const browsers = clicks.reduce((acc, click) => {
      const browser = click.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(browsers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [clicks]);

  const locationData = useMemo(() => {
    if (!clicks) return [];
    const locations = clicks.reduce((acc, click) => {
      const location = click.location?.city || click.location?.country || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(locations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [clicks]);

  const timelineData = useMemo(() => {
    if (!clicks) return [];
    const days = parseInt(dateRange);
    const now = new Date();
    const startDate = subDays(now, days);
    
    const grouped = clicks
      .filter(click => new Date(click.created_date) >= startDate)
      .reduce((acc, click) => {
        const date = format(parseISO(click.created_date), 'MMM dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(grouped).map(([date, clicks]) => ({ date, clicks }));
  }, [clicks, dateRange]);

  const COLORS = ['#c8ff00', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const topLinks = useMemo(() => {
    return links?.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10) || [];
  }, [links]);

  const stats = useMemo(() => {
    const totalClicks = clicks?.length || 0;
    const uniqueVisitors = links?.reduce((sum, link) => sum + (link.unique_visitors || 0), 0) || 0;
    const conversions = links?.filter(link => link.converted).length || 0;
    const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(1) : 0;

    return { totalClicks, uniqueVisitors, conversions, conversionRate };
  }, [clicks, links]);

  const handleRefresh = () => {
    refetchClicks();
    refetchLinks();
  };

  const handleExportCSV = () => {
    if (!clicks || clicks.length === 0) return;
    
    const csv = [
      ['Date', 'Device', 'Browser', 'Location', 'IP'],
      ...clicks.map(click => [
        format(parseISO(click.created_date), 'yyyy-MM-dd HH:mm:ss'),
        click.device_type || '',
        click.browser || '',
        click.location?.city || click.location?.country || '',
        click.ip_address || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_analytics_${selectedCampaignData?.name || 'data'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!selectedCampaign) {
    return (
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700">
        <CardContent className="py-16 text-center">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-white font-bold text-xl mb-2">No Campaign Selected</p>
          <p className="text-gray-400">Select a campaign to view analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      {/* Header with Campaign Selector */}
      <Card className="bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/10 border-2 border-indigo-500/30 shadow-xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-white flex items-center gap-3 text-3xl font-black">
                <BarChart className="w-8 h-8 text-[#c8ff00]" />
                Campaign Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-white font-semibold mt-2 text-base">
                {selectedCampaignData?.name || 'Campaign'} - Real-time Performance Insights
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-gray-900 border-2 border-gray-700 text-white font-bold h-11">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="14d">Last 14 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-64 bg-gray-900 border-2 border-gray-700 text-white font-bold h-11">
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
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="lg"
                className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 text-white font-bold"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleExportCSV}
                size="lg"
                className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-2 border-blue-500/30 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-blue-200 mb-2 uppercase tracking-wider">Total Clicks</div>
                  <div className="text-4xl font-black text-white">{stats.totalClicks}</div>
                </div>
                <div className="p-4 bg-blue-500/20 rounded-xl">
                  <MousePointer className="w-10 h-10 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-2 border-purple-500/30 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-purple-200 mb-2 uppercase tracking-wider">Unique Visitors</div>
                  <div className="text-4xl font-black text-white">{stats.uniqueVisitors}</div>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-xl">
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/30 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-green-200 mb-2 uppercase tracking-wider">Conversions</div>
                  <div className="text-4xl font-black text-white">{stats.conversions}</div>
                </div>
                <div className="p-4 bg-green-500/20 rounded-xl">
                  <Target className="w-10 h-10 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-500/30 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-yellow-200 mb-2 uppercase tracking-wider">Conversion Rate</div>
                  <div className="text-4xl font-black text-white">{stats.conversionRate}%</div>
                </div>
                <div className="p-4 bg-yellow-500/20 rounded-xl">
                  <TrendingUp className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Click Timeline */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
            <Clock className="w-6 h-6 text-[#c8ff00]" />
            Click Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#c8ff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '2px solid #c8ff00',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                />
                <Area type="monotone" dataKey="clicks" stroke="#c8ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Clock className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-bold">No click data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
              <Smartphone className="w-6 h-6 text-[#c8ff00]" />
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '2px solid #c8ff00', borderRadius: '8px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Monitor className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">No device data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Distribution */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
              <Globe className="w-6 h-6 text-[#c8ff00]" />
              Browser Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '2px solid #c8ff00', borderRadius: '8px', fontWeight: 'bold' }} />
                  <Bar dataKey="value" fill="#c8ff00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Globe className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">No browser data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
              <Target className="w-6 h-6 text-[#c8ff00]" />
              Top Performing Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700 hover:border-[#c8ff00]/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#c8ff00] to-[#d4ff33] rounded-full flex items-center justify-center text-black font-black text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-base">{link.purl || link.short_code}</div>
                      {link.recipient_name && (
                        <div className="text-sm text-gray-400 font-semibold">{link.recipient_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-2xl">{link.clicks || 0}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">clicks</div>
                  </div>
                </motion.div>
              ))}
              {topLinks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-bold">No link data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3 text-xl font-black">
              <MapPin className="w-6 h-6 text-[#c8ff00]" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationData.length > 0 ? (
              <div className="space-y-3">
                {locationData.map((location, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-indigo-400" />
                      <span className="text-white font-bold">{location.name}</span>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 font-bold">
                      {location.value} clicks
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <MapPin className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">No location data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}