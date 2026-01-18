import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

import ProgressBar from '@/components/quiz/ProgressBar';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import CategoryStep from '@/components/quiz/CategoryStep';
import PainPointStep from '@/components/quiz/PainPointStep';
import GoalsStep from '@/components/quiz/GoalsStep';
import TransitionStep from '@/components/quiz/TransitionStep';
import TimelineStep from '@/components/quiz/TimelineStep';
import BusinessInfoStep from '@/components/quiz/BusinessInfoStep';
import ProcessingStep from '@/components/quiz/ProcessingStep';
import ResultsStep from '@/components/quiz/ResultsStep';
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

export default function QuizPage() {
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
    setQuizData(prev => ({ ...prev, business_category: category }));
    setStep('painpoint');
    setCurrentStepNumber(2);
  };

  const handlePainPointSelect = (painPoint) => {
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
    setQuizData(prev => ({ ...prev, goals }));
    setStep('timeline');
    setCurrentStepNumber(4);
  };

  const handleTimelineSelect = (timeline) => {
    setQuizData(prev => ({ ...prev, timeline }));
    
    // Show transition screen before business info
    setTransitionConfig({
      title: "Almost There!",
      description: "Based on your answers, we're preparing a custom local SEO strategy. Just need a few details to run your personalized audit.",
      icon: Rocket
    });
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setStep('businessinfo');
      setCurrentStepNumber(5);
    }, 2500);
  };

  const handleBusinessInfoSubmit = async (info) => {
    setIsLoading(true);
    
    // Generate a "random" score between 54-72 to feel custom
    const healthScore = Math.floor(Math.random() * 19) + 54;
    const criticalIssues = criticalIssuesByPainPoint[quizData.pain_point] || criticalIssuesByPainPoint.not_optimized;

    const finalData = {
      ...quizData,
      ...info,
      health_score: healthScore,
      critical_issues: criticalIssues
    };

    setQuizData(finalData);
    setStep('processing');
    setCurrentStepNumber(6);

    // Save lead to database
    try {
      await base44.entities.Lead.create(finalData);
    } catch (error) {
      console.error('Error saving lead:', error);
    }

    setIsLoading(false);
  };

  const handleProcessingComplete = useCallback(() => {
    setStep('results');
  }, []);

  const handleCTA = () => {
    // Store lead data for checkout page
    sessionStorage.setItem('quizLead', JSON.stringify(quizData));
    
    // Navigate to checkout
    window.location.href = createPageUrl('Checkout');
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
    } else if (step === 'businessinfo') {
      setStep('timeline');
      setCurrentStepNumber(4);
    }
  };

  const showBackButton = ['category', 'painpoint', 'goals', 'timeline', 'businessinfo'].includes(step);
  const showProgress = ['category', 'painpoint', 'goals', 'timeline', 'businessinfo', 'processing'].includes(step);

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
                
                {step === 'businessinfo' && (
                  <BusinessInfoStep 
                    key="businessinfo" 
                    onSubmit={handleBusinessInfoSubmit}
                    isLoading={isLoading}
                  />
                )}
                
                {step === 'processing' && (
                  <ProcessingStep 
                    key="processing" 
                    onComplete={handleProcessingComplete}
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