import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { FileText, Search, RefreshCw, Download, Filter, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function APILogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoadLogs();
  }, []);

  const checkAuthAndLoadLogs = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(currentUser);
      await loadLogs();
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch error logs (our API logs)
      const errorLogs = await base44.entities.ErrorLog.list('-created_date', 50);
      
      // Fetch conversion events as API activity logs
      const conversionEvents = await base44.entities.ConversionEvent.list('-created_date', 50);
      
      // Combine and format logs
      const formattedLogs = [
        ...errorLogs.map(log => ({
          id: log.id,
          timestamp: log.created_date,
          type: log.error_type,
          severity: log.severity,
          message: log.message,
          metadata: log.metadata,
          status: log.resolved ? 'resolved' : 'error',
          source: 'error_log'
        })),
        ...conversionEvents.map(event => ({
          id: event.id,
          timestamp: event.created_date,
          type: 'conversion_event',
          severity: 'info',
          message: `${event.event_name} - ${event.funnel_version}`,
          metadata: event.properties,
          status: 'success',
          source: 'conversion_event'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load API logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Type', 'Severity', 'Status', 'Message'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.type,
        log.severity,
        log.status,
        log.message
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Logs exported');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const stats = [
    { label: 'Total Logs', value: logs.length, color: '#c8ff00' },
    { label: 'Errors', value: logs.filter(l => l.status === 'error').length, color: '#ef4444' },
    { label: 'Success', value: logs.filter(l => l.status === 'success').length, color: '#10b981' },
    { label: 'Today', value: logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 86400000)).length, color: '#3b82f6' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#c8ff00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#c8ff00]" />
              API Logs
            </h1>
            <p className="text-gray-400 mt-2">Monitor API activity and errors</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={loadLogs} className="gap-2 bg-[#c8ff00] text-black hover:bg-[#c8ff00]/90">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-[#1a1a2e] border-gray-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6 bg-[#1a1a2e] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-10 bg-[#0a0a0f] border-gray-700 text-white"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px] bg-[#0a0a0f] border-gray-700 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 50 API logs and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-[#0a0a0f] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{log.message}</span>
                        <Badge variant="outline" className="text-xs">{log.type}</Badge>
                        <Badge className={`text-xs ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-xs text-gray-400 mt-2 bg-black/30 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No logs found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}