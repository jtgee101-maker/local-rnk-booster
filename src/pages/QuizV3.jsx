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
import ErrorBoundary from '@/components/ErrorBoundary';

// Import critical components
import ProgressBar from '@/components/quiz/ProgressBar';
import WelcomeStep from '@/components/quiz/WelcomeStep';
import LegalFooter from '@/components/shared/LegalFooter';
import ViewersCounter from '@/components/cro/ViewersCounter';
import ScarcityBanner from '@/components/cro/ScarcityBanner';
import DeferredComponent from '@/components/optimized/DeferredComponent';
import InlineSocialProof from '@/components/cro/InlineSocialProof';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import HeatmapTracker from '@/components/analytics/HeatmapTracker';
import MobileViewportFix from '@/components/utils/MobileViewportFix';
import CookieConsentTracker from '@/components/tracking/CookieConsentTracker';

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

  React.useEffect(() => {
    const sessionId = sessionStorage.getItem('ab_session_id') || `session_${Date.now()}`;
    sessionStorage.setItem('ab_session_id', sessionId);
    
    const urlParams = new URLSearchParams(window.location.search);
    const trafficData = {
      affiliate_code: urlParams.get('ref') || urlParams.get('aff') || urlParams.get('affiliate'),
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      referrer: document.referrer,
      landing_page: window.location.pathname,
      device_type: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      browser: navigator.userAgent
    };
    
    sessionStorage.setItem('traffic_data', JSON.stringify(trafficData));
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_page_viewed',
        properties: trafficData
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }

    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_page_viewed',
        session_id: sessionId,
        properties: trafficData
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
  }, []);

  React.useEffect(() => {
    if (step !== 'welcome') {
       const stepStartTime = Date.now();
       try {
         base44.analytics.track({ 
           eventName: 'quizv3_step_viewed', 
           properties: { step, step_number: currentStepNumber } 
         }).catch(() => {});
       } catch (e) {
         console.warn('Step view tracking failed:', e);
       }

       return () => {
         const timeOnStep = (Date.now() - stepStartTime) / 1000;
         try {
           base44.analytics.track({ 
             eventName: 'quizv3_step_exit', 
             properties: { step, time_spent: Math.round(timeOnStep) } 
           }).catch(() => {});
         } catch (e) {
           console.warn('Step exit tracking failed:', e);
         }
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
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    const timeOnPage = Date.now() - performance.timing.navigationStart;
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_started',
        properties: { 
          ...trafficData,
          time_to_start_ms: timeOnPage,
          has_affiliate: !!trafficData.affiliate_code
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }

    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_started',
        session_id: sessionId,
        properties: { 
          ...trafficData,
          time_to_start_ms: timeOnPage
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
    setStep('category');
    setCurrentStepNumber(1);
  };

  const handleCategorySelect = useCallback((category) => {
    if (step !== 'category') return;
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_category_selected', 
        properties: { 
          category,
          affiliate_code: trafficData.affiliate_code,
          utm_source: trafficData.utm_source
        } 
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    const sessionId = sessionStorage.getItem('ab_session_id');
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_category_selected',
        session_id: sessionId,
        step_number: 1,
        properties: { 
          category,
          ...trafficData
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
    setQuizData(prev => ({ ...prev, business_category: category }));
    setStep('painpoint');
    setCurrentStepNumber(2);
  }, [step]);

  const handlePainPointSelect = useCallback((painPoint) => {
    if (step !== 'painpoint') return;
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_painpoint_selected', 
        properties: { 
          painPoint,
          category: quizData.business_category,
          affiliate_code: trafficData.affiliate_code
        } 
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    const sessionId = sessionStorage.getItem('ab_session_id');
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_painpoint_selected',
        session_id: sessionId,
        step_number: 2,
        properties: { 
          painPoint,
          category: quizData.business_category,
          ...trafficData
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
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
    }, 1800);
  }, [step]);

  const handleGoalsSelect = useCallback((data) => {
    if (step !== 'goals') return;
    const goals = data.goals || [];
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_goals_selected', 
        properties: { 
          goals_count: goals.length,
          goals: goals.join(','),
          category: quizData.business_category,
          pain_point: quizData.pain_point,
          affiliate_code: trafficData.affiliate_code
        } 
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    const sessionId = sessionStorage.getItem('ab_session_id');
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_goals_selected',
        session_id: sessionId,
        step_number: 3,
        properties: { 
          goals_count: goals.length,
          goals: goals.join(','),
          category: quizData.business_category,
          pain_point: quizData.pain_point,
          ...trafficData
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
    setQuizData(prev => ({ ...prev, goals }));
    setStep('timeline');
    setCurrentStepNumber(4);
  }, [step, quizData.business_category, quizData.pain_point]);

  const handleTimelineSelect = useCallback((timeline) => {
    if (step !== 'timeline') return;
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_timeline_selected', 
        properties: { 
          timeline,
          category: quizData.business_category,
          pain_point: quizData.pain_point,
          goals_count: quizData.goals.length,
          affiliate_code: trafficData.affiliate_code
        } 
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    const sessionId = sessionStorage.getItem('ab_session_id');
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_timeline_selected',
        session_id: sessionId,
        step_number: 4,
        properties: { 
          timeline,
          category: quizData.business_category,
          pain_point: quizData.pain_point,
          goals: quizData.goals.join(','),
          ...trafficData
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
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
    }, 1800);
  }, [step]);

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
    // CRITICAL: Validate email exists and is valid
    if (!contactData.email || !contactData.email.includes('@') || contactData.email.trim().length === 0) {
      alert('Please provide a valid email address.');
      return;
    }
    
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    const sessionId = sessionStorage.getItem('ab_session_id');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_contact_info_submitted', 
        properties: { 
          email: contactData.email,
          has_phone: !!contactData.phone,
          affiliate_code: trafficData.affiliate_code,
          utm_source: trafficData.utm_source
        } 
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_contact_info_submitted',
        session_id: sessionId,
        step_number: 7,
        properties: { 
          email: contactData.email,
          has_phone: !!contactData.phone,
          ...trafficData
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
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
    
    const finalData = { 
      ...quizData, 
      ...contactData,
      // Ensure business_name exists
      business_name: quizData.business_name || contactData.business_name || 'Unknown Business',
      // Add affiliate tracking data
      affiliate_code: trafficData.affiliate_code,
      utm_source: trafficData.utm_source,
      utm_medium: trafficData.utm_medium,
      utm_campaign: trafficData.utm_campaign,
      referrer: trafficData.referrer,
      device_type: trafficData.device_type,
      landing_page: trafficData.landing_page
    };
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
      
      try {
        base44.analytics.track({ 
          eventName: 'quizv3_completed', 
          properties: { 
            health_score: finalData.health_score,
            business_category: finalData.business_category,
            pain_point: finalData.pain_point,
            goals: finalData.goals.join(','),
            timeline: finalData.timeline,
            has_gmb_data: true,
            is_duplicate: duplicateCheck.isDuplicate,
            lead_action: leadAction.action,
            affiliate_code: finalData.affiliate_code,
            utm_source: finalData.utm_source,
            device_type: finalData.device_type
          } 
        }).catch(() => {});
      } catch (e) {
        console.warn('Analytics tracking failed:', e);
      }
      
      try {
        base44.entities.ConversionEvent.create({
          funnel_version: 'v3',
          event_name: 'quizv3_completed',
          session_id: sessionId,
          lead_id: savedLead.id,
          properties: {
            health_score: finalData.health_score,
            business_category: finalData.business_category,
            pain_point: finalData.pain_point,
            goals: finalData.goals.join(','),
            timeline: finalData.timeline,
            critical_issues_count: finalData.critical_issues.length,
            is_duplicate: duplicateCheck.isDuplicate,
            affiliate_code: finalData.affiliate_code,
            utm_source: finalData.utm_source,
            utm_medium: finalData.utm_medium,
            utm_campaign: finalData.utm_campaign,
            referrer: finalData.referrer,
            device_type: finalData.device_type,
            screen_width: trafficData.screen_width,
            time_to_complete_ms: Date.now() - performance.timing.navigationStart
          }
        }).catch(() => {});
      } catch (e) {
        console.warn('Event creation failed:', e);
      }
      
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
    const trafficData = JSON.parse(sessionStorage.getItem('traffic_data') || '{}');
    
    try {
      base44.analytics.track({ 
        eventName: 'quizv3_affiliate_cta_clicked',
        properties: {
          affiliate_code: trafficData.affiliate_code,
          utm_source: trafficData.utm_source,
          health_score: quizData.health_score
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'v3',
        event_name: 'quizv3_affiliate_cta_clicked',
        session_id: sessionId,
        lead_id: leadData.id,
        properties: {
          health_score: quizData.health_score,
          business_name: quizData.business_name,
          business_category: quizData.business_category,
          affiliate_code: trafficData.affiliate_code,
          utm_source: trafficData.utm_source,
          device_type: trafficData.device_type
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('Event creation failed:', e);
    }
    
    window.location.href = createPageUrl('BridgeV3');
  };

  const handleBack = () => {
    try {
      base44.analytics.track({ eventName: 'quizv3_back_clicked', properties: { from_step: step } }).catch(() => {});
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
    
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

          <DeferredComponent delay={5000}>
            <ScarcityBanner spotsLeft={7} />
          </DeferredComponent>
          
          <CookieConsentTracker quizStep={step} quizData={quizData} />

          <main className="flex-1 flex items-center justify-center py-4 px-3 md:px-4 overflow-x-hidden touch-pan-y">
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
                      <CategoryStep key="category" onNext={handleCategorySelect} />
                    )}
                    
                    {step === 'painpoint' && (
                      <PainPointStep key="painpoint" onNext={handlePainPointSelect} />
                    )}
                    
                    {step === 'goals' && (
                      <GoalsStep key="goals" onNext={handleGoalsSelect} />
                    )}
                    
                    {step === 'timeline' && (
                      <TimelineStep key="timeline" onNext={handleTimelineSelect} />
                    )}
                    
                    {step === 'businessSearch' && (
                      <BusinessSearchStep 
                        key="businessSearch" 
                        onNext={handleBusinessSearchSelect}
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
    </>
  );
}

export default function QuizV3Page() {
  return (
    <ErrorBoundary>
      <ABTestProvider>
        <QuizV3Content />
      </ABTestProvider>
    </ErrorBoundary>
  );
}