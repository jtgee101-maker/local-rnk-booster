import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider, useABTest } from '@/components/abtest/ABTestProvider';

import ProgressBar from '@/components/quiz/ProgressBar';
import SectionProgress from '@/components/quiz/SectionProgress';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import CategoryStep from '@/components/quiz/CategoryStep';
import PainPointStep from '@/components/quiz/PainPointStep';
import GoalsStep from '@/components/quiz/GoalsStep';
import TransitionStep from '@/components/quiz/TransitionStep';
import TimelineStep from '@/components/quiz/TimelineStep';
import BusinessSearchStep from '@/components/quiz/BusinessSearchStep';
import ProcessingStepEnhanced from '@/components/quiz/ProcessingStepEnhanced';
import DiscountUnlockStep from '@/components/quiz/DiscountUnlockStep';
import StatsCommitmentStep from '@/components/quiz/StatsCommitmentStep';
import VisualizeFutureStep from '@/components/quiz/VisualizeFutureStep';
import ResultsStep from '@/components/quiz/ResultsStep';
import ExitIntentModal from '@/components/shared/ExitIntentModal';
import { Target, Rocket } from 'lucide-react';

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
  const [step, setStep] = useState('welcome');
  const [currentStepNumber, setCurrentStepNumber] = useState(0);
  const [quizData, setQuizData] = useState({
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

  const handleStart = () => {
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
    
    // Show transition screen
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
    
    // Show transition screen before business search
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
    
    // Calculate health score based on real GMB data
    let healthScore = 50;
    
    // Add points for rating
    if (businessData.gmb_rating >= 4.5) healthScore += 15;
    else if (businessData.gmb_rating >= 4.0) healthScore += 10;
    else if (businessData.gmb_rating >= 3.5) healthScore += 5;
    
    // Add points for reviews
    if (businessData.gmb_reviews_count >= 50) healthScore += 15;
    else if (businessData.gmb_reviews_count >= 20) healthScore += 10;
    else if (businessData.gmb_reviews_count >= 10) healthScore += 5;
    
    // Add points for photos
    if (businessData.gmb_photos_count >= 20) healthScore += 10;
    else if (businessData.gmb_photos_count >= 10) healthScore += 7;
    else if (businessData.gmb_photos_count >= 5) healthScore += 4;
    
    // Add points for having hours
    if (businessData.gmb_has_hours) healthScore += 5;
    
    // Add points for having website
    if (businessData.website) healthScore += 5;
    
    // Generate critical issues based on real data
    const criticalIssues = [];
    
    if (businessData.gmb_rating < 4.0) {
      criticalIssues.push('Your rating is below 4.0 - this is costing you 40% of potential customers');
    }
    if (businessData.gmb_reviews_count < 20) {
      criticalIssues.push(`Only ${businessData.gmb_reviews_count} reviews - competitors with 50+ reviews get 3x more clicks`);
    }
    if (businessData.gmb_photos_count < 10) {
      criticalIssues.push('Missing geo-tagged photos - businesses with 20+ photos get 42% more direction requests');
    }
    if (!businessData.gmb_has_hours) {
      criticalIssues.push('No business hours set - losing customers who search outside regular hours');
    }
    if (!businessData.website) {
      criticalIssues.push('No website listed - missing 35% of potential web traffic from Google Maps');
    }
    
    // If no critical issues, use generic ones
    if (criticalIssues.length === 0) {
      criticalIssues.push(...(criticalIssuesByPainPoint[quizData.pain_point] || criticalIssuesByPainPoint.not_optimized));
    }

    const finalData = {
      ...quizData,
      ...businessData,
      health_score: healthScore,
      critical_issues: criticalIssues.slice(0, 3)
    };

    setQuizData(finalData);
    setStep('processing');
    setCurrentStepNumber(6);

    // Save lead to database
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
      
      // Store lead with ID for later use
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

  const handleCTA = async () => {
    base44.analytics.track({ eventName: 'results_view_pricing_clicked' });
    
    // Track A/B test conversion if headline test is active
    try {
      const { trackConversion } = useABTest();
      await trackConversion('quiz', 'headline');
    } catch (e) {
      // Ignore if not in ABTest context
    }
    
    // Navigate to pricing
    window.location.href = createPageUrl('Pricing');
  };

  const handleBack = () => {
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
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
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
            
            <div className="text-[#c8ff00] font-bold text-xl tracking-tight">
              LocalRank<span className="text-white">.ai</span>
            </div>
            
            <div className="w-20" />
          </div>
        </header>

        {/* Progress Bar */}
        {showProgress && (
          <div className="px-6">
            <ProgressBar currentStep={currentStepNumber} totalSteps={TOTAL_STEPS} />
          </div>
        )}

        {/* Exit Intent Modal */}
        <ExitIntentModal 
          onAccept={() => {
            base44.analytics.track({ eventName: 'exit_intent_accepted' });
            window.location.href = createPageUrl('Pricing');
          }}
        />

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-8">
          <AnimatePresence mode="wait">
            {showTransition ? (
              <TransitionStep 
                key="transition"
                title={transitionConfig.title}
                description={transitionConfig.description}
                icon={transitionConfig.icon}
              />
            ) : (
              <>
                {step === 'welcome' && (
                  <WelcomeStep key="welcome" onStart={handleStart} />
                )}
                
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
              </>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="p-6">
          <div className="text-center text-gray-600 text-xs">
            © 2024 LocalRank.ai • Privacy Policy • Terms
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <ABTestProvider>
      <QuizContent />
    </ABTestProvider>
  );
}