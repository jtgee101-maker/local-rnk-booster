import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider } from '@/components/abtest/ABTestProvider';
import LegalFooter from '@/components/shared/LegalFooter';

import ProgressBar from '@/components/quiz/ProgressBar';
import TransitionStep from '@/components/quiz/TransitionStep';
import BusinessSearchStep from '@/components/quiz/BusinessSearchStep';
import ProcessingStepEnhanced from '@/components/quiz/ProcessingStepEnhanced';
import DiscountUnlockStep from '@/components/quiz/DiscountUnlockStep';
import StatsCommitmentStep from '@/components/quiz/StatsCommitmentStep';
import VisualizeFutureStep from '@/components/quiz/VisualizeFutureStep';
import ContactInfoStep from '@/components/quiz/ContactInfoStep';

// V2-specific components
import V2WelcomeStep from '@/components/quizv2/V2WelcomeStep';
import V2LeadSourceStep from '@/components/quizv2/V2LeadSourceStep';
import V2LeadsLostStep from '@/components/quizv2/V2LeadsLostStep';
import V2ResultsStep from '@/components/quizv2/V2ResultsStep';

import { Target, Rocket } from 'lucide-react';

const TOTAL_STEPS = 6;

const criticalIssuesByLeadSource = {
  thumbtack: [
    'Paying $100+ per lead sold to 5 competitors - zero exclusivity',
    'No lead exclusivity - competitors get the same contact instantly',
    'Fake phone numbers and unqualified leads costing you time and money'
  ],
  homeadvisor: [
    'Leads auctioned to highest bidder - you never own the customer',
    'Hidden fees per call - real cost is 3x what they advertise',
    'Zero transparency - you have no idea who else is getting your leads'
  ],
  angi: [
    'Lead-sharing model means competing on price, not quality',
    'Customer data belongs to Angi, not you - no repeat business',
    'Forced to accept leads or lose your pro status'
  ],
  scorpion: [
    '$24,000/year contract lock-in with no ownership',
    'When you stop paying, all your rankings disappear',
    'They control your digital assets - you own nothing'
  ],
  other: [
    'Renting visibility instead of owning permanent digital equity',
    'High monthly costs with zero asset building',
    'Dependency model - stop paying, stop getting leads'
  ]
};

