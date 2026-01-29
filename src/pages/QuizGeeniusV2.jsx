import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import GeeniusErrorBoundary from '@/components/geenius/GeeniusErrorBoundary';
import CookieConsentTracker from '@/components/tracking/CookieConsentTracker';

// Import quiz step components (same as V1)
import CategoryStep from '@/components/quiz/CategoryStep';
import PainPointStep from '@/components/quiz/PainPointStep';
import GoalsStep from '@/components/quiz/GoalsStep';
import TimelineStep from '@/components/quiz/TimelineStep';
import BusinessSearchStep from '@/components/quiz/BusinessSearchStep';
import ContactInfoStep from '@/components/quiz/ContactInfoStep';
import ProcessingStepEnhanced from '@/components/quiz/ProcessingStepEnhanced';
import { Loader2 } from 'lucide-react';

// Import Foxy V2 components
import FoxyHealthScore from '@/components/foxyv2/FoxyHealthScore';
import RevenueLeakCalculator from '@/components/foxyv2/RevenueLeakCalculator';
import GeoHeatmapDisplay from '@/components/foxyv2/GeoHeatmapDisplay';
import AIVisibilityReport from '@/components/foxyv2/AIVisibilityReport';

export default function QuizGeeniusV2() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId] = useState(`geeniusv2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [auditStage, setAuditStage] = useState(null); // null, 'health', 'revenue', 'heatmap', 'ai', 'complete'
  const [auditData, setAuditData] = useState({
    health: null,
    revenue: null,
    heatmap: null,
    ai: null
  });
  const [formData, setFormData] = useState({
    business_category: '',
    pain_point: '',
    goals: [],
    timeline: '',
    business_name: '',
    place_id: '',
    email: '',
    phone: '',
    address: '',
    gmb_rating: null,
    gmb_reviews_count: null,
    gmb_photos_count: null,
    location: null
  });

  const totalSteps = 7;

  const handleNext = async (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async (finalData) => {
    try {
      const completeData = { ...formData, ...finalData };

      // Create lead
      const lead = await base44.entities.Lead.create({
        ...completeData,
        status: 'new',
        last_quiz_date: new Date().toISOString(),
        quiz_submission_count: 1
      });

      // Start Foxy V2 Audit
      setAuditStage('health');
      await runFoxyV2Audit(lead);

    } catch (error) {
      console.error('Quiz completion error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const runFoxyV2Audit = async (lead) => {
    try {
      // Step 1: Advanced Health Score with Places API
      setAuditStage('health');
      const healthResponse = await base44.functions.invoke('geeniusv2/advancedHealthScore', {
        placeId: lead.place_id,
        gmbData: {
          displayName: lead.business_name,
          formattedAddress: lead.address,
          internationalPhoneNumber: lead.phone,
          rating: lead.gmb_rating,
          userRatingCount: lead.gmb_reviews_count,
          photos: lead.gmb_photos_count ? Array(lead.gmb_photos_count).fill({}) : [],
          types: lead.gmb_types || [],
          businessStatus: 'OPERATIONAL',
          currentOpeningHours: { openNow: lead.gmb_has_hours },
          reviews: lead.gmb_reviews || [],
          location: lead.location
        }
      });

      if (healthResponse.data?.success) {
        setAuditData(prev => ({ ...prev, health: healthResponse.data.data }));
        await new Promise(resolve => setTimeout(resolve, 1500)); // Dramatic pause
        setAuditStage('revenue');
      }

      // Step 2: Revenue Opportunity with Unified Loss Model
      const keyword = `${lead.business_category} ${lead.address?.split(',').pop()?.trim() || ''}`;
      const revenueResponse = await base44.functions.invoke('geeniusv2/revenueOpportunity', {
        keyword: keyword.trim(),
        location: lead.address,
        currentRank: healthResponse.data?.data?.overallScore < 70 ? 9 : 5,
        avgOrderValue: 350
      });

      if (revenueResponse.data?.success) {
        setAuditData(prev => ({ ...prev, revenue: revenueResponse.data.data }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAuditStage('heatmap');
      }

      // Step 3: Geo Heatmap with Proximity Analysis
      const heatmapResponse = await base44.functions.invoke('geeniusv2/geoHeatmap', {
        placeId: lead.place_id,
        businessName: lead.business_name,
        location: lead.location,
        keyword: lead.business_category,
        radiusMiles: 5
      });

      if (heatmapResponse.data?.success) {
        setAuditData(prev => ({ ...prev, heatmap: heatmapResponse.data.data }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAuditStage('ai');
      }

      // Step 4: AI Visibility & AEO Check
      const aiResponse = await base44.functions.invoke('geeniusv2/aiVisibilityCheck', {
        businessName: lead.business_name,
        location: lead.address,
        keyword: lead.business_category,
        industry: lead.business_category
      });

      if (aiResponse.data?.success) {
        setAuditData(prev => ({ ...prev, ai: aiResponse.data.data }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAuditStage('complete');
        
        // Track completion event
        base44.analytics.track({
          eventName: 'foxy_audit_complete',
          properties: {
            health_score: healthResponse.data.data.overallScore,
            monthly_opportunity: revenueResponse.data.data.monthlyOpportunity,
            visibility_score: heatmapResponse.data.data.visibilityScore,
            ai_score: aiResponse.data.data.overallScore
          }
        });
      }

    } catch (error) {
      console.error('Foxy V2 audit failed:', error);
      alert('Audit analysis failed. Please try again or contact support.');
      setAuditStage(null);
    }
  };

  const progress = auditStage ? 100 : ((currentStep + 1) / totalSteps) * 100;

  const steps = [
    <CategoryStep key="category" onNext={handleNext} onBack={handleBack} />,
    <PainPointStep key="pain" onNext={handleNext} onBack={handleBack} initialValue={formData.pain_point} />,
    <GoalsStep key="goals" onNext={handleNext} onBack={handleBack} initialValue={formData.goals} />,
    <TimelineStep key="timeline" onNext={handleNext} onBack={handleBack} initialValue={formData.timeline} />,
    <BusinessSearchStep key="business" onNext={handleNext} onBack={handleBack} initialData={formData} />,
    <ContactInfoStep key="contact" onNext={handleNext} onBack={handleBack} initialData={formData} />,
    <ProcessingStepEnhanced key="processing" formData={formData} onComplete={handleComplete} />
  ];

  return (
    <GeeniusErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

        {/* Header */}
        {!auditStage && (
          <div className="relative z-10 pt-6 sm:pt-8 pb-4 px-4">
            <div className="max-w-2xl mx-auto text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-6xl">🦊</span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                  Foxy's <span className="text-[#c8ff00]">PathFinder</span>
                </h1>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                Let Foxy sniff out exactly what's costing you customers
              </p>
            </div>

            <div className="max-w-xl mx-auto mt-4 sm:mt-6">
              <Progress value={progress} className="h-2 bg-gray-800" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>
          </div>
        )}

        <CookieConsentTracker sessionId={sessionId} onConsent={() => {}} />

        {/* Quiz or Audit Display */}
        <div className="relative z-10 px-4 pb-12 sm:pb-16">
          <div className="max-w-5xl mx-auto">
            {!auditStage ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {steps[currentStep]}
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                {/* Audit Progress Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl"
                    >
                      🦊
                    </motion.span>
                    <h2 className="text-3xl font-black text-white">
                      Foxy's <span className="text-[#c8ff00]">Deep Dive Audit</span>
                    </h2>
                  </div>
                  
                  {/* Stage Progress */}
                  <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
                    {['health', 'revenue', 'heatmap', 'ai', 'complete'].map((stage, idx) => (
                      <div key={stage} className="flex items-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{
                            scale: auditStage === stage ? 1.2 : 1,
                            opacity: ['health', 'revenue', 'heatmap', 'ai', 'complete'].indexOf(auditStage) >= idx ? 1 : 0.3
                          }}
                          className={`w-3 h-3 rounded-full ${
                            ['health', 'revenue', 'heatmap', 'ai', 'complete'].indexOf(auditStage) >= idx
                              ? 'bg-[#c8ff00]'
                              : 'bg-gray-600'
                          }`}
                        />
                        {idx < 4 && (
                          <div className={`w-12 h-0.5 ${
                            ['health', 'revenue', 'heatmap', 'ai', 'complete'].indexOf(auditStage) > idx
                              ? 'bg-[#c8ff00]'
                              : 'bg-gray-600'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {auditStage === 'health' && '🔍 Analyzing GMB health signals...'}
                    {auditStage === 'revenue' && '💰 Calculating revenue opportunities...'}
                    {auditStage === 'heatmap' && '🗺️ Mapping geographic visibility...'}
                    {auditStage === 'ai' && '🤖 Checking AI search presence...'}
                    {auditStage === 'complete' && '✅ Audit complete!'}
                  </p>
                </motion.div>

                {/* Audit Results */}
                <div className="space-y-8">
                  {auditData.health && (
                    <FoxyHealthScore
                      scoreData={auditData.health}
                      onRevealComplete={() => {}}
                    />
                  )}

                  {auditStage !== 'health' && auditData.revenue && (
                    <RevenueLeakCalculator revenueData={auditData.revenue} />
                  )}

                  {(auditStage === 'heatmap' || auditStage === 'ai' || auditStage === 'complete') && auditData.heatmap && (
                    <GeoHeatmapDisplay heatmapData={auditData.heatmap} />
                  )}

                  {(auditStage === 'ai' || auditStage === 'complete') && auditData.ai && (
                    <AIVisibilityReport aiData={auditData.ai} />
                  )}

                  {/* Final CTA */}
                  {auditStage === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="relative"
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#c8ff00] via-[#00ff88] to-[#c8ff00] rounded-2xl blur-xl opacity-50 animate-pulse" />
                      
                      <div className="relative bg-gradient-to-r from-[#c8ff00] via-[#00ff88] to-[#c8ff00] p-1 rounded-2xl">
                        <div className="bg-gray-900 rounded-xl p-8 sm:p-12 text-center">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-7xl mb-6"
                          >
                            🦊
                          </motion.div>
                          
                          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                            Foxy's Ready to <span className="text-[#c8ff00]">Fix Everything</span>
                          </h2>
                          
                          <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                              <div className="text-3xl font-black text-red-400">
                                {auditData.health?.criticalIssues?.length || 0}
                              </div>
                              <div className="text-gray-400 text-sm">Critical Issues</div>
                            </div>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                              <div className="text-3xl font-black text-orange-400">
                                ${(auditData.revenue?.monthlyOpportunity || 0).toLocaleString()}
                              </div>
                              <div className="text-gray-400 text-sm">Monthly Loss</div>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="text-3xl font-black text-yellow-400">
                                {auditData.heatmap?.weakZones || 0}
                              </div>
                              <div className="text-gray-400 text-sm">Weak Zones</div>
                            </div>
                          </div>

                          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                            I've mapped exactly where you're bleeding revenue. Let me plug these leaks with 
                            automated <span className="text-[#c8ff00] font-bold">Answer Engine Optimization</span>, 
                            weekly GMB posts, and strategic local citations.
                          </p>
                          
                          <Button
                            size="lg"
                            className="bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-black text-2xl px-16 py-8 h-auto rounded-xl shadow-2xl transform hover:scale-105 transition-all"
                          >
                            <span className="mr-3">⚡</span>
                            Fix with Foxy - $497/mo
                          </Button>
                          
                          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-gray-400 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-green-400">✓</span> Weekly GMB Posts
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-green-400">✓</span> AI Citations
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-green-400">✓</span> Review Management
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-green-400">✓</span> Location Content
                            </div>
                          </div>

                          <p className="text-gray-500 text-xs mt-6">
                            🚀 ROI guarantee: Break even in {Math.ceil(497 / ((auditData.revenue?.monthlyOpportunity || 10000) / 10))} months or your money back
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GeeniusErrorBoundary>
  );
}