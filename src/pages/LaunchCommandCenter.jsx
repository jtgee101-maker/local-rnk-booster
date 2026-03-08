import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Activity, TrendingUp, Shield, Users, Zap, RefreshCw,
  CheckCircle, AlertTriangle, XCircle, Mail, Database,
  BarChart3, ArrowRight, Clock, Target, Globe, Smartphone,
  Lock, Layers, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

const RANGES = [
  { key: '24h', label: '24 hours' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
];

function Metric({ label, value, sub, trend, color = 'text-white', size = 'lg' }) {
  const TrendIcon = trend > 0 ? ChevronUp : trend < 0 ? ChevronDown : Minus;
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500';
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${color} ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>{value}</p>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-0.5">
          {trend !== undefined && (
            <span className={`flex items-center text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(Math.round(trend))}%
            </span>
          )}
          {sub && <span className="text-xs text-gray-600">{sub}</span>}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const cls = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    gray: 'bg-gray-500',
  }[status] || 'bg-gray-500';
  return <div className={`w-2 h-2 rounded-full ${cls} animate-pulse`} />;
}

function FunnelBar({ label, count, total, color = '#c8ff00' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold tabular-nums">{count.toLocaleString()} <span className="text-gray-500">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function LaunchCommandCenter() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('7d');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async (r = range) => {
    setLoading(true);
    const res = await base44.functions.invoke('launchDashboard', { range: r });
    if (res.data?.success) {
      setData(res.data);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }, [range]);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setIsAdmin(u?.role === 'admin');
        if (u?.role === 'admin') load();
      })
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => load(), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const handleRange = (r) => {
    setRange(r);
    load(r);
  };

  if (isAdmin === null) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center"><Lock className="w-10 h-10 text-red-400 mx-auto mb-3" /><p className="text-white text-lg font-semibold">Admin access required</p></div>
    </div>
  );

  const { funnel, leads, attribution, system, security } = data || {};

  const systemStatus =
    !system ? 'gray' :
    system.errors.critical > 0 || system.jobs.stuck > 3 ? 'red' :
    system.errors.high > 5 || system.jobs.failed > 10 ? 'yellow' : 'green';

  const securityStatus =
    !security ? 'gray' :
    security.active_blocks > 20 ? 'red' :
    security.active_blocks > 5 ? 'yellow' : 'green';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="w-6 h-6 text-[#c8ff00]" />
              <h1 className="text-2xl font-bold">Launch Command Center</h1>
              <Badge className="bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/30 text-xs">LIVE</Badge>
            </div>
            <p className="text-gray-500 text-sm">
              {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading metrics…'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => handleRange(r.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${range === r.key ? 'border-[#c8ff00]/50 bg-[#c8ff00]/10 text-[#c8ff00]' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
              >
                {r.label}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(p => !p)}
              className={`text-xs border-gray-700 gap-1.5 ${autoRefresh ? 'text-[#c8ff00] border-[#c8ff00]/50' : 'text-gray-400'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              {autoRefresh ? 'Auto ON' : 'Auto'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => load()}
              disabled={loading}
              className="text-xs border-gray-700 text-gray-300 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Row 1: Top KPIs ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Quiz Starts', value: funnel?.starts?.toLocaleString() ?? '—', color: 'text-[#c8ff00]' },
            { label: 'Completions', value: funnel?.completions?.toLocaleString() ?? '—', sub: funnel ? `${funnel.rates.start_to_complete}%` : '' },
            { label: 'Pathway Clicks', value: funnel?.pathways?.toLocaleString() ?? '—', sub: funnel ? `${funnel.rates.overall}% overall` : '' },
            { label: 'Leads Created', value: leads?.total?.toLocaleString() ?? '—', sub: leads ? `avg ${leads.avg_score}/100` : '', color: 'text-purple-400' },
          ].map((m, i) => (
            <Card key={i} className="bg-gray-900/60 border-gray-800">
              <CardContent className="p-4">
                <Metric label={m.label} value={loading ? '…' : (m.value ?? '—')} sub={m.sub} color={m.color} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Row 2: Funnel + Pathways ──────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#c8ff00]" />Funnel Progression</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {funnel ? (
                <>
                  <FunnelBar label="Quiz Starts" count={funnel.starts} total={funnel.starts} />
                  <FunnelBar label="Quiz Completions" count={funnel.completions} total={funnel.starts} color="#a78bfa" />
                  <FunnelBar label="Results Viewed" count={funnel.results} total={funnel.starts} color="#60a5fa" />
                  <FunnelBar label="Bridge Page" count={funnel.bridge} total={funnel.starts} color="#34d399" />
                  <FunnelBar label="Pathway Selected" count={funnel.pathways} total={funnel.starts} color="#f59e0b" />
                  <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Abandoned Quiz', value: funnel.dropoffs.abandoned_mid_quiz, color: 'text-red-400' },
                      { label: 'Lost at Results', value: funnel.dropoffs.lost_at_results, color: 'text-yellow-400' },
                      { label: 'Lost at Bridge', value: funnel.dropoffs.lost_at_bridge, color: 'text-orange-400' },
                    ].map((d, i) => (
                      <div key={i}>
                        <p className={`text-lg font-bold ${d.color}`}>{d.value}</p>
                        <p className="text-xs text-gray-600">{d.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-24 flex items-center justify-center text-gray-600 text-sm">{loading ? 'Loading…' : 'No data'}</div>}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-[#c8ff00]" />Pathway Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {funnel ? (
                <>
                  {[
                    { label: '👑 Gov Tech Grant', value: funnel.govtech, color: '#c8ff00' },
                    { label: '🛠️ Done For You', value: funnel.dfy, color: '#a78bfa' },
                    { label: '🎓 DIY Program', value: funnel.diy, color: '#60a5fa' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                      <span className="text-sm text-gray-300">{p.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: funnel.pathways > 0 ? `${Math.round((p.value / funnel.pathways) * 100)}%` : '0%', backgroundColor: p.color }} />
                        </div>
                        <span className="text-white font-semibold tabular-nums w-6 text-right">{p.value}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-800">
                    <div><p className="text-xl font-bold text-[#c8ff00]">{funnel.rates.overall}%</p><p className="text-xs text-gray-600">Overall CVR</p></div>
                    <div><p className="text-xl font-bold text-blue-400">{funnel.rates.bridge_to_pathway}%</p><p className="text-xs text-gray-600">Bridge→Pathway</p></div>
                    <div><p className="text-xl font-bold text-purple-400">{funnel.rates.start_to_complete}%</p><p className="text-xs text-gray-600">Start→Complete</p></div>
                  </div>
                </>
              ) : <div className="h-24 flex items-center justify-center text-gray-600 text-sm">{loading ? 'Loading…' : 'No data'}</div>}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Attribution ────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-[#c8ff00]" />Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {attribution?.utm_sources?.length > 0 ? attribution.utm_sources.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/40 last:border-0">
                  <span className="text-xs text-gray-300 capitalize">{s.value}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c8ff00] rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{s.count}</span>
                  </div>
                </div>
              )) : <p className="text-xs text-gray-600 text-center py-4">No data yet</p>}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#c8ff00]" />Source → Conversion</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {attribution?.conversion_by_source?.length > 0 ? attribution.conversion_by_source.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/40 last:border-0">
                  <span className="text-xs text-gray-300 capitalize">{s.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{s.starts}→{s.conversions}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${s.rate >= 5 ? 'bg-green-500/20 text-green-400 border-green-500/30' : s.rate >= 2 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {s.rate}%
                    </Badge>
                  </div>
                </div>
              )) : <p className="text-xs text-gray-600 text-center py-4">No data yet</p>}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="w-4 h-4 text-[#c8ff00]" />Devices & Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-gray-500 mb-2">Devices</p>
              {attribution?.devices?.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800/30 last:border-0 mb-1">
                  <span className="text-xs text-gray-300 capitalize">{d.value}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{d.count} <span className="text-gray-600">({d.pct}%)</span></span>
                </div>
              ))}
              {attribution?.utm_campaigns?.filter(c => c.value !== 'null' && c.value !== 'direct').length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-3 mb-1">Top Campaigns</p>
                  {attribution.utm_campaigns.filter(c => c.value !== 'null' && c.value !== 'direct').slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-400 truncate max-w-[140px]">{c.value}</span>
                      <span className="text-xs text-gray-500 tabular-nums">{c.count}</span>
                    </div>
                  ))}
                </>
              )}
              {(!attribution?.devices?.length && !attribution?.utm_campaigns?.length) && (
                <p className="text-xs text-gray-600 text-center py-4">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: System + Security + Email ─────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Card className={`bg-gray-900/60 border-gray-800 ${system?.errors?.critical > 0 ? 'border-red-500/40' : system?.jobs?.stuck > 3 ? 'border-yellow-500/40' : ''}`}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <StatusDot status={systemStatus} />
                <Activity className="w-4 h-4 text-[#c8ff00]" />System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {system ? (
                <>
                  {[
                    { label: 'Pending Jobs', value: system.jobs.pending, warn: system.jobs.pending > 20 },
                    { label: 'Failed Jobs', value: system.jobs.failed, warn: system.jobs.failed > 5 },
                    { label: 'Stuck Jobs', value: system.jobs.stuck, warn: system.jobs.stuck > 0 },
                    { label: 'Unresolved Errors', value: system.errors.unresolved, warn: system.errors.unresolved > 10 },
                    { label: 'Critical Errors', value: system.errors.critical, warn: system.errors.critical > 0 },
                    { label: 'Cache Hit Rate', value: `${system.cache.hit_rate}%`, warn: system.cache.hit_rate < 40 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className={`text-xs font-semibold tabular-nums ${item.warn ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-800/50">
                    <a href={createPageUrl('AdminJobs')} className="text-xs text-[#c8ff00]/70 hover:text-[#c8ff00] flex items-center gap-1">
                      View Jobs <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </>
              ) : <p className="text-xs text-gray-600 text-center py-4">{loading ? 'Loading…' : '—'}</p>}
            </CardContent>
          </Card>

          <Card className={`bg-gray-900/60 border-gray-800 ${security?.active_blocks > 20 ? 'border-red-500/40' : security?.active_blocks > 5 ? 'border-yellow-500/40' : ''}`}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <StatusDot status={securityStatus} />
                <Shield className="w-4 h-4 text-[#c8ff00]" />Security
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {security ? (
                <>
                  {[
                    { label: 'Active IP Blocks', value: security.active_blocks, warn: security.active_blocks > 5 },
                    { label: 'New Blocks (period)', value: security.recent_blocks, warn: security.recent_blocks > 10 },
                    { label: 'Total Block Records', value: security.total_blocks },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className={`text-xs font-semibold tabular-nums ${item.warn ? 'text-red-400' : 'text-gray-300'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 mt-1 border-t border-gray-800/50 grid grid-cols-2 gap-3 text-center">
                    <div><p className={`text-xl font-bold ${security.active_blocks > 5 ? 'text-red-400' : 'text-green-400'}`}>{security.active_blocks}</p><p className="text-xs text-gray-600">Active Blocks</p></div>
                    <div><p className="text-xl font-bold text-green-400">✓</p><p className="text-xs text-gray-600">Rate Limiter ON</p></div>
                  </div>
                </>
              ) : <p className="text-xs text-gray-600 text-center py-4">{loading ? 'Loading…' : '—'}</p>}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-[#c8ff00]" />Email Health</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {system?.email ? (
                <>
                  {[
                    { label: 'Emails Sent (period)', value: system.email.recent_sent },
                    { label: 'Delivery Failed', value: system.email.failed, warn: system.email.failed > 5 },
                    { label: 'Success Rate', value: `${system.email.success_rate}%`, warn: system.email.success_rate < 90 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className={`text-xs font-semibold tabular-nums ${item.warn ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-800/50 text-center">
                    <p className={`text-2xl font-bold ${system.email.success_rate >= 95 ? 'text-green-400' : system.email.success_rate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {system.email.success_rate}%
                    </p>
                    <p className="text-xs text-gray-600">Delivery Rate</p>
                  </div>
                </>
              ) : <p className="text-xs text-gray-600 text-center py-4">{loading ? 'Loading…' : '—'}</p>}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Recent Leads ───────────────────────────────────────────── */}
        {leads?.recent?.length > 0 && (
          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#c8ff00]" />Recent Leads</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Business', 'Email', 'Score', 'Category', 'Status', 'Time'].map(h => (
                        <th key={h} className="text-left text-gray-600 font-medium pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.recent.map((lead, i) => (
                      <tr key={i} className="border-b border-gray-800/30 last:border-0">
                        <td className="py-2 pr-4 text-white font-medium">{lead.business_name}</td>
                        <td className="py-2 pr-4 text-gray-500 font-mono">{lead.email}</td>
                        <td className="py-2 pr-4">
                          <span className={`font-bold ${lead.health_score >= 60 ? 'text-green-400' : lead.health_score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {lead.health_score}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-400 capitalize">{lead.category.replace('_', ' ')}</td>
                        <td className="py-2 pr-4">
                          <Badge className="text-xs px-1.5 py-0 bg-gray-800 border-gray-700 text-gray-400">{lead.status}</Badge>
                        </td>
                        <td className="py-2 text-gray-600">{new Date(lead.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer links */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-600">
          {[
            { label: '→ Chaos Tests', page: 'ChaosTestDashboard' },
            { label: '→ Admin Control Center', page: 'AdminControlCenter' },
            { label: '→ Job Queue', page: 'AdminJobs' },
            { label: '→ System Health', page: 'SystemHealth' },
          ].map(l => (
            <a key={l.page} href={createPageUrl(l.page)} className="hover:text-[#c8ff00] transition-colors">{l.label}</a>
          ))}
        </div>

      </div>
    </div>
  );
}