import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/components/ui/use-toast';

// Types (JSDoc for type checking in JavaScript)
/**
 * @typedef {Object} HealthCheck
 * @property {string} name
 * @property {'healthy' | 'degraded' | 'unhealthy'} status
 * @property {number} responseTime
 * @property {string} lastChecked
 * @property {string} [message]
 */

/**
 * @typedef {Object} HealthReport
 * @property {'healthy' | 'degraded' | 'unhealthy'} status
 * @property {string} timestamp
 * @property {string} version
 * @property {string} environment
 * @property {HealthCheck[]} checks
 * @property {Object} summary
 * @property {number} summary.total
 * @property {number} summary.healthy
 * @property {number} summary.degraded
 * @property {number} summary.unhealthy
 */

/**
 * @typedef {Object} ErrorLog
 * @property {string} _id
 * @property {string} error_type
 * @property {string} category
 * @property {'low' | 'medium' | 'high' | 'critical'} severity
 * @property {string} message
 * @property {string} [stack_trace]
 * @property {string} created_at
 * @property {Object} [context]
 * @property {string} [context.url]
 * @property {string} [context.method]
 * @property {string} [context.userId]
 * @property {string} [context.ip]
 */

/**
 * @typedef {Object} Alert
 * @property {string} _id
 * @property {string} type
 * @property {'info' | 'warning' | 'error' | 'critical'} severity
 * @property {string} title
 * @property {string} message
 * @property {'pending' | 'sent' | 'failed' | 'acknowledged' | 'resolved'} status
 * @property {string} created_at
 * @property {string} [sent_at]
 */

/**
 * @typedef {Object} RequestMetric
 * @property {string} timestamp
 * @property {number} count
 * @property {number} avgResponseTime
 * @property {number} errorCount
 */

// API functions
const fetchHealthStatus = async () => {
  const response = await fetch('/.netlify/functions/health');
  if (!response.ok) throw new Error('Failed to fetch health status');
  return response.json();
};

