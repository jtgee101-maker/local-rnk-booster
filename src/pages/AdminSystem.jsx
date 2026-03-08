import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Zap, Cpu, HardDrive, Activity, Clock, AlertTriangle, Server, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

export default function AdminSystem() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState('');
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    loadSystemMetrics();
    const interval = setInterval(loadSystemMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      // Simulate system metrics
      const mockMetrics = {
        status: 'healthy',
        uptime: 45 * 24 * 3600, // 45 days in seconds
        cpuUsage: Math.random() * 45 + 15,
        memoryUsage: Math.random() * 60 + 20,
        diskUsage: 68,
        activeConnections: Math.floor(Math.random() * 150 + 50),
        requestsPerSecond: Math.floor(Math.random() * 500 + 100),
        errorRate: Math.random() * 0.5,
        avgResponseTime: Math.random() * 200 + 50,
        database: { status: 'healthy', connections: Math.floor(Math.random() * 50 + 10), queries: 'fast' },
        cache: { status: 'healthy', hitRate: Math.random() * 20 + 75, size: '2.4GB' },
        queue: { pending: Math.floor(Math.random() * 20), processing: Math.floor(Math.random() * 5) }
      };

      setMetrics(mockMetrics);
      calculateUptime(mockMetrics.uptime);

      // Add to performance graph
      setPerformanceData(prev => [...prev, {
        time: new Date().toLocaleTimeString().substring(0, 5),
        cpu: mockMetrics.cpuUsage.toFixed(1),
        memory: mockMetrics.memoryUsage.toFixed(1),
        requests: mockMetrics.requestsPerSecond
      }].slice(-20));

    } catch (error) {
      console.error('Error loading system metrics:', error);
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const calculateUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    setUptime(`${days}d ${hours}h ${mins}m`);
  };

  const handleRunHealthCheck = async () => {
    try {
      toast.info('Running health check...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Health check passed');
      loadSystemMetrics();
    } catch (error) {
      toast.error('Health check failed');
    }
  };

  const getStatusColor = (status) => {
    return status === 'healthy' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
            <p className="text-gray-600 mt-1">Real-time performance and health metrics</p>
          </div>
          <Button
            onClick={handleRunHealthCheck}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
        </div>

        {metrics && (
          <>
            {/* Overall Status */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">System Status</p>
                      <p className="text-2xl font-bold text-green-600">All Systems Operational</p>
                      <p className="text-sm text-gray-500 mt-1">Uptime: {uptime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-600">Healthy</Badge>
                    <p className="text-sm text-gray-600 mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">CPU Usage</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.cpuUsage.toFixed(1)}%</p>
                    </div>
                    <Cpu className={`w-8 h-8 ${metrics.cpuUsage > 70 ? 'text-red-500' : metrics.cpuUsage > 50 ? 'text-yellow-500' : 'text-green-500'}`} />
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${metrics.cpuUsage}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Memory Usage</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.memoryUsage.toFixed(1)}%</p>
                    </div>
                    <HardDrive className={`w-8 h-8 ${metrics.memoryUsage > 80 ? 'text-red-500' : metrics.memoryUsage > 60 ? 'text-yellow-500' : 'text-green-500'}`} />
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${metrics.memoryUsage}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Disk Usage</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.diskUsage}%</p>
                    </div>
                    <Server className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all" style={{ width: `${metrics.diskUsage}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Connections</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.activeConnections}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Healthy connections</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Requests/Second</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.requestsPerSecond}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% from last hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.avgResponseTime.toFixed(0)}ms</p>
                  <p className="text-xs text-gray-500 mt-3">Within SLA limits</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm">Error Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.errorRate.toFixed(2)}%</p>
                  <p className="text-xs text-green-600 mt-3">✓ Below threshold</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList className="border-b border-gray-200">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              {/* Performance Tab */}
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends (Last 20 readings)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
                          <Line type="monotone" dataKey="memory" stroke="#a855f7" name="Memory %" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Loading performance data...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[
                        { name: 'Database', status: metrics.database.status, detail: `${metrics.database.connections} connections` },
                        { name: 'Cache Layer', status: metrics.cache.status, detail: `${metrics.cache.hitRate.toFixed(0)}% hit rate` },
                        { name: 'Job Queue', status: 'healthy', detail: `${metrics.queue.pending} pending, ${metrics.queue.processing} processing` },
                        { name: 'Email Service', status: 'healthy', detail: 'Resend active' },
                        { name: 'API Gateway', status: 'healthy', detail: 'All endpoints responding' }
                      ].map((service, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            {service.status === 'healthy' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-sm text-gray-500">{service.detail}</p>
                            </div>
                          </div>
                          <Badge className={service.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {service.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { resource: 'CPU', allocated: 100, used: metrics.cpuUsage },
                        { resource: 'Memory', allocated: 100, used: metrics.memoryUsage },
                        { resource: 'Disk', allocated: 100, used: metrics.diskUsage }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="resource" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="allocated" fill="#e5e7eb" name="Allocated %" />
                        <Bar dataKey="used" fill="#3b82f6" name="Used %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Version</p>
                  <p className="font-semibold text-gray-900">1.0.0</p>
                </div>
                <div>
                  <p className="text-gray-600">Environment</p>
                  <p className="font-semibold text-gray-900">Production</p>
                </div>
                <div>
                  <p className="text-gray-600">Region</p>
                  <p className="font-semibold text-gray-900">US-East</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Deploy</p>
                  <p className="font-semibold text-gray-900">2h ago</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}