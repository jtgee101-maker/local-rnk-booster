import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, Linkedin, Building2, MapPin, AlertTriangle,
  Flame, Target, Zap, RefreshCw, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

/** Circular gauge for score visualization */
function ScoreRing({ score, label, color, description }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - ((score ?? 0) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#374151" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={score != null ? offset : circ}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score ?? '—'}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-center" style={{ color }}>{label}</p>
      <p className="text-xs text-gray-500 text-center leading-tight">{description}</p>
    </div>
  );
}

const FUNNEL_STAGES = [
  { key: 'landing',          label: 'Landing Page' },
  { key: 'quiz_started',     label: 'Quiz Started' },
  { key: 'contact_submitted',label: 'Contact Submitted' },
  { key: 'results_viewed',   label: 'Results Viewed' },
  { key: 'bridge_reached',   label: 'Bridge Page' },
  { key: 'pathway_selected', label: 'Pathway Selected' },
  { key: 'converted',        label: 'Converted' }
];

function getNextAction(lead, engScore) {
  const score = engScore?.lead_priority_score ?? lead.lead_score ?? 0;
  const pathway = lead.selected_pathway;
  if (lead.status === 'converted') return { text: 'Upsell opportunity: propose DFY upgrade or review generation campaign', urgency: 'low' };
  if ((pathway === 'dfy' || pathway === 'grant') && score >= 75) return { text: 'HOT — book advisor call immediately', urgency: 'high' };
  if ((pathway === 'dfy' || pathway === 'grant') && score >= 50) return { text: 'Send personalized follow-up with specific GMB quick wins', urgency: 'high' };
  if (!pathway && score >= 60) return { text: 'Re-engage: send bridge page revisit email with new offer', urgency: 'medium' };
  if (pathway === 'diy') return { text: 'Upsell email: highlight time savings of DFY vs DIY', urgency: 'medium' };
  if (score < 30) return { text: 'Long-term nurture: add to 30-day re-engagement sequence', urgency: 'low' };
  return { text: 'Continue nurture sequence — watch for bridge or pathway engagement', urgency: 'low' };
}

const URGENCY = {
  high:   'border-red-500/40 bg-red-500/10 text-red-300',
  medium: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  low:    'border-gray-700 bg-gray-800/30 text-gray-400'
};