const fetchErrorLogs = async (limit = 50) => {
  const response = await fetch(`/.netlify/functions/admin/logError?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch error logs');
  const data = await response.json();
  return data.errors || [];
};

const fetchAlerts = async (limit = 20) => {
  const response = await fetch(`/.netlify/functions/admin/sendAlert?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  const data = await response.json();
  return data.alerts || [];
};

const fetchMetrics = async (hours = 24) => {
  // This would be a real API endpoint in production
  // For now, generate mock data
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

const acknowledgeAlertAPI = async (alertId) => {
  const response = await fetch('/.netlify/functions/admin/sendAlert', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId, action: 'acknowledge' }),
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'healthy':
    case 'sent':
    case 'acknowledged':
    case 'resolved':
      return 'bg-green-500';
    case 'degraded':
    case 'warning':
      return 'bg-yellow-500';
    case 'unhealthy':
    case 'failed':
    case 'error':
    case 'critical':
      return 'bg-red-500';
    case 'pending':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50';
    case 'high':
    case 'error':
      return 'text-orange-600 bg-orange-50';
    case 'medium':
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
    case 'info':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const formatResponseTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

// Components
const StatusCard = ({ title, value, subtitle, icon, trend, trendValue, status }) => {
  const statusColors = {
    healthy: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    error: 'border-red-200 bg-red-50/50',
  };

  return (
    <Card className={status ? statusColors[status] : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === 'healthy' ? 'bg-green-100 text-green-600' :
              status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              status === 'error' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {trend === 'up' ? <TrendingUp size={16} /> :
               trend === 'down' ? <TrendingDown size={16} /> : null}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const HealthCheckItem = ({ check }) => {
  const statusIcons = {
    healthy: <CheckCircle className="text-green-500" size={20} />,
    degraded: <AlertTriangle className="text-yellow-500" size={20} />,
    unhealthy: <XCircle className="text-red-500" size={20} />,
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
      <div className="flex items-center gap-3">
        {statusIcons[check.status]}
        <div>
          <p className="font-medium capitalize">{check.name.replace(/_/g, ' ')}</p>
          {check.message && (
            <p className="text-sm text-gray-500">{check.message}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
          {check.status}
        </Badge>
        <p className="text-xs text-gray-500 mt-1">
          {formatResponseTime(check.responseTime)}
        </p>
      </div>
    </div>
  );
};

const ErrorLogItem = ({ error, expanded, onToggle }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <Badge className={getSeverityColor(error.severity)}>
            {error.severity}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{error.error_type}</p>
            <p className="text-sm text-gray-500 truncate">{error.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {formatDate(error.created_at)}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          <div className="pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Category</p>
              <p className="text-sm capitalize">{error.category}</p>
            </div>
            {error.context && (
              <div>
                <p className="text-sm font-medium text-gray-600">Context</p>
                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                  {JSON.stringify(error.context, null, 2)}
                </pre>
              </div>
            )}
            {error.stack_trace && (
              <div>
                <p className="text-sm font-medium text-gray-600">Stack Trace</p>
                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto max-h-40">
                  {error.stack_trace}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AlertItem = ({ alert, onAcknowledge }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          alert.severity === 'critical' ? 'bg-red-100' :
          alert.severity === 'error' ? 'bg-orange-100' :
          alert.severity === 'warning' ? 'bg-yellow-100' :
          'bg-blue-100'
        }`}>
          <Bell size={16} className={
            alert.severity === 'critical' ? 'text-red-600' :
            alert.severity === 'error' ? 'text-orange-600' :
            alert.severity === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          } />
        </div>
        <div>
          <p className="font-medium">{alert.title}</p>
          <p className="text-sm text-gray-500">{alert.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(alert.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getSeverityColor(alert.severity)}>
          {alert.severity}
        </Badge>
        {alert.status === 'pending' && (
          <Button size="sm" variant="outline" onClick={onAcknowledge}>
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
};

// Main Monitoring Dashboard
const MonitoringDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [errorFilter, setErrorFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Queries
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealthStatus,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: errorLogs, isLoading: errorsLoading } = useQuery({
    queryKey: ['errorLogs'],
    queryFn: () => fetchErrorLogs(50),
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetchAlerts(20),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics', timeRange],
    queryFn: () => fetchMetrics(timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720),
  });

  // Mutations
  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlertAPI(alertId);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({ title: 'Alert acknowledged', variant: 'default' });
    } catch {
      toast({ title: 'Failed to acknowledge alert', variant: 'destructive' });
    }
  };

  // Derived data
  const filteredErrors = useMemo(() => {
    if (!errorLogs) return [];
    if (errorFilter === 'all') return errorLogs;
    return errorLogs.filter(e => e.severity === errorFilter);
  }, [errorLogs, errorFilter]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (alertFilter === 'all') return alerts;
    return alerts.filter(a => a.status === alertFilter);
  }, [alerts, alertFilter]);

  const errorStats = useMemo(() => {
    if (!errorLogs) return { byCategory: {}, bySeverity: {} };
    
    const byCategory = {};
    const bySeverity = {};
    
    errorLogs.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return { byCategory, bySeverity };
  }, [errorLogs]);

  const pieChartData = useMemo(() => {
    return Object.entries(errorStats.byCategory).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').toUpperCase(),
      value,
    }));
  }, [errorStats]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Calculate percentiles
  const percentiles = useMemo(() => {
    if (!metrics) return { p50: 0, p95: 0, p99: 0 };
    
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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
              <RefreshCw size={16} className={`mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
              <RefreshCw size={16} className="mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="System Status"
            value={healthData?.status?.toUpperCase() || 'Loading...'}
            icon={<Activity size={24} />}
            status={healthData?.status === 'healthy' ? 'healthy' : healthData?.status === 'degraded' ? 'warning' : 'error'}
          />
          <StatusCard
            title="Response Time (p95)"
            value={`${percentiles.p95}ms`}
            subtitle="95th percentile"
            icon={<Clock size={24} />}
            trend={percentiles.p95 < 200 ? 'up' : 'down'}
            trendValue={percentiles.p95 < 200 ? 'Good' : 'Slow'}
            status={percentiles.p95 < 500 ? 'healthy' : percentiles.p95 < 1000 ? 'warning' : 'error'}
          />
          <StatusCard
            title="Error Rate"
            value={`${((errorLogs?.length || 0) / (metrics?.length || 1) * 100).toFixed(2)}%`}
            subtitle="Last 24 hours"
            icon={<AlertTriangle size={24} />}
            status={(errorLogs?.length || 0) < 10 ? 'healthy' : (errorLogs?.length || 0) < 50 ? 'warning' : 'error'}
          />
          <StatusCard
            title="Active Alerts"
            value={alerts?.filter(a => a.status === 'pending').length || 0}
            subtitle={`${alerts?.filter(a => a.status === 'acknowledged').length || 0} acknowledged`}
            icon={<Bell size={24} />}
            status={(alerts?.filter(a => a.status === 'pending').length || 0) === 0 ? 'healthy' : 'warning'}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="health">Health Checks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Request Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} />
                    Request Volume
                  </CardTitle>
                  <CardDescription>Requests per hour over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).getHours() + ':00'}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value )}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Response Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock size={20} />
                    Response Time
                  </CardTitle>
                  <CardDescription>Average response time (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).getHours() + ':00'}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value )}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgResponseTime" 
                        name="Avg Response Time (ms)"
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Error Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle size={20} />
                    Error Distribution
                  </CardTitle>
                  <CardDescription>Errors by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Percentiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    Response Time Percentiles
                  </CardTitle>
                  <CardDescription>Distribution of response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">p50 (Median)</span>
                        <span className="text-sm text-gray-500">{percentiles.p50}ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentiles.p50 / 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">p95</span>
                        <span className="text-sm text-gray-500">{percentiles.p95}ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentiles.p95 / 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">p99</span>
                        <span className="text-sm text-gray-500">{percentiles.p99}ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(percentiles.p99 / 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Error Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={errorFilter} onValueChange={setErrorFilter}>
                      <SelectTrigger className="w-32">
                        <Filter size={16} className="mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {errorsLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))
                    ) : filteredErrors.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
                        <p>No errors found</p>
                      </div>
                    ) : (
                      filteredErrors.map(error => (
                        <ErrorLogItem
                          key={error._id}
                          error={error}
                          expanded={expandedError === error._id}
                          onToggle={() => setExpandedError(
                            expandedError === error._id ? null : error._id
                          )}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Alert History</CardTitle>
                  <Select value={alertFilter} onValueChange={setAlertFilter}>
                    <SelectTrigger className="w-32">
                      <Filter size={16} className="mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {alertsLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))
                    ) : filteredAlerts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Bell className="mx-auto mb-2 text-gray-400" size={48} />
                        <p>No alerts found</p>
                      </div>
                    ) : (
                      filteredAlerts.map(alert => (
                        <AlertItem
                          key={alert._id}
                          alert={alert}
                          onAcknowledge={() => handleAcknowledge(alert._id)}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Checks Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Health Check Status</CardTitle>
                    <CardDescription>
                      Last checked: {healthData?.timestamp ? formatDate(healthData.timestamp) : 'Never'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}
                      className="text-lg px-4 py-1"
                    >
                      {healthData?.summary?.healthy || 0}/{healthData?.summary?.total || 0} Healthy
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-2">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {healthData?.checks.map(check => (
                      <HealthCheckItem key={check.name} check={check} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Version</p>
                    <p className="font-medium">{healthData?.version || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Environment</p>
                    <p className="font-medium capitalize">{healthData?.environment || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Checks</p>
                    <p className="font-medium">{healthData?.summary?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Failed Checks</p>
                    <p className="font-medium text-red-600">
                      {(healthData?.summary?.unhealthy || 0) + (healthData?.summary?.degraded || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MonitoringDashboard;