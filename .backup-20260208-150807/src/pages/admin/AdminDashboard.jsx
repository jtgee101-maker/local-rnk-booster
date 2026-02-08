import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/layouts/AdminLayout';

// Icons
import {
  Users,
  DollarSign,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Chart Component using Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock data generator for system health
const generateHealthData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.floor(Math.random() * 30) + 20 + (i < 5 ? 15 : 0),
      memory: Math.floor(Math.random() * 20) + 40,
      requests: Math.floor(Math.random() * 500) + 1000,
      errors: Math.floor(Math.random() * 10)
    });
  }
  return data;
};

// Metric Card Component
const MetricCard = ({ title, value, change, changeType, icon: Icon, description, trend }) => {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant="outline" 
            className={changeType === 'positive' ? 'text-green-500 border-green-200 bg-green-50' : 'text-red-500 border-red-200 bg-red-50'}
          >
            {changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </Badge>
          <span className="text-xs text-slate-400">{description}</span>
        </div>
        {trend && (
          <div className="mt-3 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={changeType === 'positive' ? '#22c55e' : '#ef4444'} 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Activity Item Component
const ActivityItem = ({ type, title, description, time, user }) => {
  const icons = {
    user: Users,
    system: Server,
    error: AlertCircle,
    success: CheckCircle2,
    warning: Clock
  };
  
  const colors = {
    user: 'bg-blue-500',
    system: 'bg-purple-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500'
  };

  const Icon = icons[type] || Activity;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className={`w-8 h-8 rounded-full ${colors[type]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-slate-400">{time}</p>
        {user && (
          <Avatar className="w-5 h-5 mt-1 ml-auto">
            <AvatarFallback className="text-[8px] bg-slate-200">{user}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick, variant = 'default' }) => (
  <Button 
    variant={variant === 'outline' ? 'outline' : 'default'} 
    className="flex items-center gap-2 h-auto py-3 px-4 justify-start"
    onClick={onClick}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm">{label}</span>
  </Button>
);

// System Status Indicator
const SystemStatus = ({ label, status, value }) => {
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
};

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState(generateHealthData());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch dashboard stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const result = await base44.functions.call('admin/getDashboardStats');
      return result || getMockStats();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mock stats for development
  const getMockStats = () => ({
    totalUsers: 12483,
    usersChange: '+12.5%',
    activeUsers: 8934,
    activeChange: '+8.2%',
    revenue: '$48,294',
    revenueChange: '+23.1%',
    mrr: '$12,450',
    mrrChange: '+5.4%',
    errorRate: '0.12%',
    errorChange: '-45%',
    uptime: '99.98%',
    uptimeChange: '+0.01%',
    newSignups: 342,
    newSignupsChange: '+18%'
  });

  const currentStats = stats || getMockStats();

  // Refresh data
  const handleRefresh = () => {
    setHealthData(generateHealthData());
    setLastUpdated(new Date());
    refetch();
  };

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(generateHealthData());
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Recent activity data
  const recentActivity = [
    { type: 'user', title: 'New user registered', description: 'John Doe from Acme Corp', time: '2m ago', user: 'JD' },
    { type: 'success', title: 'Tenant activated', description: 'TechStart Inc. upgraded to Pro', time: '15m ago' },
    { type: 'system', title: 'Backup completed', description: 'Daily backup completed successfully', time: '1h ago' },
    { type: 'warning', title: 'High CPU usage', description: 'Server CPU exceeded 80% for 5 minutes', time: '2h ago' },
    { type: 'error', title: 'Payment failed', description: 'Invoice #1234 payment failed for StartupXYZ', time: '3h ago' },
    { type: 'user', title: 'User role updated', description: 'Sarah Smith promoted to Admin', time: '4h ago', user: 'SS' },
  ];

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Users"
          value={currentStats.totalUsers.toLocaleString()}
          change={currentStats.usersChange}
          changeType="positive"
          icon={Users}
          description="vs last month"
          trend={[{value: 30}, {value: 35}, {value: 32}, {value: 40}, {value: 38}, {value: 45}]}
        />
        <MetricCard
          title="Monthly Revenue"
          value={currentStats.revenue}
          change={currentStats.revenueChange}
          changeType="positive"
          icon={DollarSign}
          description="vs last month"
          trend={[{value: 25}, {value: 28}, {value: 35}, {value: 32}, {value: 40}, {value: 45}]}
        />
        <MetricCard
          title="Error Rate"
          value={currentStats.errorRate}
          change={currentStats.errorChange}
          changeType="positive"
          icon={AlertCircle}
          description="vs last hour"
          trend={[{value: 20}, {value: 18}, {value: 15}, {value: 12}, {value: 8}, {value: 5}]}
        />
        <MetricCard
          title="System Uptime"
          value={currentStats.uptime}
          change={currentStats.uptimeChange}
          changeType="positive"
          icon={Activity}
          description="last 30 days"
          trend={[{value: 99.5}, {value: 99.7}, {value: 99.8}, {value: 99.9}, {value: 99.95}, {value: 99.98}]}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Health Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Health (24h)</CardTitle>
              <CardDescription>CPU, Memory, and Request metrics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c8ff00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#c8ff00" 
                    fillOpacity={1} 
                    fill="url(#colorCpu)" 
                    name="CPU %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorMemory)" 
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#c8ff00]" />
                <span className="text-sm text-slate-600">CPU Usage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-600">Requests/min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status & Quick Actions */}
        <div className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current platform health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <SystemStatus label="API Gateway" status="healthy" value="Operational" />
              <SystemStatus label="Database" status="healthy" value="Operational" />
              <SystemStatus label="Email Service" status="healthy" value="Operational" />
              <SystemStatus label="Payment Processor" status="warning" value="Degraded" />
              <SystemStatus label="CDN" status="healthy" value="Operational" />
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  <Badge className="bg-green-500 text-white">All Good</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction icon={Plus} label="Add User" />
                <QuickAction icon={Building2} label="New Tenant" variant="outline" />
                <QuickAction icon={Download} label="Export Data" variant="outline" />
                <QuickAction icon={Settings} label="Settings" variant="outline" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Stats / Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Key metrics for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">New Signups</span>
                  <span className="text-sm text-slate-500">{currentStats.newSignups} this week</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">Target: 500</span>
                  <span className="text-xs text-green-500 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {currentStats.newSignupsChange}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="text-sm text-slate-500">1,234 current</span>
                </div>
                <Progress value={60} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">Peak: 2,000</span>
                  <span className="text-xs text-green-500 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +8.5%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Churn Rate</span>
                  <span className="text-sm text-slate-500">2.4% monthly</span>
                </div>
                <Progress value={24} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">Goal: &lt; 3%</span>
                  <span className="text-xs text-green-500 flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -0.5%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">NPS Score</span>
                  <span className="text-sm text-slate-500">72 points</span>
                </div>
                <Progress value={72} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">Target: 70+</span>
                  <span className="text-xs text-green-500 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +4 points
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