function QuizV2Content() {
  const [step, setStep] = useState('welcome');
  const [currentStepNumber, setCurrentStepNumber] = useState(0);
  const [quizData, setQuizData] = useState({
    lead_source: '',
    leads_lost_weekly: 0,
    business_name: '',
    email: '',
    phone: '',
    consent: false,
    health_score: 0,
    critical_issues: [],
    thumbtack_tax: 0
  });
  const [showTransition, setShowTransition] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setStep('leadSource');
    setCurrentStepNumber(1);
  };

  const handleLeadSourceSelect = (source) => {
    base44.analytics.track({ eventName: 'v2_lead_source_selected', properties: { source } });
    setQuizData(prev => ({ ...prev, lead_source: source }));
    
    setTransitionConfig({
      title: "Analyzing Your Lead Costs",
      description: "Calculating how much revenue these platforms are stealing from your business...",
      icon: Target
    });
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setStep('leadsLost');
      setCurrentStepNumber(2);
    }, 2500);
  };

  const handleLeadsLostSelect = (leadsLost) => {
    base44.analytics.track({ eventName: 'v2_leads_lost_selected', properties: { leads_lost: leadsLost } });
    setQuizData(prev => ({ ...prev, leads_lost_weekly: leadsLost }));
    
    setTransitionConfig({
      title: "Preparing Your Recovery Plan",
      description: "Building your custom lead-independence strategy. Let's find your business for real-time insights.",
      icon: Rocket
    });
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      setStep('businessSearch');
      setCurrentStepNumber(3);
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
    
    // Calculate "Thumbtack Tax"
    const avgLeadCost = quizData.lead_source === 'scorpion' ? 2000 : 100;
    const weeklyLeads = quizData.leads_lost_weekly || 5;
    const monthlyTax = avgLeadCost * weeklyLeads * 4;
    const yearlyTax = monthlyTax * 12;
    
    const criticalIssues = criticalIssuesByLeadSource[quizData.lead_source] || criticalIssuesByLeadSource.other;

    const finalData = {
      ...quizData,
      ...businessData,
      health_score: healthScore,
      critical_issues: criticalIssues,
      thumbtack_tax: yearlyTax,
      business_category: 'other', // Set a default for compatibility
      pain_point: 'not_optimized'
    };

    setQuizData(finalData);
    setStep('processing');
    setCurrentStepNumber(4);

    // Save lead
    try {
      const createdLead = await base44.entities.Lead.create({
        ...finalData,
        status: 'new',
        admin_notes: `V2 Quiz - Lead Source: ${quizData.lead_source}, Weekly Leads Lost: ${weeklyLeads}, Annual Tax: $${yearlyTax}`
      });
      
      base44.analytics.track({ 
        eventName: 'v2_quiz_completed', 
        properties: { 
          health_score: healthScore,
          lead_source: quizData.lead_source,
          thumbtack_tax: yearlyTax
        } 
      });
      
      sessionStorage.setItem('quizLead', JSON.stringify({ ...finalData, id: createdLead.id }));
      sessionStorage.setItem('quizVersion', 'v2');
    } catch (error) {
      console.error('Error saving lead:', error);
    }

    setIsLoading(false);
  };

  const handleProcessingComplete = useCallback(() => {
    setStep('contactInfo');
    setCurrentStepNumber(5);
  }, []);

  const handleContactInfoSubmit = (contactData) => {
    base44.analytics.track({ eventName: 'v2_contact_info_submitted', properties: { email: contactData.email } });
    setQuizData(prev => ({ ...prev, ...contactData }));
    setStep('discountUnlock');
  };

  const handleDiscountUnlockComplete = () => {
    setStep('statsCommitment');
  };

  const handleStatsCommitmentContinue = () => {
    setStep('visualizeFuture');
  };

  const handleVisualizeContinue = () => {
    setStep('results');
    setCurrentStepNumber(6);
  };

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'v2_results_cta_clicked' });
    window.location.href = createPageUrl('CheckoutV2');
  };

  const handleBack = () => {
    if (step === 'leadSource') {
      setStep('welcome');
      setCurrentStepNumber(0);
    } else if (step === 'leadsLost') {
      setStep('leadSource');
      setCurrentStepNumber(1);
    } else if (step === 'businessSearch') {
      setStep('leadsLost');
      setCurrentStepNumber(2);
    }
  };

  const showBackButton = ['leadSource', 'leadsLost', 'businessSearch'].includes(step);
  const showProgress = ['leadSource', 'leadsLost', 'businessSearch', 'processing'].includes(step);

  return (
    <>
      <Helmet>
        <title>Lead-Independence Audit - Stop Paying Thumbtack & Angi | LocalRank.ai</title>
        <meta name="description" content="Free AI scan reveals how much revenue Thumbtack, HomeAdvisor, and predatory agencies are stealing. Stop renting leads. Start owning the Map Pack." />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />

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
          <main className="flex-1 flex items-center justify-center py-4">
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
                    <V2WelcomeStep key="welcome" onStart={handleStart} />
                  )}
                  
                  {step === 'leadSource' && (
                    <V2LeadSourceStep key="leadSource" onSelect={handleLeadSourceSelect} />
                  )}
                  
                  {step === 'leadsLost' && (
                    <V2LeadsLostStep key="leadsLost" onSelect={handleLeadsLostSelect} />
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
                    <V2ResultsStep
                      key="results"
                      healthScore={quizData.health_score}
                      criticalIssues={quizData.critical_issues}
                      businessName={quizData.business_name}
                      thumbtackTax={quizData.thumbtack_tax}
                      leadSource={quizData.lead_source}
                      onCTA={handleCTA}
                    />
                  )}
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

export default function QuizV2Page() {
  return (
    <ABTestProvider>
      <QuizV2Content />
    </ABTestProvider>
  );
}