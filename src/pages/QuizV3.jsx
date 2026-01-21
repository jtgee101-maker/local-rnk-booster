import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Target, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider } from '@/components/abtest/ABTestProvider';
import { prefetchResources, sessionCache } from '@/components/utils/performanceHooks';
import { calculateHealthScore, generateCriticalIssues } from '@/components/utils/healthScoreCalculator';
import { quizRateLimiter } from '@/components/utils/rateLimiter';
import { REVENUE_LOSS_PER_POINT } from '@/components/utils/constants';
import { checkDuplicateLead, getLeadAction, mergeLeadData } from '@/components/utils/leadDeduplication';
import { errorLogger } from '@/components/utils/errorLogger';

// Import critical components
import ProgressBar from '@/components/quiz/ProgressBar';
import ExitIntentModal from '@/components/shared/ExitIntentModal';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import LegalFooter from '@/components/shared/LegalFooter';
import ViewersCounter from '@/components/cro/ViewersCounter';
import ScarcityBanner from '@/components/cro/ScarcityBanner';
import DeferredComponent from '@/components/optimized/DeferredComponent';
import InlineSocialProof from '@/components/cro/InlineSocialProof';
import ExitIntentV3 from '@/components/quizv3/ExitIntentV3';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import HeatmapTracker from '@/components/analytics/HeatmapTracker';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

