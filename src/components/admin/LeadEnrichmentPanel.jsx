import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, UserX, RefreshCw, Linkedin, Mail, Building2, MapPin, Star, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  enriched: 'bg-green-500/20 text-green-400 border-green-500/30',
  not_found: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  skipped: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

function LeadEnrichRow({ lead, onEnrich }) {
  const [loading, setLoading] = useState(false);
  const data = lead.enrichment_data;
  const profile = data?.profile;

  const handleEnrich = async () => {
    setLoading(true);
    await onEnrich(lead);
    setLoading(false);
  };

  return (
    <div className="p-4 rounded-xl border border-gray-700/50 bg-gray-800/30 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {profile?.profile_pic_url ? (
            <img src={profile.profile_pic_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {profile?.full_name || lead.business_name || lead.email}
            </p>
            <p className="text-xs text-gray-400 truncate">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs border ${STATUS_COLORS[lead.enrichment_status || 'pending']}`}>
            {lead.enrichment_status || 'pending'}
          </Badge>
          {lead.is_disposable_email && (
            <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />disposable
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEnrich}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {profile && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          {profile.current_title && profile.current_company && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.current_title} @ {profile.current_company}</span>
            </div>
          )}
          {profile.headline && !profile.current_company && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Star className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{profile.headline}</span>
            </div>
          )}
          {(profile.city || profile.state) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {data?.linkedin_url && (
            <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300">
              <Linkedin className="w-3 h-3" />LinkedIn Profile
            </a>
          )}
        </div>
      )}

      {!profile && lead.enrichment_status === 'enriched' && (
        <p className="text-xs text-gray-500 italic">Profile found but no LinkedIn data.</p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-700/50">
        <span>Score: <span className="text-white font-semibold">{lead.lead_score ?? '—'}</span></span>
        <span>Grade: <span className="font-semibold" style={{ color: lead.lead_grade === 'A+' || lead.lead_grade === 'A' ? '#c8ff00' : '#9ca3af' }}>{lead.lead_grade ?? '—'}</span></span>
        {lead.selected_pathway && (
          <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
            {lead.selected_pathway}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function LeadEnrichmentPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    setLoading(true);
    const data = await base44.entities.Lead.list('-created_date', 100);
    setLeads(data);
    setLoading(false);
  };

  const enrichLead = async (lead) => {
    const res = await base44.functions.invoke('enrichLead', {
      lead_id: lead.id,
      email: lead.email,
      force: true
    });
    if (res.data?.success !== undefined) {
      toast.success(res.data.enriched ? `Enriched: ${res.data.name || lead.email}` : 'No profile found');
      await loadLeads();
    }
  };

  const enrichAllPending = async () => {
    const pending = leads.filter(l => l.enrichment_status === 'pending' || !l.enrichment_status);
    if (!pending.length) { toast.info('No pending leads to enrich'); return; }
    setEnrichingAll(true);
    for (const lead of pending.slice(0, 20)) {
      await base44.functions.invoke('enrichLead', { lead_id: lead.id, email: lead.email });
      await new Promise(r => setTimeout(r, 500));
    }
    toast.success(`Enriched ${Math.min(20, pending.length)} leads`);
    await loadLeads();
    setEnrichingAll(false);
  };

  const filtered = leads.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'enriched') return l.enrichment_status === 'enriched';
    if (filter === 'pending') return !l.enrichment_status || l.enrichment_status === 'pending';
    if (filter === 'disposable') return l.is_disposable_email;
    return true;
  });

  const stats = {
    total: leads.length,
    enriched: leads.filter(l => l.enrichment_status === 'enriched').length,
    pending: leads.filter(l => !l.enrichment_status || l.enrichment_status === 'pending').length,
    disposable: leads.filter(l => l.is_disposable_email).length
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-white' },
          { label: 'Enriched', value: stats.enriched, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Disposable Email', value: stats.disposable, color: 'text-red-400' }
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['all', 'enriched', 'pending', 'disposable'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'ghost'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-[#c8ff00] text-black' : 'text-gray-400'}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadLeads} className="text-gray-300 border-gray-600">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={enrichAllPending} disabled={enrichingAll}
            className="bg-[#c8ff00] text-black font-semibold">
            {enrichingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserCheck className="w-4 h-4 mr-1" />}
            Enrich All Pending
          </Button>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(lead => (
            <LeadEnrichRow key={lead.id} lead={lead} onEnrich={enrichLead} />
          ))}
          {!filtered.length && (
            <div className="col-span-2 text-center py-12 text-gray-500">No leads match this filter.</div>
          )}
        </div>
      )}
    </div>
  );
}