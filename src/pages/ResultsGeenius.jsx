import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, AlertTriangle, TrendingUp, CheckCircle, XCircle,
  ArrowRight, Award, Loader2, Mail, Eye
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import HealthScoreReveal from '@/components/results/HealthScoreReveal';
import GuidedInsights from '@/components/results/GuidedInsights';
import VideoAskEmbed from '@/components/results/VideoAskEmbed';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!lead) return null;

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
              <motion.div key="videoask">
                <VideoAskEmbed />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}