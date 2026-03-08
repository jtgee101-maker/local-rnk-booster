import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Trash2, RefreshCw, Eye, Filter, ChevronDown, AlertCircle, CheckCircle2, Clock, Eye as EyeIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function APILogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, statusFilter, methodFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Simulate fetching logs
      const mockLogs = Array.from({ length: 25 }, (_, i) => ({
        id: `log-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'][Math.floor(Math.random() * 5)],
        endpoint: [
          '/api/leads/list',
          '/api/orders/create',
          '/api/users/update',
          '/api/analytics/metrics',
          '/api/admin/health',
          '/api/emails/send',
          '/api/settings/get',
          '/api/campaigns/stats'
        ][Math.floor(Math.random() * 8)],
        statusCode: [200, 201, 400, 401, 403, 404, 500][Math.floor(Math.random() * 7)],
        duration: Math.floor(Math.random() * 5000 + 10),
        requestSize: Math.floor(Math.random() * 50000),
        responseSize: Math.floor(Math.random() * 100000),
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Admin Dashboard)',
        error: Math.random() > 0.85 ? 'Internal Server Error' : null,
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        requestBody: JSON.stringify({ test: 'data' }),
        responseBody: JSON.stringify({ status: 'ok' })
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLogs(mockLogs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip.includes(searchTerm) ||
        log.userId.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter(log => log.statusCode >= 200 && log.statusCode < 300);
      } else if (statusFilter === 'client-error') {
        filtered = filtered.filter(log => log.statusCode >= 400 && log.statusCode < 500);
      } else if (statusFilter === 'server-error') {
        filtered = filtered.filter(log => log.statusCode >= 500);
      }
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(log => log.method === methodFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Method', 'Endpoint', 'Status', 'Duration (ms)', 'IP', 'User ID'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.method,
        log.endpoint,
        log.statusCode,
        log.duration,
        log.ip,
        log.userId
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Logs exported successfully');
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      setLogs([]);
      setFilteredLogs([]);
      toast.success('Logs cleared');
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return <CheckCircle2 className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Logs</h1>
            <p className="text-gray-600 mt-1">Monitor and analyze system API requests</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadLogs}
              variant="outline"
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-600 block mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search endpoint, IP, or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <label className="text-sm text-gray-600 block mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status Codes</SelectItem>
                    <SelectItem value="success">2xx Success</SelectItem>
                    <SelectItem value="client-error">4xx Client Error</SelectItem>
                    <SelectItem value="server-error">5xx Server Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-40">
                <label className="text-sm text-gray-600 block mb-2">Method</label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Timestamp</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Endpoint</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">IP</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <React.Fragment key={log.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-gray-700">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getMethodColor(log.method)}>
                              {log.method}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-mono text-xs">
                            {log.endpoint}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(log.statusCode)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(log.statusCode)}
                                {log.statusCode}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {log.duration}ms
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-mono text-xs">
                            {log.ip}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-blue-600 hover:text-blue-800 transition"
                            >
                              <ChevronDown className={`w-4 h-4 transition ${expandedLog === log.id ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        {expandedLog === log.id && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan="7" className="py-4 px-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-gray-600 text-xs">User ID</p>
                                    <p className="text-gray-900 font-mono text-sm">{log.userId}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 text-xs">Request Size</p>
                                    <p className="text-gray-900 font-mono text-sm">{(log.requestSize / 1024).toFixed(2)} KB</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 text-xs">Response Size</p>
                                    <p className="text-gray-900 font-mono text-sm">{(log.responseSize / 1024).toFixed(2)} KB</p>
                                  </div>
                                </div>

                                {log.error && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm font-mono">{log.error}</p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-gray-600 text-xs mb-1">Request Body</p>
                                    <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                                      {JSON.stringify(JSON.parse(log.requestBody), null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 text-xs mb-1">Response Body</p>
                                    <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                                      {JSON.stringify(JSON.parse(log.responseBody), null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{logs.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {logs.length > 0 ? ((logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length / logs.length) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm">Avg Response Time</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {logs.length > 0 ? (logs.reduce((sum, l) => sum + l.duration, 0) / logs.length).toFixed(0) : 0}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm">Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {logs.filter(l => l.statusCode >= 400).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleClearLogs}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}