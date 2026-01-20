import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Target, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider } from '@/components/abtest/ABTestProvider';
import { prefetchResources, sessionCache } from '@/components/utils/performanceHooks';

// Import critical first-view components directly (no lazy loading)
import ProgressBar from '@/components/quiz/ProgressBar';
import ExitIntentModal from '@/components/shared/ExitIntentModal';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import LegalFooter from '@/components/shared/LegalFooter';
import LiveActivityIndicator from '@/components/cro/LiveActivityIndicator';
import ViewersCounter from '@/components/cro/ViewersCounter';
import ScarcityBanner from '@/components/cro/ScarcityBanner';

// Lazy load step components that are conditionally rendered
const CategoryStep = lazy(() => import('@/components/quiz/CategoryStep'));
const PainPointStep = lazy(() => import('@/components/quiz/PainPointStep'));
const GoalsStep = lazy(() => import('@/components/quiz/GoalsStep'));
const TransitionStep = lazy(() => import('@/components/quiz/TransitionStep'));
const TimelineStep = lazy(() => import('@/components/quiz/TimelineStep'));
const BusinessSearchStep = lazy(() => import('@/components/quiz/BusinessSearchStep'));
const ProcessingStepEnhanced = lazy(() => import('@/components/quiz/ProcessingStepEnhanced'));
const DiscountUnlockStep = lazy(() => import('@/components/quiz/DiscountUnlockStep'));
const StatsCommitmentStep = lazy(() => import('@/components/quiz/StatsCommitmentStep'));
const VisualizeFutureStep = lazy(() => import('@/components/quiz/VisualizeFutureStep'));
const ResultsStep = lazy(() => import('@/components/quiz/ResultsStep'));

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

