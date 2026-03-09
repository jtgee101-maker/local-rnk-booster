import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, TrendingDown, Zap, DollarSign, Target,
  ChevronRight, BarChart2, XCircle, CheckCircle2
} from 'lucide-react';
import {
  getScoreBand, getBenchmarkData, getOpportunityEstimate,
  normalizeCriticalIssues, getQuickWins
} from './auditBenchmarks';

const SEVERITY = {
  high:   { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'High' },
  medium: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Medium' },
  low:    { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   label: 'Low' }
};

const IMPACT = {
  High:   'bg-red-500/20 text-red-300 border border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  Low:    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
};

function extractCity(address) {
  if (!address) return 'your area';
  const parts = address.split(',').map(p => p.trim());
  return parts.length >= 2 ? parts[1] : parts[0];
}

export default function VisualAuditReport({ healthScore, criticalIssues, lead, onComplete }) {
  const score = healthScore || 0;
  const scoreBand = getScoreBand(score);
  const benchmark = getBenchmarkData(score);
  const category = lead?.business_category || 'other';
  const opportunity = getOpportunityEstimate(score, category);
  const issues = normalizeCriticalIssues(criticalIssues);
  const quickWins = getQuickWins(lead);
  const city = extractCity(lead?.address);

  useEffect(() => {
    const id = lead?.id;
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius', event_name: 'results_visual_audit_viewed', lead_id: id,
      properties: { score_band: scoreBand.label, health_score: score, city, industry: category }
    }).catch(() => {});
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius', event_name: 'results_competitor_section_viewed', lead_id: id,
      properties: { health_score: score, benchmark_gap: benchmark.gap }
    }).catch(() => {});
  }, []);

  const handleCTA = () => {
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius', event_name: 'results_opportunity_cta_clicked', lead_id: lead?.id,
      properties: { score_band: scoreBand.label, city, industry: category }
    }).catch(() => {});
    onComplete();
  };

  const barItems = [
    { label: 'Your Ranking Strength', value: benchmark.yourScore, color: score >= 60 ? 'bg-yellow-500' : 'bg-red-500' },
    { label: 'Market Benchmark (Avg)', value: benchmark.benchmarkScore, color: 'bg-blue-500' },
    { label: 'Top Local Competitors (Est.)', value: benchmark.topScore, color: 'bg-green-500' }
  ];

  return (
    <div className="space-y-5 pb-8">

      {/* ── A: Score Summary ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-400" /> GMB Score Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className={`rounded-xl p-4 ${scoreBand.bgClass} border ${scoreBand.borderClass} text-center`}>
            <div className={`text-3xl font-black ${scoreBand.colorClass}`}>{score}</div>
            <div className="text-xs text-gray-400 mt-1">Health Score</div>
          </div>
          {lead?.lead_score != null && (
            <div className="rounded-xl p-4 bg-purple-500/10 border border-purple-500/30 text-center">
              <div className="text-3xl font-black text-purple-400">{Math.round(lead.lead_score)}</div>
              <div className="text-xs text-gray-400 mt-1">Lead Score</div>
            </div>
          )}
          {lead?.lead_grade && (
            <div className="rounded-xl p-4 bg-pink-500/10 border border-pink-500/30 text-center">
              <div className="text-3xl font-black text-pink-400">{lead.lead_grade}</div>
              <div className="text-xs text-gray-400 mt-1">Grade</div>
            </div>
          )}
          <div className={`rounded-xl p-4 ${scoreBand.bgClass} border ${scoreBand.borderClass} text-center flex flex-col justify-center`}>
            <div className={`text-sm font-bold ${scoreBand.colorClass}`}>{scoreBand.label}</div>
            <div className="text-xs text-gray-400 mt-1">Status</div>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${scoreBand.bgClass} border ${scoreBand.borderClass}`}>
          <p className={`font-semibold ${scoreBand.colorClass} text-sm sm:text-base`}>{scoreBand.interpretation}</p>
        </div>
      </motion.div>

      {/* ── B: Competitor Comparison ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-orange-400" /> How You Compare
        </h2>
        <p className="text-xs text-gray-500 mb-5">Industry benchmarks for {city} · Competitor data is estimate-based and clearly labeled</p>

        <div className="space-y-4">
          {barItems.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-300">{label}</span>
                <span className="text-white font-bold">{value}/100</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
                  className={`h-full ${color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>

        {(benchmark.gap > 0 || benchmark.topGap > 0) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {benchmark.gap > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-orange-400">{benchmark.gap} pts</div>
                <div className="text-xs text-gray-400">behind market avg</div>
              </div>
            )}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-400">{benchmark.topGap} pts</div>
              <div className="text-xs text-gray-400">behind top competitors</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── C: Revenue / Opportunity ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-red-950/60 to-orange-950/60 border border-red-800/40 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-red-400" /> What This May Be Costing You
        </h2>
        <p className="text-xs text-gray-500 mb-5">Conservative benchmark-based estimates · Labeled as estimates</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-red-400">{opportunity.leadsLow}–{opportunity.leadsHigh}</div>
            <div className="text-sm text-gray-300 mt-1">Missed leads / month <span className="text-xs text-gray-500">(est.)</span></div>
          </div>
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-orange-400">{opportunity.monthlySearches.toLocaleString()}+</div>
            <div className="text-sm text-gray-300 mt-1">Monthly local searches</div>
          </div>
          <div className="bg-black/30 rounded-xl p-4 text-center flex flex-col justify-center">
            <div className="text-sm font-bold text-yellow-400">{opportunity.urgencyLabel}</div>
            <div className="text-xs text-gray-400 mt-1">Impact level</div>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Businesses in the top 3 local positions capture the majority of calls and direction requests.
          At your current score, you are likely invisible for most high-intent searches in {city}.
        </p>
      </motion.div>

      {/* ── D: Critical Issues ── */}
      {issues.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Critical Issues Found
            <span className="ml-auto text-sm font-normal text-gray-400">{issues.length} detected</span>
          </h2>
          <div className="space-y-3">
            {issues.map((issue, i) => {
              const cfg = SEVERITY[issue.severity] || SEVERITY.medium;
              return (
                <div key={i} className={`rounded-xl p-4 ${cfg.bg} border ${cfg.border}`}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <XCircle className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-white font-semibold text-sm leading-snug">{issue.title}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {issue.why && <p className="text-xs text-gray-400 ml-6 mb-1">{issue.why}</p>}
                  {issue.quickFix && (
                    <p className="text-xs text-blue-400 ml-6">
                      <span className="font-semibold">Quick fix: </span>{issue.quickFix}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── E: Quick Wins ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" /> Immediate Wins Available
        </h2>
        <div className="space-y-3">
          {quickWins.map((win, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-white font-semibold text-sm">{win.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${IMPACT[win.impact]}`}>
                    {win.impact} Impact
                  </span>
                </div>
                <p className="text-xs text-gray-400">{win.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── F: CTA ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="bg-gradient-to-br from-purple-950/80 to-pink-950/80 border border-purple-800/40 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm">
        <Target className="w-10 h-10 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Ready to Fix This?</h2>
        <p className="text-gray-300 mb-6 max-w-md mx-auto text-sm sm:text-base">
          See exactly what it will take to move {lead?.business_name || 'your business'} into the top local positions and start capturing those leads.
        </p>
        <button
          onClick={handleCTA}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/40 active:scale-95 touch-manipulation mb-4"
        >
          See Your Recommended Growth Plan
          <ChevronRight className="w-5 h-5" />
        </button>
        <div>
          <button
            onClick={handleCTA}
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors underline"
          >
            Book a Strategy Call Instead
          </button>
        </div>
      </motion.div>

    </div>
  );
}