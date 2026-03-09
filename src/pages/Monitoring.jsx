import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, AlertTriangle, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Clock,
  RefreshCw, Filter, Download, Bell,
  ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

const formatResponseTime = (ms) => {
  if (!ms) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

const generateMockMetrics = (hours = 24) => {
  const data = [];
  const now = new Date();
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp: timestamp.toISOString(),
      count: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      errorCount: Math.floor(Math.random() * 20),
    });
  }
  return data;
};

export default function Monitoring() {
  const queryClient = useQueryClient();
  const [expandedError, setExpandedError] = useState(null);
  const [errorFilter, setErrorFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: errorLogs = [], isLoading: errorsLoading } = useQuery({
    queryKey: ['monitoring-errors'],
    queryFn: () => base44.entities.ErrorLog.list('-created_date', 50),
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const metrics = useMemo(() => generateMockMetrics(timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720), [timeRange]);

  const filteredErrors = useMemo(() => {
    if (errorFilter === 'all') return errorLogs;
    return errorLogs.filter(e => e.severity === errorFilter);
  }, [errorLogs, errorFilter]);

  const percentiles = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => a.avgResponseTime - b.avgResponseTime);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    return {
      p50: sorted[p50Index]?.avgResponseTime || 0,
      p95: sorted[p95Index]?.avgResponseTime || 0,
      p99: sorted[p99Index]?.avgResponseTime || 0,
    };
  }, [metrics]);

  const errorsByCategory = useMemo(() => {
    const map = {};
    errorLogs.forEach(e => { map[e.error_type || 'unknown'] = (map[e.error_type || 'unknown'] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [errorLogs]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Monitoring Dashboard</h1>
            <p className="text-gray-500">Real-time system health and performance monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Errors', value: errorLogs.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { title: 'Response Time (p95)', value: `${percentiles.p95}ms`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Critical Errors', value: errorLogs.filter(e => e.severity === 'critical').length, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
            { title: 'Resolved', value: errorLogs.filter(e => e.resolved).length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">Errors ({errorLogs.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Request Volume</CardTitle>
                  <CardDescription>Requests per hour over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    {['24h', '7d', '30d'].map(r => (
                      <Button key={r} size="sm" variant={timeRange === r ? 'default' : 'outline'} onClick={() => setTimeRange(r)}>{r}</Button>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={metrics}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).getHours() + ':00'} />
                      <YAxis /><Tooltip labelFormatter={(v) => formatDate(v)} />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {errorsByCategory.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />Error Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={errorsByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {errorsByCategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Error Logs</CardTitle>
                  <Select value={errorFilter} onValueChange={setErrorFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {errorsLoading ? (
                      Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : filteredErrors.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircle className="mx-auto mb-2 text-green-500 w-12 h-12" />
                        <p>No errors found</p>
                      </div>
                    ) : filteredErrors.map(error => (
                      <div key={error.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}>
                          <div className="flex items-center gap-3 flex-1">
                            <Badge className={getSeverityColor(error.severity)}>{error.severity || 'unknown'}</Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{error.error_type}</p>
                              <p className="text-sm text-gray-500 truncate">{error.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{formatDate(error.created_date)}</span>
                            {expandedError === error.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                        {expandedError === error.id && error.metadata && (
                          <div className="px-4 pb-4 border-t bg-gray-50">
                            <pre className="text-xs bg-white p-2 rounded border mt-3 overflow-x-auto">{JSON.stringify(error.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ label: 'p50 (Median)', value: percentiles.p50, color: 'bg-green-500', max: 1000 }, { label: 'p95', value: percentiles.p95, color: 'bg-yellow-500', max: 1000 }, { label: 'p99', value: percentiles.p99, color: 'bg-red-500', max: 1000 }].map(p => (
                <Card key={p.label}>
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-sm text-gray-500">{p.value}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className={`${p.color} h-3 rounded-full`} style={{ width: `${Math.min(p.value / p.max * 100, 100)}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader><CardTitle>Response Time Over Time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).getHours() + ':00'} />
                    <YAxis /><Tooltip labelFormatter={(v) => formatDate(v)} /><Legend />
                    <Line type="monotone" dataKey="avgResponseTime" name="Avg Response Time (ms)" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}