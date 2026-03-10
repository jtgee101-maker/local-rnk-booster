import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Mail, Clock, User, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const STAGE_COLORS = {
  audit_submitted:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pathway_nudge_2h:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  pathway_nudge_12h: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  pathway_selected:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  checkout_abandoned:'bg-red-500/20 text-red-300 border-red-500/30',
  converted:         'bg-green-500/20 text-green-300 border-green-500/30',
  unsubscribed:      'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const STATUS_COLORS = {
  sent:        'bg-green-500/20 text-green-300',
  failed:      'bg-red-500/20 text-red-300',
  opened:      'bg-blue-500/20 text-blue-300',
  clicked:     'bg-purple-500/20 text-purple-300',
  bounced:     'bg-orange-500/20 text-orange-300',
  unsubscribed:'bg-gray-500/20 text-gray-300',
};

const NURTURE_STATUS_COLORS = {
  active:    'bg-yellow-500/20 text-yellow-300',
  completed: 'bg-green-500/20 text-green-300',
  paused:    'bg-red-500/20 text-red-300',
};

function fmt(date) {
  if (!date) return '—';
  try { return format(new Date(date), 'MMM d, HH:mm'); } catch { return '—'; }
}

export default function AdminWorkflowConsole() {
  const [leads, setLeads] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [leadsData, logsData, nurtureData] = await Promise.all([
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.EmailLog.list('-sent_at', 200),
      base44.entities.LeadNurture.list('-created_date', 200),
    ]);
    setLeads(leadsData);
    setEmailLogs(logsData);
    setScheduled(nurtureData);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filteredLeads = leads.filter(l =>
    !search || l.email?.includes(search) || l.business_name?.toLowerCase().includes(search.toLowerCase())
  );

  const leadEmails = selectedLead
    ? emailLogs.filter(e => e.metadata?.lead_id === selectedLead.id || e.to === selectedLead.email)
    : emailLogs;

  const leadNurtures = selectedLead
    ? scheduled.filter(n => n.lead_id === selectedLead.id)
    : scheduled;

  // Stats
  const today = new Date(); today.setHours(0,0,0,0);
  const sentToday = emailLogs.filter(e => e.sent_at && new Date(e.sent_at) >= today).length;
  const activeNurtures = scheduled.filter(n => n.status === 'active').length;
  const converted = leads.filter(l => l.workflow_stage === 'converted').length;

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c8ff00]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Console</h1>
          <p className="text-gray-400 text-sm mt-1">Live lead lifecycle & email delivery tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}
          className="border-gray-700 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-white' },
          { label: 'Emails Sent Today', value: sentToday, color: 'text-[#c8ff00]' },
          { label: 'Active Scheduled', value: activeNurtures, color: 'text-yellow-400' },
          { label: 'Converted', value: converted, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-800">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="bg-[#1a1a2e] border border-gray-800 mb-4">
          <TabsTrigger value="leads" className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black">
            <User className="w-4 h-4 mr-1" /> Leads ({filteredLeads.length})
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black">
            <Mail className="w-4 h-4 mr-1" /> Email Log ({leadEmails.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-[#c8ff00] data-[state=active]:text-black">
            <Clock className="w-4 h-4 mr-1" /> Scheduled ({leadNurtures.length})
          </TabsTrigger>
        </TabsList>

        {/* ── LEADS TAB ─────────────────────────────────────── */}
        <TabsContent value="leads">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search email or business..."
                className="pl-9 bg-[#1a1a2e] border-gray-700 text-white placeholder-gray-500 h-9" />
            </div>
            {selectedLead && (
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}
                className="border-gray-700 text-gray-300 text-xs">
                Clear filter
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a2e]">
                <tr>
                  {['Business', 'Email', 'Workflow Type', 'Stage', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.slice(0, 50).map((lead, i) => (
                  <tr key={lead.id}
                    onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    className={`border-t border-gray-800 cursor-pointer transition-colors ${
                      selectedLead?.id === lead.id ? 'bg-[#c8ff00]/5' : i % 2 === 0 ? 'bg-[#0a0a0f]' : 'bg-[#1a1a2e]/40'
                    } hover:bg-[#c8ff00]/5`}>
                    <td className="px-4 py-3 font-medium text-white">{lead.business_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{lead.email}</td>
                    <td className="px-4 py-3">
                      {lead.workflow_type
                        ? <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{lead.workflow_type}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.workflow_stage
                        ? <span className={`text-xs px-2 py-0.5 rounded border ${STAGE_COLORS[lead.workflow_stage] || 'bg-gray-700 text-gray-300'}`}>{lead.workflow_stage}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(lead.created_date)}</td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No leads found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {selectedLead && (
            <p className="text-xs text-[#c8ff00] mt-2 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              Filtering Email Log + Scheduled tabs by: <strong>{selectedLead.email}</strong>
            </p>
          )}
        </TabsContent>

        {/* ── EMAIL LOG TAB ─────────────────────────────────── */}
        <TabsContent value="emails">
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a2e]">
                <tr>
                  {['To', 'Template Key', 'Stage', 'Status', 'Provider ID', 'Sent At'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadEmails.slice(0, 100).map((log, i) => (
                  <tr key={log.id} className={`border-t border-gray-800 ${i % 2 === 0 ? 'bg-[#0a0a0f]' : 'bg-[#1a1a2e]/40'}`}>
                    <td className="px-4 py-3 text-gray-300 text-xs">{log.to}</td>
                    <td className="px-4 py-3">
                      {log.template_key
                        ? <code className="text-xs bg-gray-800 text-[#c8ff00] px-1.5 py-0.5 rounded">{log.template_key}</code>
                        : <span className="text-gray-600 text-xs">{log.metadata?.sequence_key || '—'}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {log.stage
                        ? <span className={`text-xs px-2 py-0.5 rounded border ${STAGE_COLORS[log.stage] || 'bg-gray-700 text-gray-300'}`}>{log.stage}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[log.status] || 'bg-gray-700 text-gray-300'}`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.provider_id || log.metadata?.resend_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(log.sent_at || log.created_date)}</td>
                  </tr>
                ))}
                {leadEmails.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No emails logged</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── SCHEDULED TAB ─────────────────────────────────── */}
        <TabsContent value="scheduled">
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a2e]">
                <tr>
                  {['Email', 'Sequence', 'Status', 'Scheduled For', 'Sent Count'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadNurtures.slice(0, 100).map((n, i) => {
                  const isOverdue = n.status === 'active' && n.next_email_date && new Date(n.next_email_date) < new Date();
                  return (
                    <tr key={n.id} className={`border-t border-gray-800 ${i % 2 === 0 ? 'bg-[#0a0a0f]' : 'bg-[#1a1a2e]/40'}`}>
                      <td className="px-4 py-3 text-gray-300 text-xs">{n.email}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{n.sequence_name}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${NURTURE_STATUS_COLORS[n.status] || 'bg-gray-700 text-gray-300'}`}>{n.status}</span>
                        {isOverdue && <span className="ml-1 text-xs text-red-400">⚠ overdue</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmt(n.next_email_date)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{n.emails_sent ?? 0}</td>
                    </tr>
                  );
                })}
                {leadNurtures.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No scheduled jobs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}