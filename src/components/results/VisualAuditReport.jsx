import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertTriangle, Zap, CheckCircle2, DollarSign, BarChart3, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  getScoreInterpretation,
  getBenchmarkComparison,
  getOpportunityEstimate,
  normalizeIssues,
  getQuickWins
} from './auditBenchmark';

const SEVERITY_STYLE = {
  high:   { dot: 'bg-red-500',    badge: 'text-red-400',    row: 'bg-red-500/10 border-red-500/30'    },
  medium: { dot: 'bg-yellow-400', badge: 'text-yellow-400', row: 'bg-yellow-500/10 border-yellow-500/30' },
  low:    { dot: 'bg-gray-500',   badge: 'text-gray-400',   row: 'bg-gray-500/10 border-gray-700/40'  }
};

function ScoreBar({ label, score, colorClass, bold = false }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={bold ? 'font-semibold text-white' : 'text-gray-400'}>{label}</span>
        <span className={`font-bold tabular-nums ${bold ? 'text-xl text-white' : 'text-gray-300'}`}>{score}</span>
      </div>
      <div className="h-3 bg-gray-800/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );
}

export default function VisualAuditReport({ lead, onContinue }) {
  const competitorRef = useRef(null);
  const competitorTracked = useRef(false);

  const score = lead?.health_score || 0;
  const scoreBand = score >= 80 ? 'high' : score >= 60 ? 'medium' : score >= 40 ? 'low' : 'critical';
  const city = lead?.address?.split(',')?.slice(-2, -1)[0]?.trim() || '';

  const interpretation = getScoreInterpretation(score);
  const benchmark = getBenchmarkComparison(score);
  const opportunity = getOpportunityEstimate(score, lead?.business_category);
  const issues = normalizeIssues(lead?.critical_issues || []);
  const quickWins = getQuickWins(lead);

  // Track: visual audit viewed
  useEffect(() => {
    base44.analytics.track({
      eventName: 'results_visual_audit_viewed',
      properties: { lead_id: lead?.id || '', score_band: scoreBand, city, industry: lead?.business_category || 'unknown' }
    });
  }, []);

  // Track: competitor section scrolled into view
  useEffect(() => {
    const el = competitorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !competitorTracked.current) {
        competitorTracked.current = true;
        base44.analytics.track({
          eventName: 'results_competitor_section_viewed',
          properties: { lead_id: lead?.id || '', score_band: scoreBand, city, industry: lead?.business_category || 'unknown' }
        });
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCTAClick = () => {
    base44.analytics.track({
      eventName: 'results_opportunity_cta_clicked',
      properties: { lead_id: lead?.id || '', score_band: scoreBand, city, industry: lead?.business_category || 'unknown' }
    });
    onContinue();
  };

  return (
    <div className="space-y-5">

      {/* ── A. Score Summary ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-6 ${interpretation.bgColor} ${interpretation.borderColor}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">GMB Profile Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-7xl font-black leading-none ${interpretation.textColor}`}>{score}</span>
              <span className="text-3xl text-gray-600 mb-2">/100</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {lead?.lead_grade && (
              <div className="text-center bg-gray-900/70 rounded-xl px-5 py-3 border border-gray-700">
                <p className="text-xs text-gray-500 mb-0.5">Grade</p>
                <p className="text-3xl font-black text-white">{lead.lead_grade}</p>
              </div>
            )}
            {lead?.lead_score != null && (
              <div className="text-center bg-gray-900/70 rounded-xl px-5 py-3 border border-gray-700">
                <p className="text-xs text-gray-500 mb-0.5">Lead Score</p>
                <p className="text-3xl font-black text-purple-400">{lead.lead_score}</p>
              </div>
            )}
            {lead?.engagement_score != null && (
              <div className="text-center bg-gray-900/70 rounded-xl px-5 py-3 border border-gray-700">
                <p className="text-xs text-gray-500 mb-0.5">Engagement</p>
                <p className="text-3xl font-black text-blue-400">{lead.engagement_score}</p>
              </div>
            )}
          </div>
        </div>

        <p className={`text-base font-bold ${interpretation.textColor}`}>{interpretation.label}</p>
      </motion.div>

      {/* ── B. Competitor Comparison ───────────────────────────── */}
      <motion.div
        ref={competitorRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">How You Compare to Your Market</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">Based on market benchmarks — not named competitors</p>

        <div className="space-y-4">
          <ScoreBar label="Your Ranking Strength" score={score} colorClass="bg-gradient-to-r from-purple-500 to-pink-500" bold />
          <ScoreBar label="Market Benchmark (avg)" score={benchmark.marketBenchmark} colorClass="bg-blue-500/70" />
          <ScoreBar label="Top Performers (est.)" score={benchmark.topPerformer} colorClass="bg-green-500/50" />
        </div>

        {benchmark.gap > 0 && (
          <div className="mt-5 flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              You're <span className="font-bold text-red-400">{benchmark.gap} points below</span> the market benchmark. Businesses above this threshold capture the majority of local search traffic in their area.
            </p>
          </div>
        )}
      </motion.div>

      {/* ── C. Revenue / Opportunity ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-amber-500/40 bg-amber-500/8 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">What This Score May Be Costing You</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">
              {opportunity.missedLeadsLow}–{opportunity.missedLeadsHigh}
            </p>
            <p className="text-xs text-gray-400 mt-1">Est. missed leads/mo</p>
          </div>
          <div className="text-center bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{opportunity.captureRate}</p>
            <p className="text-xs text-gray-400 mt-1">Your est. capture rate</p>
          </div>
          <div className="text-center bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <p className="text-lg sm:text-xl font-black text-amber-400">{opportunity.monthlySearchRange}</p>
            <p className="text-xs text-gray-400 mt-1">Monthly local searches</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic">
          * Conservative benchmark estimates only. Actual results vary by location, competition, and execution.
        </p>
      </motion.div>

      {/* ── D. Critical Issues ─────────────────────────────────── */}
      {issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Critical Issues Detected</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
              {issues.length} found
            </span>
          </div>

          <div className="space-y-2.5">
            {issues.map((issue, idx) => {
              const s = SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.medium;
              return (
                <div key={idx} className={`rounded-xl border p-4 ${s.row}`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <p className="text-white font-semibold text-sm">{issue.title}</p>
                        <span className={`text-xs font-bold capitalize ${s.badge}`}>{issue.severity}</span>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{issue.reason}</p>
                      {issue.fix && (
                        <p className="text-blue-400 text-xs mt-1.5">→ {issue.fix}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── E. Quick Wins ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-green-400" />
          <h3 className="text-base font-bold text-white">Your Quick Wins</h3>
        </div>
        <div className="space-y-3">
          {quickWins.map((win, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">{win.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{win.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── F. CTA ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-8 text-center"
      >
        <p className="text-gray-300 text-sm mb-5">
          Your report is ready — here's the fastest path to fixing it:
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            onClick={handleCTAClick}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-2xl shadow-purple-500/40 transition-all"
          >
            See Your Recommended Growth Plan
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={handleCTAClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-semibold text-base transition-all"
          >
            Book a Strategy Call
          </motion.button>
        </div>
      </motion.div>

    </div>
  );
}