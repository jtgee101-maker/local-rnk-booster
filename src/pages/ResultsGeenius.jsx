import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Sparkles, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScoreReveal from '@/components/results/HealthScoreReveal';
import GuidedInsights from '@/components/results/GuidedInsights';
import VideoAskEmbed from '@/components/results/VideoAskEmbed';
import ResultsErrorBoundary from '@/components/results/ResultsErrorBoundary';

export default function ResultsGeenius() {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [viewStartTime] = useState(Date.now());
  const [revealStage, setRevealStage] = useState('score'); // 'score', 'insights', 'videoask'

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('lead_id');
        
        if (!leadId) {
          window.location.href = createPageUrl('QuizGeenius');
          return;
        }

        const leads = await base44.entities.Lead.filter({ id: leadId });
        if (leads.length === 0) {
          window.location.href = createPageUrl('QuizGeenius');
          return;
        }

        setLead(leads[0]);

        // Get session from behavior tracking
        const behaviors = await base44.entities.UserBehavior.filter({ 
          email: leads[0].email 
        });
        const userSessionId = behaviors.length > 0 ? behaviors[0].session_id : `results_${Date.now()}`;
        setSessionId(userSessionId);

        // Track results view
        await base44.entities.ConversionEvent.create({
          funnel_version: 'geenius',
          event_name: 'results_viewed',
          lead_id: leadId,
          session_id: userSessionId,
          properties: {
            business_name: leads[0].business_name,
            health_score: leads[0].health_score,
            email: leads[0].email,
            phone: leads[0].phone
          }
        });

        // Update user behavior
        if (behaviors.length > 0) {
          await base44.entities.UserBehavior.update(behaviors[0].id, {
            pages_viewed: [...(behaviors[0].pages_viewed || []), 'ResultsGeenius'],
            interactions: [
              ...(behaviors[0].interactions || []),
              {
                type: 'results_viewed',
                timestamp: Date.now(),
                lead_id: leadId,
                health_score: leads[0].health_score
              }
            ]
          });
        }

        await base44.analytics.track({
          eventName: 'geenius_results_viewed',
          properties: {
            lead_id: leadId,
            health_score: leads[0].health_score
          }
        });

      } catch (error) {
        console.error('Init error:', error);
        window.location.href = createPageUrl('QuizGeenius');
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
      const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
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

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4 max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Lead Not Found</h1>
          <p className="text-gray-400 mb-6">Unable to load your report. Please start the audit again.</p>
        </motion.div>
      </div>
    );
  }

  const healthScore = lead.health_score || 0;
  const criticalIssues = lead.critical_issues || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 px-4 py-8 sm:py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">GeeNius</span> Report
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-300 px-4">
              {lead.business_name}
            </p>
          </motion.div>

          {/* Stage 1: Health Score Reveal */}
          <AnimatePresence mode="wait">
            {revealStage === 'score' && (
              <motion.div key="score">
                <HealthScoreReveal
                  healthScore={healthScore}
                  onRevealComplete={() => setRevealStage('insights')}
                />
              </motion.div>
            )}

            {/* Stage 2: Guided Insights */}
            {revealStage === 'insights' && (
              <motion.div key="insights">
                <GuidedInsights
                  healthScore={healthScore}
                  criticalIssues={criticalIssues}
                  onComplete={() => setRevealStage('videoask')}
                />
              </motion.div>
            )}

            {/* Stage 3: VideoAsk Guide */}
            {revealStage === 'videoask' && (
              <motion.div key="videoask" className="space-y-8">
                <VideoAskEmbed />
                
                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-8 rounded-2xl shadow-2xl shadow-purple-500/30 group touch-manipulation w-full sm:w-auto"
                  >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                    <span className="flex-1 sm:flex-none">View Your Exclusive Pathways</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                  <p className="text-gray-500 text-xs sm:text-sm mt-4 px-4">
                    Discover 3 exclusive pathways tailored to your business
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}