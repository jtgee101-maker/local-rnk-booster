import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function APILogs() {
  const [errorLogs, setErrorLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState('errors');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [errors, audit, emails] = await Promise.all([
        base44.entities.ErrorLog.list('-created_date', 100),
        base44.entities.AdminAuthAuditLog.list('-created_date', 100),
        base44.entities.EmailLog.list('-created_date', 100)
      ]);
      setErrorLogs(errors || []);
      setAuditLogs(audit || []);
      setEmailLogs(emails || []);
    } catch (err) {
      toast.error('Failed to load logs');
    }
    setLoading(false);
  };

  const filteredErrors = errorLogs.filter(e => {
    const matchSearch = !search || e.message?.toLowerCase().includes(search.toLowerCase()) || e.error_type?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'all' || e.severity === severityFilter;
    return matchSearch && matchSev;
  });

  const filteredAudit = auditLogs.filter(e =>
    !search || e.email?.includes(search) || e.event_type?.includes(search)
  );

  const filteredEmails = emailLogs.filter(e =>
    !search || e.to?.includes(search) || e.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const severityBadge = (sev) => {
    const map = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-gray-100 text-gray-700' };
    return map[sev] || map.low;
  };

  const emailStatusBadge = (status) => {
    const map = { sent: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', bounced: 'bg-orange-100 text-orange-800', opened: 'bg-blue-100 text-blue-800' };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const exportCSV = (rows, name) => {
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).map(v => JSON.stringify(v ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time error, auth, and email logs</p>
          </div>
          <Button onClick={loadAll} variant="outline" disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-5">
            <p className="text-xs text-gray-500">Total Errors</p>
            <p className="text-2xl font-bold text-red-600">{errorLogs.length}</p>
            <p className="text-xs text-gray-400">{errorLogs.filter(e => e.severity === 'critical' && !e.resolved).length} critical unresolved</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-gray-500">Auth Events</p>
            <p className="text-2xl font-bold text-blue-600">{auditLogs.length}</p>
            <p className="text-xs text-gray-400">{auditLogs.filter(e => e.event_type === 'admin_login_success').length} successful logins</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-gray-500">Emails Sent</p>
            <p className="text-2xl font-bold text-green-600">{emailLogs.filter(e => e.status === 'sent' || e.status === 'opened').length}</p>
            <p className="text-xs text-gray-400">{emailLogs.filter(e => e.status === 'bounced').length} bounced</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-gray-500">Email Open Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {emailLogs.length > 0 ? ((emailLogs.filter(e => e.status === 'opened' || e.open_count > 0).length / emailLogs.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-gray-400">{emailLogs.filter(e => e.open_count > 0).length} opened</p>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {tab === 'errors' && (
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="errors">Errors ({filteredErrors.length})</TabsTrigger>
            <TabsTrigger value="auth">Auth Audit ({filteredAudit.length})</TabsTrigger>
            <TabsTrigger value="email">Email Logs ({filteredEmails.length})</TabsTrigger>
          </TabsList>

          {/* Error Logs */}
          <TabsContent value="errors">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Error Logs</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportCSV(filteredErrors, 'error-logs')} className="gap-1">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto" /></div>
                : filteredErrors.length === 0 ? <p className="text-center text-gray-400 py-8">No errors found</p>
                : (
                  <div className="space-y-2">
                    {filteredErrors.map(log => (
                      <div key={log.id} className="border rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        >
                          <Badge className={severityBadge(log.severity)}>{log.severity || 'unknown'}</Badge>
                          <span className="text-sm font-medium text-gray-800 flex-1 truncate">{log.message || log.error_type}</span>
                          <span className="text-xs text-gray-400">{log.created_date ? format(new Date(log.created_date), 'MMM d HH:mm') : ''}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${expanded === log.id ? 'rotate-180' : ''}`} />
                        </div>
                        {expanded === log.id && (
                          <div className="border-t bg-gray-50 p-3 text-xs space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-gray-500">Type:</span> <span className="font-mono">{log.error_type}</span></div>
                              <div><span className="text-gray-500">Resolved:</span> <span>{log.resolved ? '✅' : '❌'}</span></div>
                            </div>
                            {log.metadata && (
                              <pre className="bg-gray-900 text-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth Audit */}
          <TabsContent value="auth">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Auth Audit Log</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportCSV(filteredAudit, 'auth-audit')} className="gap-1">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto" /></div>
                : filteredAudit.length === 0 ? <p className="text-center text-gray-400 py-8">No auth events found</p>
                : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left">
                      <th className="py-2 px-3 text-gray-500 font-medium">Event</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Email</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">IP</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Time</th>
                    </tr></thead>
                    <tbody>
                      {filteredAudit.map(log => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${log.event_type?.includes('success') ? 'bg-green-100 text-green-800' : log.event_type?.includes('failed') || log.event_type?.includes('invalid') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                              {log.event_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-700">{log.email}</td>
                          <td className="py-2 px-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{log.created_date ? format(new Date(log.created_date), 'MMM d HH:mm:ss') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Logs */}
          <TabsContent value="email">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Email Logs</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportCSV(filteredEmails, 'email-logs')} className="gap-1">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto" /></div>
                : filteredEmails.length === 0 ? <p className="text-center text-gray-400 py-8">No email logs found</p>
                : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left">
                      <th className="py-2 px-3 text-gray-500 font-medium">To</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Subject</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Type</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Status</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Opens</th>
                      <th className="py-2 px-3 text-gray-500 font-medium">Time</th>
                    </tr></thead>
                    <tbody>
                      {filteredEmails.map(log => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-700 text-xs">{log.to}</td>
                          <td className="py-2 px-3 text-gray-700 text-xs max-w-48 truncate">{log.subject}</td>
                          <td className="py-2 px-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{log.type}</span></td>
                          <td className="py-2 px-3"><Badge className={emailStatusBadge(log.status)}>{log.status}</Badge></td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{log.open_count || 0}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{log.created_date ? format(new Date(log.created_date), 'MMM d HH:mm') : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}