import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScoreReveal from '@/components/results/HealthScoreReveal';
import GuidedInsights from '@/components/results/GuidedInsights';
import VideoAskEmbed from '@/components/results/VideoAskEmbed';
import CaseStudiesShowcase from '@/components/results/CaseStudiesShowcase';
import UrgencyBanner from '@/components/results/UrgencyBanner';
import FinalCTA from '@/components/results/FinalCTA';
import VisualAuditReport from '@/components/results/VisualAuditReport';

export default function ResultsGeenius() {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [viewStartTime] = useState(Date.now());
  const [revealStage, setRevealStage] = useState('score'); // 'score', 'insights', 'videoask'
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('lead_id');
        
        if (!leadId) {
          window.location.href = createPageUrl('QuizGeenius');
          return;
        }

        let foundLead;
        try {
          foundLead = await base44.entities.Lead.get(leadId);
        } catch {
          foundLead = null;
        }
        if (!foundLead) {
          setError('not_found');
          setLoading(false);
          return;
        }

        setLead(foundLead);

        // Get session from behavior tracking — non-blocking
        let latestBehavior = null;
        let userSessionId = `results_${Date.now()}`;
        try {
          const behaviors = await base44.entities.UserBehavior.filter({ email: foundLead.email }, '-created_date', 5);
          latestBehavior = behaviors.length > 0 ? behaviors[0] : null;
          if (latestBehavior) userSessionId = latestBehavior.session_id;
        } catch {}
        setSessionId(userSessionId);

        // Track results view — fire and forget, never block render
        base44.entities.ConversionEvent.create({
          funnel_version: 'geenius',
          event_name: 'results_viewed',
          lead_id: leadId,
          session_id: userSessionId,
          properties: {
            business_name: foundLead.business_name,
            health_score: foundLead.health_score,
            email: foundLead.email,
            phone: foundLead.phone
          }
        }).catch(() => {});

        // Update user behavior
        if (latestBehavior) {
          await base44.entities.UserBehavior.update(latestBehavior.id, {
            pages_viewed: [...(latestBehavior.pages_viewed || []), 'ResultsGeenius'],
            interactions: [
              ...(latestBehavior.interactions || []),
              {
                type: 'results_viewed',
                timestamp: Date.now(),
                lead_id: leadId,
                health_score: foundLead.health_score
              }
            ]
          });
        }

        const trackResult = base44.analytics.track({
          eventName: 'geenius_results_viewed',
          properties: {
            lead_id: leadId,
            health_score: foundLead.health_score
          }
        });
        
        if (trackResult && typeof trackResult.catch === 'function') {
          trackResult.catch(() => {});
        }

      } catch (error) {
        console.error('ResultsGeenius init error:', error);
        setError('init_failed');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const handleContinue = async () => {
    if (!lead) return;

    const timeOnResults = Math.round((Date.now() - viewStartTime) / 1000);

    try {
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'continue_to_pathways',
        lead_id: lead.id,
        session_id: sessionId,
        properties: {
          from_results: true,
          time_on_results: timeOnResults,
          email: lead.email,
          phone: lead.phone
        }
      });

      // Update user behavior
      const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId }, '-created_date', 1);
      if (behaviors.length > 0) {
        await base44.entities.UserBehavior.update(behaviors[0].id, {
          interactions: [
            ...(behaviors[0].interactions || []),
            {
              type: 'continue_to_pathways_clicked',
              timestamp: Date.now(),
              time_on_results: timeOnResults
            }
          ]
        });
      }

      window.location.href = createPageUrl('BridgeGeenius') + `?lead_id=${lead.id}`;
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = createPageUrl('BridgeGeenius') + `?lead_id=${lead.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="relative z-10"
        >
          <Loader2 className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (!lead && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4 max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-3">We couldn't locate your audit results.</h1>
          <p className="text-gray-400 mb-8">
            {error === 'not_found'
              ? 'This audit link may have expired or the record was not found. Start a fresh audit to get your results.'
              : 'Something went wrong loading your report. Please try again.'}
          </p>
          <button
            onClick={() => window.location.href = createPageUrl('QuizGeenius')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            Start New Audit
          </button>
        </motion.div>
      </div>
    );
  }

  const healthScore = lead.health_score || 0;
  const criticalIssues = lead.critical_issues || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.15),rgba(0,0,0,0))]" />
          <div className="absolute top-0 -right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 px-4 py-8 sm:py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            {/* Premium Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white">
                  Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">GeeNius</span> Report
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-gray-300 mb-2"
              >
                {lead.business_name}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-gray-500"
              >
                {lead.address && `📍 ${lead.address}`}
              </motion.p>
            </motion.div>

            {/* Multi-Stage Reveal */}
            <AnimatePresence mode="wait">
              {revealStage === 'score' && (
                <motion.div
                  key="score"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <HealthScoreReveal
                    healthScore={healthScore}
                    onRevealComplete={() => setRevealStage('insights')}
                  />
                </motion.div>
              )}

              {revealStage === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GuidedInsights
                    healthScore={healthScore}
                    criticalIssues={criticalIssues}
                    lead={lead}
                    onComplete={() => setRevealStage('videoask')}
                  />
                </motion.div>
              )}

              {revealStage === 'videoask' && (
                <motion.div
                  key="videoask"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Urgency Banner */}
                  <UrgencyBanner healthScore={healthScore} businessName={lead.business_name} onContinue={handleContinue} />

                  {/* Visual Audit Report — conversion-focused upgrade */}
                  <VisualAuditReport lead={lead} onContinue={handleContinue} />

                  <VideoAskEmbed leadId={lead.id} />

                  {/* Case Studies */}
                  <CaseStudiesShowcase onViewPathways={handleContinue} />

                  {/* Final sticky CTA */}
                  <FinalCTA onContinue={handleContinue} healthScore={healthScore} />
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            </div>
            </div>
            );
            }