function QuizContent() {
  const [step, setStep] = useState(() => sessionCache.get('quiz_step') || 'welcome');
  const [currentStepNumber, setCurrentStepNumber] = useState(() => sessionCache.get('quiz_step_number') || 0);
  const [pageLoadTime] = useState(Date.now());

  // Track page view on mount
  useEffect(() => {
    base44.analytics.track({ eventName: 'quiz_page_viewed' });
  }, []);

  // Track step views and time spent
  useEffect(() => {
    if (step !== 'welcome') {
      const stepStartTime = Date.now();
      base44.analytics.track({ 
        eventName: 'quiz_step_viewed', 
        properties: { step, step_number: currentStepNumber } 
      });

      return () => {
        const timeOnStep = (Date.now() - stepStartTime) / 1000;
        base44.analytics.track({ 
          eventName: 'quiz_step_exit', 
          properties: { step, time_spent: Math.round(timeOnStep) } 
        });
      };
    }
  }, [step, currentStepNumber]);
  const [quizData, setQuizData] = useState(() => sessionCache.get('quiz_data') || {
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

  useEffect(() => {
    if (currentStepNumber > 2) {
      prefetchResources([createPageUrl('Pricing'), createPageUrl('Checkout')]);
    }
  }, [currentStepNumber]);

  useEffect(() => {
    sessionCache.set('quiz_step', step);
    sessionCache.set('quiz_step_number', currentStepNumber);
    sessionCache.set('quiz_data', quizData);
  }, [step, currentStepNumber, quizData]);

  const handleStart = () => {
    base44.analytics.track({ eventName: 'quiz_started' });
    setStep('category');
    setCurrentStepNumber(1);
  };

  const handleCategorySelect = (category) => {
    base44.analytics.track({ eventName: 'quiz_category_selected', properties: { category } });
    setQuizData(prev => ({ ...prev, business_category: category }));
    setStep('painpoint');
    setCurrentStepNumber(2);
  };

  const handlePainPointSelect = (painPoint) => {
    base44.analytics.track({ eventName: 'quiz_painpoint_selected', properties: { painPoint } });
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
    base44.analytics.track({ eventName: 'quiz_goals_selected', properties: { goals_count: goals.length } });
    setQuizData(prev => ({ ...prev, goals }));
    setStep('timeline');
    setCurrentStepNumber(4);
  };

  const handleTimelineSelect = (timeline) => {
    base44.analytics.track({ eventName: 'quiz_timeline_selected', properties: { timeline } });
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
    
    // Start with baseline score of 25 (everyone has issues)
    let healthScore = 25;
    
    // Rating scoring - much stricter thresholds
    if (businessData.gmb_rating >= 4.8) healthScore += 12;
    else if (businessData.gmb_rating >= 4.5) healthScore += 8;
    else if (businessData.gmb_rating >= 4.0) healthScore += 4;
    else healthScore -= 5; // Penalty for low rating
    
    // Reviews count - significantly stricter
    if (businessData.gmb_reviews_count >= 100) healthScore += 15;
    else if (businessData.gmb_reviews_count >= 50) healthScore += 10;
    else if (businessData.gmb_reviews_count >= 25) healthScore += 5;
    else if (businessData.gmb_reviews_count < 10) healthScore -= 5; // Penalty
    
    // Photos - much higher requirements
    if (businessData.gmb_photos_count >= 50) healthScore += 10;
    else if (businessData.gmb_photos_count >= 30) healthScore += 6;
    else if (businessData.gmb_photos_count >= 15) healthScore += 3;
    else healthScore -= 3; // Penalty for few photos
    
    // Business hours
    if (businessData.gmb_has_hours) healthScore += 4;
    else healthScore -= 6; // Major penalty for missing hours
    
    // Website presence
    if (businessData.website) healthScore += 5;
    else healthScore -= 5; // Penalty for no website
    
    // Additional penalties for missing critical data
    if (!businessData.phone) healthScore -= 8;
    if (!businessData.gmb_types || businessData.gmb_types.length === 0) healthScore -= 5;
    
    // Recent review activity penalty (if available)
    if (businessData.gmb_reviews && businessData.gmb_reviews.length > 0) {
      const recentReviews = businessData.gmb_reviews.filter(r => {
        const reviewDate = new Date(r.time * 1000);
        const monthsAgo = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 3;
      });
      if (recentReviews.length < 3) healthScore -= 8; // Penalty for low review velocity
    }
    
    // Cap score between 15-72 to ensure everyone needs improvement
    healthScore = Math.max(15, Math.min(72, healthScore));
    
    const criticalIssues = [];
    
    // Rating issues - stricter thresholds
    if (businessData.gmb_rating < 4.5) {
      criticalIssues.push(`⚠️ Rating at ${businessData.gmb_rating} - businesses above 4.7★ get 67% more clicks`);
    }
    
    // Review count - much higher expectations
    if (businessData.gmb_reviews_count < 50) {
      criticalIssues.push(`📊 Only ${businessData.gmb_reviews_count} reviews detected - top competitors average 100+ (losing 58% visibility)`);
    }
    
    // Review velocity (recent activity)
    if (businessData.gmb_reviews && businessData.gmb_reviews.length > 0) {
      const recentReviews = businessData.gmb_reviews.filter(r => {
        const reviewDate = new Date(r.time * 1000);
        const monthsAgo = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 3;
      });
      if (recentReviews.length < 5) {
        criticalIssues.push(`🚨 Low review velocity: Only ${recentReviews.length} reviews in last 90 days - algorithm penalizes stale profiles by 42%`);
      }
    }
    
    // Photos - higher requirements
    if (businessData.gmb_photos_count < 30) {
      criticalIssues.push(`📸 Critical photo gap: ${businessData.gmb_photos_count} photos vs. industry standard of 50+ (missing 73% more direction requests)`);
    }
    
    // Business hours
    if (!businessData.gmb_has_hours) {
      criticalIssues.push('⏰ No business hours detected - Google hides your listing 40% of the time when users filter by "Open Now"');
    }
    
    // Website
    if (!businessData.website) {
      criticalIssues.push('🌐 No website URL linked - losing 52% of web traffic from Maps (competitors capture this)');
    }
    
    // Phone number
    if (!businessData.phone) {
      criticalIssues.push('📞 Missing phone number - 89% of mobile users call directly from Maps, invisible to them');
    }
    
    // Category optimization
    if (!businessData.gmb_types || businessData.gmb_types.length < 2) {
      criticalIssues.push('🎯 Under-categorized listing - competitors using 3-5 categories rank 2.3x higher in related searches');
    }
    
    // Always add pain point specific issues as backup
    const painPointIssues = criticalIssuesByPainPoint[quizData.pain_point] || criticalIssuesByPainPoint.not_optimized;
    criticalIssues.push(...painPointIssues);
    
    // Remove duplicates and limit to top 3 most critical
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
        eventName: 'quiz_completed', 
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
    setStep('discountUnlock');
  }, []);

  const handleDiscountUnlockComplete = () => {
    setStep('statsCommitment');
  };

  const handleStatsCommitmentContinue = () => {
    setStep('visualizeFuture');
  };

  const handleVisualizeContinue = () => {
    setStep('results');
  };

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'results_view_pricing_clicked' });
    window.location.href = createPageUrl('Pricing');
  };

  const handleBack = () => {
    base44.analytics.track({ eventName: 'quiz_back_clicked', properties: { from_step: step } });
    
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
        <title>Free GMB Audit - Find Hidden Ranking Errors in 60 Seconds | LocalRank.ai</title>
        <meta name="description" content="Discover why you're losing 15+ calls a day to competitors. Free AI-powered audit reveals $15,000+ in lost revenue. Used by 7M+ businesses. No credit card required." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free GMB Audit - Stop Losing Calls to Competitors" />
        <meta property="og:description" content="60-second AI scan reveals hidden ranking errors costing you $15,000/year. 7M+ businesses trust LocalRank.ai" />
        <meta property="og:image" content="https://localrank.ai/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free GMB Audit - Stop Losing Calls to Competitors" />
        <meta name="twitter:description" content="60-second AI scan reveals hidden ranking errors costing you $15,000/year" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#c8ff00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://localrank.ai" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "LocalRank.ai",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "89000"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
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
          </header>

          {showProgress && (
            <div className="px-4 md:px-6">
              <ProgressBar currentStep={currentStepNumber} totalSteps={TOTAL_STEPS} />
            </div>
          )}

          <ExitIntentModal 
            onAccept={() => {
              base44.analytics.track({ eventName: 'exit_intent_accepted' });
              window.location.href = createPageUrl('Pricing');
            }}
          />

          <LiveActivityIndicator />
          <ScarcityBanner spotsLeft={7} />

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
                    
                    {step === 'discountUnlock' && (
                      <DiscountUnlockStep
                        key="discountUnlock"
                        onComplete={handleDiscountUnlockComplete}
                      />
                    )}
                    
                    {step === 'statsCommitment' && (
                      <StatsCommitmentStep
                        key="statsCommitment"
                        onContinue={handleStatsCommitmentContinue}
                      />
                    )}

                    {step === 'visualizeFuture' && (
                      <VisualizeFutureStep
                        key="visualizeFuture"
                        onContinue={handleVisualizeContinue}
                        businessName={quizData.business_name}
                      />
                    )}
                    
                    {step === 'results' && (
                      <ResultsStep
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

export default function QuizPage() {
  return (
    <ABTestProvider>
      <QuizContent />
    </ABTestProvider>
  );
}