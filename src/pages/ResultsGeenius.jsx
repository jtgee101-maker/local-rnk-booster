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
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent foundation - Ready for optimization';
    if (score >= 60) return 'Good start - Significant improvement opportunities';
    return 'Critical opportunities - Immediate action recommended';
  };

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

          {/* Health Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 border-purple-500/50 overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div>
                    <p className="text-gray-400 mb-2 text-sm sm:text-base">GMB Health Score</p>
                    <div className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black ${getScoreColor(healthScore)}`}>
                      {healthScore}
                      <span className="text-2xl sm:text-3xl md:text-4xl">/100</span>
                    </div>
                  </div>

                  <Progress value={healthScore} className="h-3 bg-gray-800" />

                  <p className="text-lg text-gray-300">
                    {getScoreMessage(healthScore)}
                  </p>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
                    <div className="p-3 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">
                        {lead.gmb_rating || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">Average Rating</div>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">
                        {lead.gmb_reviews_count || 0}
                      </div>
                      <div className="text-xs text-gray-400">Total Reviews</div>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">
                        {lead.gmb_photos_count || 0}
                      </div>
                      <div className="text-xs text-gray-400">Photos Posted</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Critical Issues */}
          {criticalIssues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-red-900/20 via-red-800/10 to-red-900/20 border-red-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h3 className="text-xl font-bold text-white">Critical Issues Found</h3>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      {criticalIssues.length} Issues
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {criticalIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg border border-red-500/20"
                      >
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{issue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Email Confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-blue-900/20 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Full Report Sent to Your Email
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      We've sent your complete analysis to <span className="text-blue-400 font-semibold">{lead.email}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300">Check your inbox (and spam folder)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-gray-500 text-xs sm:text-sm px-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span>100% Tailored</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}