export default function LeadIntelligencePanel({ lead, open, onClose }) {
  const [engScore, setEngScore]     = useState(null);
  const [events,   setEvents]       = useState([]);
  const [emailLogs, setEmailLogs]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [recalcing, setRecalcing]   = useState(false);
  const [enriching, setEnriching]   = useState(false);

  useEffect(() => {
    if (open && lead?.id) loadData();
  }, [open, lead?.id]);

  const loadData = async () => {
    setLoading(true);
    const [scoreData, eventsData, emailData] = await Promise.all([
      base44.entities.LeadEngagementScore.filter({ lead_id: lead.id }).catch(() => []),
      base44.entities.ConversionEvent.filter({ lead_id: lead.id }).catch(() => []),
      base44.entities.EmailLog.list('-created_date', 200).catch(() => [])
    ]);
    setEngScore(scoreData[0] || null);
    setEvents([...eventsData].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setEmailLogs(emailData.filter(l => l.metadata?.lead_id === lead.id));
    setLoading(false);
  };

  const handleRecalc = async () => {
    setRecalcing(true);
    const res = await base44.functions.invoke('calculateEngagementScore', { lead_id: lead.id });
    if (res.data?.success) {
      toast.success(`Priority score: ${res.data.lead_priority_score} (${res.data.grade})`);
      await loadData();
    }
    setRecalcing(false);
  };

  const handleReEnrich = async () => {
    setEnriching(true);
    const res = await base44.functions.invoke('enrichLead', { lead_id: lead.id, email: lead.email, force: true });
    if (res.data?.success !== undefined) {
      toast.success(res.data.enriched ? `Enriched: ${res.data.name || lead.email}` : 'No profile found');
      await loadData();
    }
    setEnriching(false);
  };

  if (!lead) return null;

  const profile     = lead.enrichment_data?.profile;
  const isHot       = engScore?.is_hot_lead || (lead.lead_score >= 75);
  const nextAction  = getNextAction(lead, engScore);
  const eventNames  = events.map(e => e.event_name);

  // Determine highest funnel stage reached
  const highestStageIdx = (() => {
    for (let i = FUNNEL_STAGES.length - 1; i >= 0; i--) {
      if (eventNames.includes(FUNNEL_STAGES[i].key)) return i;
    }
    return lead.email ? 2 : 0; // email in system = contact submitted
  })();

  const totalEmailOpens  = emailLogs.reduce((s, l) => s + (l.open_count || 0), 0);
  const totalEmailClicks = emailLogs.reduce((s, l) => s + (l.click_count || 0), 0);
  const hasUnsubscribed  = emailLogs.some(l => l.is_unsubscribed);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              {profile?.profile_pic_url ? (
                <img src={profile.profile_pic_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-300">
                    {(lead.business_name || lead.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base">{lead.business_name || lead.email}</span>
                  {isHot && (
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                      <Flame className="w-3 h-3 mr-1" />Hot Lead
                    </Badge>
                  )}
                  {lead.is_disposable_email && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />Disposable Email
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 font-normal">{lead.email}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-5 pb-2">
            {/* Score Gauges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#c8ff00]" />Intelligence Scores
                </h3>
                <Button size="sm" variant="ghost" onClick={handleRecalc} disabled={recalcing}
                  className="text-gray-400 hover:text-white text-xs h-7 gap-1">
                  {recalcing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Recalculate
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <ScoreRing
                  score={engScore?.business_health_score ?? lead.health_score}
                  label="Business Health" color="#6366f1" description="GMB audit quality" />
                <ScoreRing
                  score={engScore?.engagement_intent_score}
                  label="Engagement Intent" color="#c8ff00" description="Behavioral signals" />
                <ScoreRing
                  score={engScore?.lead_priority_score ?? lead.lead_score}
                  label="Lead Priority" color="#22c55e" description="Composite routing score" />
              </div>
              {engScore?.last_calculated_at && (
                <p className="text-xs text-gray-600 text-right mt-1">
                  Scored: {new Date(engScore.last_calculated_at).toLocaleString()} · algo {engScore.algorithm_version}
                </p>
              )}
            </div>

            {/* Next Best Action */}
            <div className={`p-3 rounded-xl border ${URGENCY[nextAction.urgency]}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Next Best Action</p>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{nextAction.text}</p>
              </div>
            </div>

            {/* Two-column: Enrichment + Funnel Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enrichment */}
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">Enrichment Profile</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border-0 ${
                      lead.enrichment_status === 'enriched'   ? 'bg-green-500/20 text-green-400'  :
                      lead.enrichment_status === 'not_found'  ? 'bg-yellow-500/20 text-yellow-400' :
                      lead.enrichment_status === 'failed'     ? 'bg-red-500/20 text-red-400'       :
                      'bg-gray-600/40 text-gray-400'
                    }`}>{lead.enrichment_status || 'pending'}</Badge>
                    <Button size="icon" variant="ghost" onClick={handleReEnrich} disabled={enriching}
                      className="h-6 w-6 text-gray-500 hover:text-white">
                      {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                {profile ? (
                  <div className="space-y-2 text-sm">
                    {(profile.current_title || profile.current_company) && (
                      <div className="flex items-start gap-1.5 text-gray-300">
                        <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                        <span>{[profile.current_title, profile.current_company].filter(Boolean).join(' @ ')}</span>
                      </div>
                    )}
                    {(profile.city || profile.state) && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                        <span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {lead.enrichment_data?.linkedin_url && (
                      <a href={lead.enrichment_data.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs">
                        <Linkedin className="w-3.5 h-3.5" />LinkedIn Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {profile.headline && (
                      <p className="text-xs text-gray-500 italic truncate">"{profile.headline}"</p>
                    )}
                    {profile.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {profile.skills.slice(0, 6).map(s => (
                          <Badge key={s} className="text-xs bg-gray-700/50 text-gray-400 border-0">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-2">
                    {lead.enrichment_status === 'not_found'
                      ? 'Profile not found in EnrichLayer database.'
                      : lead.enrichment_status === 'failed'
                      ? 'Enrichment failed. Check ErrorLog for 403/credit issues.'
                      : 'No enrichment data. Click refresh to enrich.'}
                  </p>
                )}
              </div>

              {/* Funnel Progress */}
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/30 space-y-3">
                <h3 className="text-sm font-semibold text-gray-300">Funnel Progress</h3>
                <div className="space-y-2">
                  {FUNNEL_STAGES.map((stage, idx) => {
                    const reached  = idx <= highestStageIdx;
                    const isCurrent = idx === highestStageIdx;
                    return (
                      <div key={stage.key} className={`flex items-center gap-2.5 text-xs ${reached ? 'text-white' : 'text-gray-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isCurrent ? 'bg-[#c8ff00] ring-2 ring-[#c8ff00]/40' :
                          reached   ? 'bg-green-500' : 'bg-gray-700'
                        }`} />
                        <span className={isCurrent ? 'font-semibold text-[#c8ff00]' : ''}>{stage.label}</span>
                        {isCurrent && <Badge className="text-xs bg-[#c8ff00]/10 text-[#c8ff00] border-0 ml-auto">Current</Badge>}
                      </div>
                    );
                  })}
                </div>
                {lead.selected_pathway && (
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-500">Pathway: </span>
                    <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {lead.selected_pathway}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Email Engagement */}
            {emailLogs.length > 0 && (
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Email Engagement <span className="text-gray-500 font-normal">({emailLogs.length} emails)</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg bg-gray-700/30">
                    <p className="text-xl font-bold text-white">{totalEmailOpens}</p>
                    <p className="text-xs text-gray-400">Total Opens</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-700/30">
                    <p className="text-xl font-bold text-[#c8ff00]">{totalEmailClicks}</p>
                    <p className="text-xs text-gray-400">Total Clicks</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-700/30">
                    <p className={`text-xl font-bold ${hasUnsubscribed ? 'text-red-400' : 'text-green-400'}`}>
                      {hasUnsubscribed ? 'Yes' : 'No'}
                    </p>
                    <p className="text-xs text-gray-400">Unsubscribed</p>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {emailLogs.slice(0, 8).map(log => (
                    <div key={log.id} className="flex items-center justify-between text-xs text-gray-400 gap-2">
                      <span className="truncate max-w-[55%]">{log.subject || log.type}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {log.open_count  > 0 && <span className="text-blue-400">{log.open_count}×</span>}
                        {log.click_count > 0 && <span className="text-[#c8ff00]">{log.click_count} click</span>}
                        <Badge className={`text-xs border-0 ${
                          log.open_count > 0 || log.status === 'opened'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700/40 text-gray-500'
                        }`}>{log.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Components Breakdown */}
            {engScore?.engagement_components && Object.keys(engScore.engagement_components).length > 0 && (
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/30">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Engagement Score Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(engScore.engagement_components).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-700/30">
                      <span className="text-gray-400 truncate">{key.replace(/_/g, ' ')}</span>
                      <span className={`font-bold ml-2 flex-shrink-0 ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {val >= 0 ? '+' : ''}{val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}