// Lazy load step components
const CategoryStep = lazy(() => import('@/components/quiz/CategoryStep'));
const PainPointStep = lazy(() => import('@/components/quiz/PainPointStep'));
const GoalsStep = lazy(() => import('@/components/quiz/GoalsStep'));
const TransitionStep = lazy(() => import('@/components/quiz/TransitionStep'));
const TimelineStep = lazy(() => import('@/components/quiz/TimelineStep'));
const BusinessSearchStep = lazy(() => import('@/components/quiz/BusinessSearchStep'));
const ProcessingStepEnhanced = lazy(() => import('@/components/quiz/ProcessingStepEnhanced'));
const ResultsV3 = lazy(() => import('@/components/quizv3/ResultsV3'));
const ContactInfoStep = lazy(() => import('@/components/quiz/ContactInfoStep'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
  </div>
);

const TOTAL_STEPS = 7;

const criticalIssuesByPainPoint = {
  not_in_map_pack: [
    'Your business lacks geo-tagged photos, reducing local relevance',
    'Missing primary category optimization for local search',
    'Low review count compared to top 3 competitors in your area'
  ],
  low_reviews: [
    'Review velocity is 73% below industry average',
    'No review response strategy detected — hurting engagement',
    'Missing review generation funnel from existing customers'
  ],
  no_calls: [
    'Call-to-action buttons not optimized for mobile users',
    'Business description missing high-intent keywords',
    'Service area settings may be limiting your visibility'
  ],
  not_optimized: [
    'Profile completeness score below Google\'s recommended threshold',
    'Missing business attributes that competitors are using',
    'Posts and updates section inactive for 90+ days'
  ]
};

function QuizV3Content() {
  const [step, setStep] = useState(() => sessionCache.get('quizv3_step') || 'welcome');
  const [currentStepNumber, setCurrentStepNumber] = useState(() => sessionCache.get('quizv3_step_number') || 0);
  const [quizData, setQuizData] = useState(() => sessionCache.get('quizv3_data') || {
    business_category: '',
    pain_point: '',
    goals: [],
    timeline: '',
    business_name: '',
    website: '',
    email: '',
    health_score: 0,
    critical_issues: []
  });
  const [showTransition, setShowTransition] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);

  React.useEffect(() => {
    const sessionId = sessionStorage.getItem('ab_session_id') || `session_${Date.now()}`;
    sessionStorage.setItem('ab_session_id', sessionId);
    
    base44.analytics.track({ eventName: 'quizv3_page_viewed' });
    base44.entities.ConversionEvent.create({
      funnel_version: 'v3',
      event_name: 'quizv3_page_viewed',
      session_id: sessionId
    }).catch(err => console.error('Error tracking event:', err));

    // Exit intent detection
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !exitIntentShown && step !== 'welcome' && step !== 'results') {
        const hasSeenExit = sessionStorage.getItem('v3_exit_shown');
        if (!hasSeenExit) {
          setShowExitIntent(true);
          setExitIntentShown(true);
          sessionStorage.setItem('v3_exit_shown', 'true');
          base44.analytics.track({ eventName: 'quizv3_exit_intent_triggered' });
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitIntentShown, step]);

  React.useEffect(() => {
    if (step !== 'welcome') {
      const stepStartTime = Date.now();
      base44.analytics.track({ 
        eventName: 'quizv3_step_viewed', 
        properties: { step, step_number: currentStepNumber } 
      });

      return () => {
        const timeOnStep = (Date.now() - stepStartTime) / 1000;
        base44.analytics.track({ 
          eventName: 'quizv3_step_exit', 
          properties: { step, time_spent: Math.round(timeOnStep) } 
        });
      };
    }
  }, [step, currentStepNumber]);

  useEffect(() => {
    if (currentStepNumber > 2) {
      prefetchResources([createPageUrl('BridgeV3')]);
    }
  }, [currentStepNumber]);

  useEffect(() => {
    sessionCache.set('quizv3_step', step);
    sessionCache.set('quizv3_step_number', currentStepNumber);
    sessionCache.set('quizv3_data', quizData);
  }, [step, currentStepNumber, quizData]);

  const handleStart = () => {
    const sessionId = sessionStorage.getItem('ab_session_id');
    base44.analytics.track({ eventName: 'quizv3_started' });
    base44.entities.ConversionEvent.create({
      funnel_version: 'v3',
      event_name: 'quizv3_started',
      session_id: sessionId
    }).catch(err => console.error('Error tracking event:', err));
    
    setStep('category');
    setCurrentStepNumber(1);
  };

  const handleCategorySelect = (category) => {
    base44.analytics.track({ eventName: 'quizv3_category_selected', properties: { category } });
    setQuizData(prev => ({ ...prev, business_category: category }));
    setStep('painpoint');
    setCurrentStepNumber(2);
  };

  const handlePainPointSelect = (painPoint) => {
    base44.analytics.track({ eventName: 'quizv3_painpoint_selected', properties: { painPoint } });
    setQuizData(prev => ({ ...prev, pain_point: painPoint }));
    
    setTransitionConfig({
      title: "Understanding Your Challenges",
      description: "Every business has unique obstacles. We're analyzing the best strategies to help you overcome yours and dominate your local market.",
      icon: Target
    });
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setStep('goals');
      setCurrentStepNumber(3);
    }, 2500);
  };

  const handleGoalsSelect = (goals) => {
    base44.analytics.track({ eventName: 'quizv3_goals_selected', properties: { goals_count: goals.length } });
    setQuizData(prev => ({ ...prev, goals }));
    setStep('timeline');
    setCurrentStepNumber(4);
  };

  const handleTimelineSelect = (timeline) => {
    base44.analytics.track({ eventName: 'quizv3_timeline_selected', properties: { timeline } });
    setQuizData(prev => ({ ...prev, timeline }));
    
    setTransitionConfig({
      title: "Almost There!",
      description: "Based on your answers, we're preparing a custom local SEO strategy. Let's find your business on Google Maps for real-time insights.",
      icon: Rocket
    });
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setStep('businessSearch');
      setCurrentStepNumber(5);
    }, 2500);
  };

  const handleBusinessSearchSelect = async (businessData) => {
    setIsLoading(true);
    
    try {
      // Use centralized health score calculator
      const healthScore = calculateHealthScore(businessData);
      
      // Generate critical issues
      const autoIssues = generateCriticalIssues(businessData);
      const painPointIssues = criticalIssuesByPainPoint[quizData.pain_point] || criticalIssuesByPainPoint.not_optimized;
      
      const allIssues = [...autoIssues, ...painPointIssues];
      const uniqueIssues = [...new Set(allIssues)];
      const finalIssues = uniqueIssues.slice(0, 3);

      const finalData = {
        ...quizData,
        ...businessData,
        health_score: healthScore,
        critical_issues: finalIssues
      };

      setQuizData(finalData);
      setStep('processing');
      setCurrentStepNumber(6);
    } catch (error) {
      console.error('Error processing business data:', error);
      errorLogger.systemError(error, {
        context: 'quiz_v3_business_search',
        business_name: businessData.business_name
      });
      // Continue anyway with default values
      setStep('processing');
      setCurrentStepNumber(6);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessingComplete = useCallback(() => {
    setStep('contactInfo');
    setCurrentStepNumber(7);
  }, []);

  const handleContactInfoSubmit = async (contactData) => {
    base44.analytics.track({ eventName: 'quizv3_contact_info_submitted', properties: { email: contactData.email } });
    
    // Client-side rate limiting check
    if (!quizRateLimiter.canSubmit()) {
      const waitTime = quizRateLimiter.getTimeUntilAllowed();
      alert(`Please wait ${Math.ceil(waitTime / 60)} minutes before submitting again.`);
      return;
    }

    // Server-side rate limiting validation
    try {
      const rateLimitCheck = await base44.functions.invoke('validateRateLimit', { 
        email: contactData.email 
      });
      
      if (!rateLimitCheck.data.allowed) {
        alert(rateLimitCheck.data.error || 'Please wait before submitting again.');
        return;
      }
    } catch (error) {
      console.error('Rate limit validation failed:', error);
      // Continue on error to avoid blocking legitimate users
    }
    
    const finalData = { ...quizData, ...contactData };
    setQuizData(finalData);

    // Check for duplicate leads and handle accordingly
    try {
      const duplicateCheck = await checkDuplicateLead(contactData.email);
      const leadAction = getLeadAction(duplicateCheck);
      
      let savedLead;
      
      if (leadAction.action === 'update') {
        // Update existing lead
        const mergedData = mergeLeadData(duplicateCheck.existingLead, finalData);
        savedLead = await base44.entities.Lead.update(leadAction.leadId, mergedData);
        console.log('Updated existing lead:', leadAction.reason);
      } else {
        // Create new lead
        savedLead = await base44.entities.Lead.create(finalData);
        console.log('Created new lead:', leadAction.reason);
      }
      
      quizRateLimiter.recordSubmission();
      
      const sessionId = sessionStorage.getItem('ab_session_id');
      base44.analytics.track({ 
        eventName: 'quizv3_completed', 
        properties: { 
          health_score: finalData.health_score,
          business_category: finalData.business_category,
          has_gmb_data: true,
          is_duplicate: duplicateCheck.isDuplicate,
          lead_action: leadAction.action
        } 
      });
      
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_completed',
        session_id: sessionId,
        lead_id: savedLead.id,
        properties: {
          health_score: finalData.health_score,
          business_category: finalData.business_category,
          critical_issues_count: finalData.critical_issues.length,
          is_duplicate: duplicateCheck.isDuplicate
        }
      }).catch(err => console.error('Error tracking event:', err));
      
      // SECURITY: Only store lead ID, not full lead object
      const { saveLeadReference, saveDisplayData } = await import('@/components/utils/secureStorage');
      saveLeadReference(savedLead.id, 'v3');
      saveDisplayData({
        healthScore: finalData.health_score,
        businessName: finalData.business_name,
        criticalIssues: finalData.critical_issues
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      errorLogger.systemError(error, { 
        context: 'quiz_v3_lead_submission',
        email: contactData.email 
      });
    }

    setStep('results');
  };

  const handleCTA = () => {
    const sessionId = sessionStorage.getItem('ab_session_id');
    const leadData = JSON.parse(sessionStorage.getItem('quizLead') || '{}');
    
    base44.analytics.track({ eventName: 'quizv3_affiliate_cta_clicked' });
    base44.entities.ConversionEvent.create({
      funnel_version: 'v3',
      event_name: 'quizv3_affiliate_cta_clicked',
      session_id: sessionId,
      lead_id: leadData.id,
      properties: {
        health_score: quizData.health_score,
        business_name: quizData.business_name
      }
    }).catch(err => console.error('Error tracking event:', err));
    
    window.location.href = createPageUrl('BridgeV3');
  };

  const handleBack = () => {
    base44.analytics.track({ eventName: 'quizv3_back_clicked', properties: { from_step: step } });
    
    if (step === 'category') {
      setStep('welcome');
      setCurrentStepNumber(0);
    } else if (step === 'painpoint') {
      setStep('category');
      setCurrentStepNumber(1);
    } else if (step === 'goals') {
      setStep('painpoint');
      setCurrentStepNumber(2);
    } else if (step === 'timeline') {
      setStep('goals');
      setCurrentStepNumber(3);
    } else if (step === 'businessSearch') {
      setStep('timeline');
      setCurrentStepNumber(4);
    } else if (step === 'contactInfo') {
      setStep('processing');
      setCurrentStepNumber(6);
    }
  };

  const showBackButton = ['category', 'painpoint', 'goals', 'timeline', 'businessSearch', 'contactInfo'].includes(step);
  const showProgress = ['category', 'painpoint', 'goals', 'timeline', 'businessSearch', 'processing', 'contactInfo'].includes(step);

  return (
    <>
      <Helmet>
        <title>Free GMB Audit - Stop Paying Aggregator Fees | LocalRank.ai</title>
        <meta name="description" content="Discover why you're losing $15,000+ to Thumbtack & Angi. Free AI audit reveals how to get YOUR customers directly - no lead fees." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta property="og:title" content="Stop Paying $100/Lead to Aggregators - Free GMB Audit" />
        <meta property="og:description" content="Those customers were searching for YOU. Find out how to capture them directly (without Thumbtack fees)." />
      </Helmet>
      
      <MobileOptimizations />
      <MobileViewportFix />
      <HeatmapTracker pageName="QuizV3" />

      <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                {showBackButton ? (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                
                <div className="flex items-center gap-4">
                  <div className="text-[#c8ff00] font-bold text-xl tracking-tight">
                    LocalRank<span className="text-white">.ai</span>
                  </div>
                  <ViewersCounter baseCount={52} />
                </div>
                
                <div className="w-20" />
              </div>
              
              {step !== 'welcome' && step !== 'processing' && step !== 'results' && (
                <div className="flex justify-center">
                  <InlineSocialProof variant="compact" />
                </div>
              )}
            </div>
          </header>

          {showProgress && (
            <div className="px-4 md:px-6">
              <ProgressBar currentStep={currentStepNumber} totalSteps={TOTAL_STEPS} />
            </div>
          )}

          <ExitIntentModal 
            onAccept={() => {
              base44.analytics.track({ eventName: 'quizv3_exit_intent_accepted' });
              window.location.href = createPageUrl('BridgeV3');
            }}
          />

          <DeferredComponent delay={5000}>
            <ScarcityBanner spotsLeft={7} />
          </DeferredComponent>

          <main className="flex-1 flex items-center justify-center py-4 px-2 md:px-4 overflow-x-hidden">
            <AnimatePresence mode="wait">
              {showTransition ? (
                <Suspense fallback={<LoadingSpinner />}>
                  <TransitionStep 
                    key="transition"
                    title={transitionConfig.title}
                    description={transitionConfig.description}
                    icon={transitionConfig.icon}
                  />
                </Suspense>
              ) : (
                <>
                  {step === 'welcome' && (
                    <WelcomeStep key="welcome" onStart={handleStart} />
                  )}
                
                  <Suspense fallback={<LoadingSpinner />}>
                    {step === 'category' && (
                      <CategoryStep key="category" onSelect={handleCategorySelect} />
                    )}
                    
                    {step === 'painpoint' && (
                      <PainPointStep key="painpoint" onSelect={handlePainPointSelect} />
                    )}
                    
                    {step === 'goals' && (
                      <GoalsStep key="goals" onContinue={handleGoalsSelect} />
                    )}
                    
                    {step === 'timeline' && (
                      <TimelineStep key="timeline" onSelect={handleTimelineSelect} />
                    )}
                    
                    {step === 'businessSearch' && (
                      <BusinessSearchStep 
                        key="businessSearch" 
                        onSelect={handleBusinessSearchSelect}
                        isLoading={isLoading}
                      />
                    )}
                    
                    {step === 'processing' && (
                      <ProcessingStepEnhanced 
                        key="processing" 
                        onComplete={handleProcessingComplete}
                        businessName={quizData.business_name}
                      />
                    )}

                    {step === 'contactInfo' && (
                      <ContactInfoStep
                        key="contactInfo"
                        onSubmit={handleContactInfoSubmit}
                        businessName={quizData.business_name}
                      />
                    )}

                    {step === 'results' && (
                      <ResultsV3
                        key="results"
                        healthScore={quizData.health_score}
                        criticalIssues={quizData.critical_issues}
                        businessName={quizData.business_name}
                        onCTA={handleCTA}
                      />
                    )}
                  </Suspense>
                </>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {step === 'welcome' && <LegalFooter />}

      {/* Exit Intent Modal */}
      <AnimatePresence>
        {showExitIntent && (
          <ExitIntentV3
            onClose={() => setShowExitIntent(false)}
            onAccept={() => {
              if (step === 'welcome') {
                handleStart();
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function QuizV3Page() {
  return (
    <ABTestProvider>
      <QuizV3Content />
    </ABTestProvider>
  );
}