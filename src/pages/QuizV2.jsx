import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ABTestProvider } from '@/components/abtest/ABTestProvider';
import { calculateHealthScore, generateCriticalIssues } from '@/components/utils/healthScoreCalculator';
import { LEAD_COSTS } from '@/components/utils/constants';
import { quizRateLimiter } from '@/components/utils/rateLimiter';
import { checkDuplicateLead, getLeadAction, mergeLeadData } from '@/components/utils/leadDeduplication';
import { errorLogger } from '@/components/utils/errorLogger';
import LegalFooter from '@/components/shared/LegalFooter';
import V2FAQSection from '@/components/quizv2/V2FAQSection';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';

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
  const [pageLoadTime] = useState(Date.now());

  // Track page view on mount
  React.useEffect(() => {
    base44.analytics.track({ eventName: 'v2_quiz_page_viewed' });
  }, []);

  // Track step changes
  React.useEffect(() => {
    if (step !== 'welcome') {
      base44.analytics.track({ 
        eventName: 'v2_quiz_step_viewed', 
        properties: { step, step_number: currentStepNumber } 
      });
    }
  }, [step, currentStepNumber]);
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
    base44.analytics.track({ eventName: 'v2_quiz_started' });
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
    
    try {
      // Use centralized health score calculator
      const healthScore = calculateHealthScore(businessData);
      
      // Calculate "Thumbtack Tax"
      const avgLeadCost = quizData.lead_source === 'scorpion' ? LEAD_COSTS.SCORPION : LEAD_COSTS.STANDARD;
      const weeklyLeads = quizData.leads_lost_weekly || 5;
      const monthlyTax = avgLeadCost * weeklyLeads * LEAD_COSTS.WEEKS_PER_MONTH;
      const yearlyTax = monthlyTax * LEAD_COSTS.MONTHS_PER_YEAR;
      
      const criticalIssues = criticalIssuesByLeadSource[quizData.lead_source] || criticalIssuesByLeadSource.other;

      const finalData = {
        ...quizData,
        ...businessData,
        health_score: healthScore,
        critical_issues: criticalIssues,
        thumbtack_tax: yearlyTax,
        business_category: 'other',
        pain_point: 'not_optimized'
      };

      setQuizData(finalData);
      setStep('processing');
      setCurrentStepNumber(4);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing business data:', error);
      errorLogger.systemError(error, {
        context: 'quiz_v2_business_search',
        business_name: businessData.business_name
      });
      setStep('processing');
      setCurrentStepNumber(4);
      setIsLoading(false);
    }
  };

  const handleProcessingComplete = useCallback(() => {
    setStep('contactInfo');
    setCurrentStepNumber(5);
  }, []);

  const handleContactInfoSubmit = async (contactData) => {
    // Rate limiting check
    if (!quizRateLimiter.canSubmit()) {
      const waitTime = quizRateLimiter.getTimeUntilAllowed();
      alert(`Please wait ${Math.ceil(waitTime / 60)} minutes before submitting again.`);
      return;
    }
    
    base44.analytics.track({ eventName: 'v2_contact_info_submitted', properties: { email: contactData.email } });
    
    const finalData = { ...quizData, ...contactData };
    setQuizData(finalData);

    // Check for duplicate leads and handle accordingly
    try {
      const duplicateCheck = await checkDuplicateLead(contactData.email);
      const leadAction = getLeadAction(duplicateCheck);
      
      const avgLeadCost = finalData.lead_source === 'scorpion' ? LEAD_COSTS.SCORPION : LEAD_COSTS.STANDARD;
      const weeklyLeads = finalData.leads_lost_weekly || 5;
      const monthlyTax = avgLeadCost * weeklyLeads * LEAD_COSTS.WEEKS_PER_MONTH;
      const yearlyTax = monthlyTax * LEAD_COSTS.MONTHS_PER_YEAR;
      
      const leadDataToSave = {
        ...finalData,
        status: 'new',
        admin_notes: `V2 Quiz - Lead Source: ${finalData.lead_source}, Weekly Leads Lost: ${weeklyLeads}, Annual Tax: $${yearlyTax}`
      };
      
      let savedLead;
      
      if (leadAction.action === 'update') {
        const mergedData = mergeLeadData(duplicateCheck.existingLead, leadDataToSave);
        savedLead = await base44.entities.Lead.update(leadAction.leadId, mergedData);
        console.log('Updated existing lead:', leadAction.reason);
      } else {
        savedLead = await base44.entities.Lead.create(leadDataToSave);
        console.log('Created new lead:', leadAction.reason);
      }
      
      quizRateLimiter.recordSubmission();
      
      base44.analytics.track({ 
        eventName: 'v2_quiz_completed', 
        properties: { 
          health_score: finalData.health_score,
          lead_source: finalData.lead_source,
          thumbtack_tax: yearlyTax,
          is_duplicate: duplicateCheck.isDuplicate,
          lead_action: leadAction.action
        } 
      });
      
      // SECURITY: Only store lead ID, not full lead object
      const { saveLeadReference, saveDisplayData } = await import('@/components/utils/secureStorage');
      saveLeadReference(savedLead.id, 'v2');
      saveDisplayData({
        healthScore: finalData.health_score,
        businessName: finalData.business_name,
        criticalIssues: finalData.critical_issues,
        thumbtackTax: yearlyTax
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      errorLogger.systemError(error, { 
        context: 'quiz_v2_lead_submission',
        email: contactData.email 
      });
    }
    
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
    base44.analytics.track({ eventName: 'v2_quiz_back_clicked', properties: { from_step: step } });
    
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

  const showBackButton = ['leadSource', 'leadsLost', 'businessSearch', 'contactInfo'].includes(step);
  const showProgress = ['leadSource', 'leadsLost', 'businessSearch', 'processing', 'contactInfo'].includes(step);

  return (
    <>
      <Helmet>
        <title>Lead-Independence Audit - Stop Paying Thumbtack & Angi | LocalRank.ai</title>
        <meta name="description" content="Free AI scan reveals how much revenue Thumbtack, HomeAdvisor, and predatory agencies are stealing. Stop renting leads. Start owning the Map Pack." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>

      <MobileOptimizations />

      <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
        {/* Background - P1 FIX: Prevent horizontal scroll */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {showBackButton ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50 min-h-[44px] touch-manipulation"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              ) : (
                <div />
              )}
              
              <div className="text-[#c8ff00] font-bold text-lg md:text-xl tracking-tight">
                LocalRank<span className="text-white">.ai</span>
              </div>
              
              <div className="w-20" />
            </div>
          </header>

          {/* Progress Bar */}
          {showProgress && (
            <div className="px-4 md:px-6">
              <ProgressBar currentStep={currentStepNumber} totalSteps={TOTAL_STEPS} />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center py-4 px-4 md:px-0">
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

                  {step === 'contactInfo' && (
                    <ContactInfoStep
                      key="contactInfo"
                      onSubmit={handleContactInfoSubmit}
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

          {/* FAQ Section - Show on welcome step */}
          {step === 'welcome' && <V2FAQSection />}
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