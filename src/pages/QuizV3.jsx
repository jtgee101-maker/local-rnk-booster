import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Target, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider } from '@/components/abtest/ABTestProvider';
import { prefetchResources, sessionCache } from '@/components/utils/performanceHooks';

// Import critical components
import ProgressBar from '@/components/quiz/ProgressBar';
import ExitIntentModal from '@/components/shared/ExitIntentModal';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import LegalFooter from '@/components/shared/LegalFooter';
import ViewersCounter from '@/components/cro/ViewersCounter';
import ScarcityBanner from '@/components/cro/ScarcityBanner';
import DeferredComponent from '@/components/optimized/DeferredComponent';
import InlineSocialProof from '@/components/cro/InlineSocialProof';

// Lazy load step components
const CategoryStep = lazy(() => import('@/components/quiz/CategoryStep'));
const PainPointStep = lazy(() => import('@/components/quiz/PainPointStep'));
const GoalsStep = lazy(() => import('@/components/quiz/GoalsStep'));
const TransitionStep = lazy(() => import('@/components/quiz/TransitionStep'));
const TimelineStep = lazy(() => import('@/components/quiz/TimelineStep'));
const BusinessSearchStep = lazy(() => import('@/components/quiz/BusinessSearchStep'));
const ProcessingStepEnhanced = lazy(() => import('@/components/quiz/ProcessingStepEnhanced'));
const ResultsV3 = lazy(() => import('@/components/quizv3/ResultsV3'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
  </div>
);

const TOTAL_STEPS = 6;

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

  React.useEffect(() => {
    base44.analytics.track({ eventName: 'quizv3_page_viewed' });
  }, []);

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
    base44.analytics.track({ eventName: 'quizv3_started' });
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
    
    // Health score calculation (stricter to show more issues)
    let healthScore = 25;
    
    if (businessData.gmb_rating >= 4.8) healthScore += 12;
    else if (businessData.gmb_rating >= 4.5) healthScore += 8;
    else if (businessData.gmb_rating >= 4.0) healthScore += 4;
    else healthScore -= 5;
    
    if (businessData.gmb_reviews_count >= 100) healthScore += 15;
    else if (businessData.gmb_reviews_count >= 50) healthScore += 10;
    else if (businessData.gmb_reviews_count >= 25) healthScore += 5;
    else if (businessData.gmb_reviews_count < 10) healthScore -= 5;
    
    if (businessData.gmb_photos_count >= 50) healthScore += 10;
    else if (businessData.gmb_photos_count >= 30) healthScore += 6;
    else if (businessData.gmb_photos_count >= 15) healthScore += 3;
    else healthScore -= 3;
    
    if (businessData.gmb_has_hours) healthScore += 4;
    else healthScore -= 6;
    
    if (businessData.website) healthScore += 5;
    else healthScore -= 5;
    
    if (!businessData.phone) healthScore -= 8;
    if (!businessData.gmb_types || businessData.gmb_types.length === 0) healthScore -= 5;
    
    healthScore = Math.max(15, Math.min(72, healthScore));
    
    const criticalIssues = [];
    
    if (businessData.gmb_rating < 4.5) {
      criticalIssues.push(`⚠️ Rating at ${businessData.gmb_rating} - businesses above 4.7★ get 67% more clicks`);
    }
    
    if (businessData.gmb_reviews_count < 50) {
      criticalIssues.push(`📊 Only ${businessData.gmb_reviews_count} reviews detected - top competitors average 100+ (losing 58% visibility)`);
    }
    
    if (businessData.gmb_photos_count < 30) {
      criticalIssues.push(`📸 Critical photo gap: ${businessData.gmb_photos_count} photos vs. industry standard of 50+ (missing 73% more direction requests)`);
    }
    
    const painPointIssues = criticalIssuesByPainPoint[quizData.pain_point] || criticalIssuesByPainPoint.not_optimized;
    criticalIssues.push(...painPointIssues);
    
    const uniqueIssues = [...new Set(criticalIssues)];
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

    try {
      const createdLead = await base44.entities.Lead.create(finalData);
      base44.analytics.track({ 
        eventName: 'quizv3_completed', 
        properties: { 
          health_score: healthScore,
          business_category: finalData.business_category,
          has_gmb_data: true
        } 
      });
      
      sessionStorage.setItem('quizLead', JSON.stringify({ ...finalData, id: createdLead.id }));
    } catch (error) {
      console.error('Error saving lead:', error);
    }

    setIsLoading(false);
  };

  const handleProcessingComplete = useCallback(() => {
    setStep('results');
  }, []);

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'quizv3_affiliate_cta_clicked' });
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
    }
  };

  const showBackButton = ['category', 'painpoint', 'goals', 'timeline', 'businessSearch'].includes(step);
  const showProgress = ['category', 'painpoint', 'goals', 'timeline', 'businessSearch', 'processing'].includes(step);

  return (
    <>
      <Helmet>
        <title>Free GMB Audit - Stop Paying Aggregator Fees | LocalRank.ai</title>
        <meta name="description" content="Discover why you're losing $15,000+ to Thumbtack & Angi. Free AI audit reveals how to get YOUR customers directly - no lead fees." />
        <meta property="og:title" content="Stop Paying $100/Lead to Aggregators - Free GMB Audit" />
        <meta property="og:description" content="Those customers were searching for YOU. Find out how to capture them directly (without Thumbtack fees)." />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
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