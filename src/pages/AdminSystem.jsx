import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Database,
  Mail, Zap, Activity, Shield, Clock, Server
} from 'lucide-react';

const STATUS_CONFIG = {
  ok:      { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'OK'      },
  warning: { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     label: 'Warning' },
  error:   { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         label: 'Error'   },
};

const OVERALL_CONFIG = {
  healthy:  { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: 'All Systems Healthy' },
  warning:  { color: 'text-amber-400',   bg: 'bg-amber-500/20 border-amber-500/40',     label: 'Degraded'           },
  critical: { color: 'text-red-400',     bg: 'bg-red-500/20 border-red-500/40',         label: 'Critical'           },
};

const CHECK_ICONS = {
  database:   Database,
  google_api: Zap,
  email:      Mail,
  job_queue:  Activity,
  cache:      Server,
  errors:     Shield,
};

function CheckCard({ name, check }) {
  const cfg = STATUS_CONFIG[check.status] || STATUS_CONFIG.ok;
  const Icon = cfg.icon;
  const CheckIcon = CHECK_ICONS[name] || Activity;
  return (
    <div className={`p-4 rounded-xl border ${cfg.bg} flex items-start justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <CheckIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-white font-medium text-sm capitalize">{name.replace(/_/g, ' ')}</p>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{check.detail}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold">{cfg.label}</span>
      </div>
    </div>
  );
}

export default function AdminSystem() {
  const [health, setHealth] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [healthRes, errorsRes, cacheRes] = await Promise.allSettled([
        base44.functions.invoke('system/health', {}),
        base44.entities.ErrorLog.filter({ resolved: false }, '-created_date', 20),
        base44.entities.GoogleBusinessCache.list('-cached_at', 5),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value?.data);
      if (errorsRes.status === 'fulfilled') setErrorLogs(errorsRes.value || []);
      if (cacheRes.status === 'fulfilled') {
        const entries = cacheRes.value || [];
        const now = Date.now();
        const valid = entries.filter(e => new Date(e.expires_at).getTime() > now);
        setCacheStats({ total: entries.length, valid: valid.length, expired: entries.length - valid.length });
      }
    } catch (e) {
      console.error('System health load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolveError = async (id) => {
    await base44.entities.ErrorLog.update(id, { resolved: true, resolved_date: new Date().toISOString() });
    setErrorLogs(prev => prev.filter(e => e.id !== id));
  };

  const overallCfg = OVERALL_CONFIG[health?.status] || OVERALL_CONFIG.healthy;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time platform health and error tracking</p>
          </div>
          <Button
            onClick={load}
            disabled={refreshing}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall status banner */}
        {health && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${overallCfg.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : health.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
              <span className={`text-lg font-bold ${overallCfg.color}`}>{overallCfg.label}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="text-emerald-400">{health.passed} passing</span>
              {health.warnings > 0 && <span className="text-amber-400">{health.warnings} warning</span>}
              {health.failures > 0 && <span className="text-red-400">{health.failures} failing</span>}
              <span>{health.execution_time_ms}ms</span>
            </div>
          </div>
        )}

        {/* Check cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">System Checks</h2>
          {loading ? (
            <div className="grid md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-900/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : health?.checks ? (
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(health.checks).map(([name, check]) => (
                <CheckCard key={name} name={name} check={check} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Health data unavailable</p>
          )}
        </div>

        {/* Cache stats */}
        {cacheStats !== null && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Google API Cache</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Entries', value: cacheStats.total, color: 'text-[#00F2FF]' },
                { label: 'Valid (Cached)', value: cacheStats.valid, color: 'text-emerald-400' },
                { label: 'Expired', value: cacheStats.expired, color: 'text-gray-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">Cache TTL: 24 hours per business. Reduces Google API calls by ~80% on repeat lookups.</p>
          </div>
        )}

        {/* Error logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Unresolved Errors ({errorLogs.length})</h2>
          </div>
          {errorLogs.length === 0 ? (
            <div className="text-center py-10 bg-gray-900/30 border border-gray-800/50 rounded-xl">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-400">No unresolved errors</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errorLogs.map(err => {
                const sev = err.severity || 'medium';
                const sevColor = sev === 'critical' ? 'text-red-400' : sev === 'high' ? 'text-orange-400' : 'text-amber-400';
                return (
                  <div key={err.id} className="flex items-start justify-between gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs border-gray-700 ${sevColor}`}>{sev}</Badge>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">{err.error_type}</Badge>
                        <span className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(err.created_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium truncate">{err.message}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveError(err.id)}
                      className="text-xs text-gray-500 hover:text-emerald-400 flex-shrink-0"
                    >
                      Resolve
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last updated */}
        {health?.timestamp && (
          <p className="text-xs text-gray-600 text-center">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}