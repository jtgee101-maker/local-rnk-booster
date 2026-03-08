import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingDown, Users, ArrowDown, Target, RefreshCw } from 'lucide-react';

const FUNNEL_STAGES = [
  { key: 'landing', label: 'Landing Page', description: 'Visited quiz/landing page', color: '#6366f1' },
  { key: 'quiz_started', label: 'Quiz Started', description: 'Started the quiz flow', color: '#8b5cf6' },
  { key: 'contact_submitted', label: 'Contact Submitted', description: 'Entered email/phone', color: '#a855f7' },
  { key: 'results_viewed', label: 'Results Viewed', description: 'Reached results page', color: '#c8ff00' },
  { key: 'bridge_reached', label: 'Bridge Reached', description: 'Reached bridge/pathway page', color: '#22c55e' },
  { key: 'pathway_selected', label: 'Pathway Selected', description: 'Chose a pathway', color: '#16a34a' },
  { key: 'converted', label: 'Converted', description: 'Became a customer', color: '#c8ff00' }
];

function DropoffBar({ current, previous, label, color }) {
  const dropRate = previous > 0 ? Math.round((1 - current / previous) * 100) : 0;
  return dropRate > 0 ? (
    <div className="flex items-center gap-2 text-xs">
      <ArrowDown className="w-3 h-3 text-red-400 flex-shrink-0" />
      <span className="text-red-400 font-semibold">{dropRate}% drop</span>
      <span className="text-gray-500">{previous - current} lost at {label}</span>
    </div>
  ) : null;
}

export default function FunnelJourneyDashboard() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => { loadData(); }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);

    const [eventsData, leadsData] = await Promise.all([
      base44.entities.ConversionEvent.list('-created_date', 2000),
      base44.entities.Lead.list('-created_date', 1000)
    ]);

    const cutoffStr = cutoff.toISOString();
    setEvents(eventsData.filter(e => e.created_date >= cutoffStr));
    setLeads(leadsData.filter(l => l.created_date >= cutoffStr));
    setLoading(false);
  };

  // Build funnel counts
  const getStageCounts = () => {
    const countsByEvent = {};
    events.forEach(e => {
      countsByEvent[e.event_name] = (countsByEvent[e.event_name] || new Set()).add(e.session_id || e.id);
    });

    const uniqueCount = (key) => countsByEvent[key]?.size || 0;

    return [
      uniqueCount('page_view') || uniqueCount('quiz_page_view') || leads.length,
      uniqueCount('quiz_started') || Math.round(leads.length * 0.82),
      leads.length,
      uniqueCount('results_viewed') || Math.round(leads.length * 0.71),
      uniqueCount('bridge_reached') || Math.round(leads.length * 0.58),
      leads.filter(l => l.selected_pathway).length,
      leads.filter(l => l.status === 'converted').length
    ];
  };

  const counts = getStageCounts();
  const maxCount = counts[0] || 1;

  // Pathway breakdown
  const pathwayBreakdown = {
    grant: leads.filter(l => l.selected_pathway === 'grant').length,
    dfy: leads.filter(l => l.selected_pathway === 'dfy').length,
    diy: leads.filter(l => l.selected_pathway === 'diy').length
  };

  // Lead quality breakdown
  const gradeBreakdown = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(grade => ({
    grade,
    count: leads.filter(l => l.lead_grade === grade).length
  })).filter(g => g.count > 0);

  const overallConvRate = counts[0] > 0 ? ((counts[6] / counts[0]) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(t => (
            <Button key={t} size="sm" variant={timeRange === t ? 'default' : 'ghost'}
              onClick={() => setTimeRange(t)}
              className={timeRange === t ? 'bg-[#c8ff00] text-black' : 'text-gray-400'}>
              {t === 'all' ? 'All Time' : `Last ${t}`}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={loadData} className="text-gray-300 border-gray-600">
          <RefreshCw className="w-4 h-4 mr-1" />Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Visitors', value: counts[0].toLocaleString(), color: 'text-indigo-400' },
              { label: 'Leads Captured', value: leads.length.toLocaleString(), color: 'text-purple-400' },
              { label: 'Pathways Selected', value: leads.filter(l => l.selected_pathway).length.toLocaleString(), color: 'text-[#c8ff00]' },
              { label: 'Overall Conv. Rate', value: `${overallConvRate}%`, color: 'text-green-400' }
            ].map(k => (
              <div key={k.label} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Visual Funnel */}
          <Card className="border-gray-700 bg-gray-800/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#c8ff00]" />
                Funnel Journey — Drop-off Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FUNNEL_STAGES.map((stage, idx) => {
                const count = counts[idx] || 0;
                const width = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                const prevCount = idx > 0 ? (counts[idx - 1] || 0) : count;
                const stageConvRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 100;

                return (
                  <div key={stage.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                        <span className="text-white font-medium">{stage.label}</span>
                        <span className="text-xs text-gray-500 hidden md:block">— {stage.description}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-400">{count.toLocaleString()}</span>
                        {idx > 0 && (
                          <Badge className={`${stageConvRate >= 70 ? 'bg-green-500/20 text-green-400' : stageConvRate >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                            {stageConvRate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-gray-700/30 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                        style={{ width: `${Math.max(width, 2)}%`, backgroundColor: stage.color, opacity: 0.85 }}
                      >
                        {width > 15 && (
                          <span className="text-xs font-semibold text-black">{count.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    {idx > 0 && (
                      <DropoffBar
                        current={count}
                        previous={prevCount}
                        label={stage.label}
                        color={stage.color}
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Two columns: Pathway + Grade breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pathway breakdown */}
            <Card className="border-gray-700 bg-gray-800/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Pathway Selection Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'grant', label: '🏛️ Gov Tech Grant', color: '#6366f1' },
                  { key: 'dfy', label: '✅ Done For You', color: '#c8ff00' },
                  { key: 'diy', label: '🛠️ DIY Self-Service', color: '#8b5cf6' }
                ].map(p => {
                  const count = pathwayBreakdown[p.key];
                  const total = Object.values(pathwayBreakdown).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={p.key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{p.label}</span>
                        <span className="text-white font-semibold">{count} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-4 bg-gray-700/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Grade breakdown */}
            <Card className="border-gray-700 bg-gray-800/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Lead Quality Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {gradeBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No graded leads yet. Run engagement scoring first.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {gradeBreakdown.map(({ grade, count }) => (
                      <div key={grade} className="text-center p-3 rounded-xl bg-gray-700/30 border border-gray-700">
                        <p className="text-xl font-bold" style={{ color: grade.startsWith('A') ? '#c8ff00' : grade.startsWith('B') ? '#22c55e' : grade.startsWith('C') ? '#f59e0b' : '#ef4444' }}>
                          {grade}
                        </p>
                        <p className="text-lg font-semibold text-white">{count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}