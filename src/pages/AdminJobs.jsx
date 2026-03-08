import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:    { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   icon: Clock      },
  processing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',      icon: Loader2    },
  completed:  { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  failed:     { color: 'bg-red-500/20 text-red-400 border-red-500/30',         icon: XCircle    },
};

const STATUS_TABS = ['all', 'pending', 'failed', 'completed'];

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [retrying, setRetrying] = useState(null);
  const [counts, setCounts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allJobs = await base44.entities.JobQueue.list('-created_date', 100);
      setJobs(allJobs);
      const c = {};
      STATUS_TABS.forEach(s => {
        c[s] = s === 'all' ? allJobs.length : allJobs.filter(j => j.status === s).length;
      });
      setCounts(c);
    } catch (e) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (job) => {
    setRetrying(job.id);
    try {
      await base44.functions.invoke('jobQueue/retryJob', { job_id: job.id });
      toast.success(`Job queued for retry`);
      await load();
    } catch (e) {
      toast.error(`Retry failed: ${e.message}`);
    } finally {
      setRetrying(null);
    }
  };

  const filtered = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Job Queue</h1>
            <p className="text-gray-400 text-sm mt-1">Monitor and retry background jobs</p>
          </div>
          <Button onClick={load} disabled={loading} variant="outline" className="border-gray-700 text-gray-300">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { status: 'all',       label: 'Total',      color: 'text-white'        },
            { status: 'pending',   label: 'Pending',    color: 'text-amber-400'    },
            { status: 'failed',    label: 'Failed',     color: 'text-red-400'      },
            { status: 'completed', label: 'Completed',  color: 'text-emerald-400'  },
          ].map(({ status, label, color }) => (
            <div key={status} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{counts[status] ?? '—'}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-[#00F2FF]/20 text-[#00F2FF] border border-[#00F2FF]/40'
                  : 'text-gray-400 border border-gray-800 hover:border-gray-600'
              }`}
            >
              <span className="capitalize">{s}</span>
              {counts[s] !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 border border-gray-800/50 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} jobs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(job => {
              const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={job.id}
                  className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge className={`text-xs border ${cfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {job.status}
                        </Badge>
                        <span className="text-white text-sm font-medium capitalize">{job.job_type?.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(job.created_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Attempts: {job.attempts}/{job.max_attempts}</span>
                        {job.last_attempt_at && (
                          <span>Last: {new Date(job.last_attempt_at).toLocaleString()}</span>
                        )}
                      </div>
                      {job.error_message && (
                        <p className="text-red-400 text-xs mt-1.5 truncate">
                          Error: {job.error_message}
                        </p>
                      )}
                    </div>
                    {job.status === 'failed' && job.attempts < job.max_attempts && (
                      <Button
                        size="sm"
                        onClick={() => handleRetry(job)}
                        disabled={retrying === job.id}
                        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 flex-shrink-0"
                        variant="ghost"
                      >
                        {retrying === job.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <><RotateCcw className="w-3 h-3 mr-1" /> Retry</>
                        }
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}