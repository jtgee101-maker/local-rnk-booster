import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import GeeniusErrorBoundary from '@/components/geenius/GeeniusErrorBoundary';
import CookieConsentTracker from '@/components/tracking/CookieConsentTracker';

// Import quiz step components
import CategoryStep from '@/components/quiz/CategoryStep';
import PainPointStep from '@/components/quiz/PainPointStep';
import GoalsStep from '@/components/quiz/GoalsStep';
import TimelineStep from '@/components/quiz/TimelineStep';
import BusinessSearchStep from '@/components/quiz/BusinessSearchStep';
import ContactInfoStep from '@/components/quiz/ContactInfoStep';
import ProcessingStepEnhanced from '@/components/quiz/ProcessingStepEnhanced';

export default function QuizGeenius() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId] = useState(`geenius_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [startTime] = useState(Date.now());
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [clickCount, setClickCount] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [utmParams, setUtmParams] = useState({});
  const [campaignData, setCampaignData] = useState({});
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

  useEffect(() => {
    let mounted = true;
    let scrollTimeout;
    let clickTimeout;
    
    const initTracking = async () => {
      const params = new URLSearchParams(window.location.search);
      const utm = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        utm_term: params.get('utm_term'),
        referrer: document.referrer,
        landing_page: window.location.href
      };
      
      const campaign = {
        ref: params.get('ref'),
        short_code: params.get('sc'),
        campaign_id: params.get('cid'),
        affiliate_code: params.get('aff')
      };
      
      if (!mounted) return;
      setUtmParams(utm);
      setCampaignData(campaign);

    // Fire and forget tracking (don't await)
    if (campaign.short_code || campaign.campaign_id) {
      try {
        base44.entities.CampaignClick.create({
          campaign_id: campaign.campaign_id || 'unknown',
          short_code: campaign.short_code || campaign.ref || 'direct',
          ip_address: 'client_side',
          user_agent: navigator.userAgent,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
          os: navigator.platform,
          referrer: document.referrer,
          session_id: sessionId
        }).catch(() => {});
      } catch (err) {
        console.error('Campaign click tracking failed:', err);
      }
    }

    try {
      base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'quiz_started',
        session_id: sessionId,
        properties: {
          entry_page: 'QuizGeenius',
          ...utm,
          ...campaign,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Conversion event tracking failed:', err);
    }

    try {
      const analyticsRes = base44.analytics.track({
        eventName: 'geenius_quiz_started',
        properties: {
          session_id: sessionId,
          ...utm,
          ...campaign
        }
      });
      if (analyticsRes && typeof analyticsRes.catch === 'function') {
        analyticsRes.catch(() => {});
      }
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }

    try {
      base44.entities.UserBehavior.create({
        session_id: sessionId,
        consent_given: false,
        engagement_score: 0,
        scroll_depth: 0,
        click_count: 0,
        time_on_page: 0,
        quiz_completion: 0,
        pages_viewed: ['QuizGeenius'],
        interactions: [
          { type: 'quiz_started', timestamp: Date.now(), step: 0 }
        ],
        first_visit: new Date().toISOString(),
        total_visits: 1,
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          screen_width: window.screen.width,
          screen_height: window.screen.height
        },
        traffic_source: utm
      }).catch(() => {});
    } catch (err) {
      console.error('User behavior tracking failed:', err);
    }

    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const depth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
        if (mounted) setScrollDepth(prev => Math.max(prev, depth));
        scrollTimeout = null;
      }, 300);
    };

    const handleClick = () => {
      if (clickTimeout) return;
      clickTimeout = setTimeout(() => {
        if (mounted) setClickCount(prev => prev + 1);
        clickTimeout = null;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });

      return () => {
        mounted = false;
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('click', handleClick);
        if (scrollTimeout) clearTimeout(scrollTimeout);
        if (clickTimeout) clearTimeout(clickTimeout);
      };
    };

    initTracking();
  }, []);

  const trackStep = (stepName, stepNumber) => {
    // Fire and forget - never block UI
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius',
      event_name: `quiz_step_${stepName}`,
      session_id: sessionId,
      step_number: stepNumber,
      properties: { step_name: stepName }
    }).catch(() => {});
  };

  const handleNext = async (data) => {
    // Update form data immediately
    setFormData(prev => ({ ...prev, ...data }));
    
    // Background tracking (don't block UI)
    const stepNames = ['category', 'pain_point', 'goals', 'timeline', 'business_search', 'contact_info'];
    if (currentStep < stepNames.length) {
      trackStep(stepNames[currentStep], currentStep + 1);
    }
    
    // Move to next step immediately
    setStepStartTime(Date.now());
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async (finalData) => {
    try {
      const completeData = { ...formData, ...finalData };
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      
      // Calculate health score FIRST (synchronous, fast)
      const healthScore = calculateRobustHealthScore(completeData);
      const criticalIssues = generateRobustCriticalIssues(completeData);

      // Create lead FIRST - this is critical path
      const lead = await base44.entities.Lead.create({
        ...completeData,
        health_score: healthScore,
        critical_issues: criticalIssues,
        status: 'new',
        last_quiz_date: new Date().toISOString(),
        quiz_submission_count: 1
      });

      // Track completion (fire and forget - don't block)
      base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'quiz_completed',
        session_id: sessionId,
        lead_id: lead.id,
        properties: {
          business_name: completeData.business_name,
          completion_time_seconds: totalTime,
          health_score: healthScore,
          ...utmParams,
          ...campaignData
        }
      }).catch(err => console.error('Conversion tracking failed:', err));

      // Background tracking (fire and forget - don't block redirect)
      base44.entities.UserBehavior.filter({ session_id: sessionId })
        .then(behaviors => {
          if (behaviors.length > 0) {
            return base44.entities.UserBehavior.update(behaviors[0].id, {
              email: lead.email,
              consent_given: true,
              engagement_score: 100,
              scroll_depth: scrollDepth,
              click_count: clickCount,
              time_on_page: totalTime,
              quiz_completion: 100,
              interactions: [
                ...(behaviors[0].interactions || []),
                { type: 'quiz_completed', timestamp: Date.now(), lead_id: lead.id }
              ],
              quiz_progress: {
                total_steps: totalSteps,
                completed_steps: totalSteps,
                completion_time: totalTime
              }
            });
          }
        })
        .catch(err => console.error('Behavior tracking failed:', err));

      // Send emails in background (don't await - fire and forget)
      Promise.all([
        base44.functions.invoke('sendGeeniusEmail', {
          leadData: lead,
          sessionId: sessionId,
          utmParams: utmParams,
          campaignData: campaignData,
          behaviorData: {
            time_on_page: totalTime,
            scroll_depth: scrollDepth,
            click_count: clickCount
          }
        }).catch(err => console.error('Lead email failed:', err)),
        
        base44.functions.invoke('notifyAdminNewLead', {
          leadData: lead
        }).catch(err => console.error('Admin notification failed:', err))
      ]).catch(() => console.warn('Some emails failed'));

      // Background analytics (fire and forget)
      try {
        const trackResult = base44.analytics.track({
          eventName: 'geenius_lead_created',
          properties: {
            lead_id: lead.id,
            business_name: lead.business_name,
            health_score: healthScore,
            completion_time: totalTime,
            ...utmParams
          }
        });
        if (trackResult && typeof trackResult.catch === 'function') {
          trackResult.catch(() => {});
        }
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      // Background location content (fire and forget)
      if (lead.place_id && lead.location) {
        base44.functions.invoke('localRankingGrid', {
          placeId: lead.place_id,
          businessName: lead.business_name,
          location: lead.location
        })
        .then(gridResponse => {
          if (gridResponse.data?.success && gridResponse.data?.weakZones?.length > 0) {
            return base44.functions.invoke('generateLocationContent', {
              lead_id: lead.id,
              weak_zones: gridResponse.data.weakZones,
              business_location: lead.location,
              content_types: ['gmb_post', 'landing_page']
            });
          }
        })
        .catch(err => console.error('Background tasks failed:', err));
      }

      // CRITICAL: Redirect immediately after lead creation
      window.location.href = createPageUrl('ResultsGeenius') + `?lead_id=${lead.id}`;
      
    } catch (error) {
      console.error('Quiz completion error:', error);
      
      // Log error (fire and forget)
      base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'critical',
        message: error.message || 'Quiz completion failed',
        stack_trace: error.stack,
        metadata: {
          component: 'QuizGeenius',
          session_id: sessionId,
          step: 'completion',
          formData: formData
        }
      }).catch(() => {});
      
      // Show user-friendly error
      alert('Unable to complete your audit. Please refresh and try again, or contact support if the issue persists.');
      
      // Redirect back to start
      setTimeout(() => {
        window.location.href = createPageUrl('QuizGeenius');
      }, 2000);
    }
  };

  // TACTICAL HEALTH SCORE - Matches backend algorithm
  // Designed to show weaknesses and create urgency (max ~75-85)
  const calculateRobustHealthScore = (data) => {
    const rating = data.gmb_rating || 0;
    const reviewCount = data.gmb_reviews_count || 0;
    const photosCount = data.gmb_photos_count || 0;
    
    // 1. Review Authority (max 20, realistically 15)
    const reviewQuality = rating >= 4.5 ? 1 : (rating / 4.5);
    const reviewAuth = Math.min(20, (
      (reviewCount >= 200 ? 8 : reviewCount / 25) +
      (reviewQuality * 7) +
      (reviewCount / 12 >= 5 ? 5 : reviewCount / 12)
    ));
    
    // 2. Visual Authority (max 18, caps at 14)
    const photoQuality = photosCount >= 50 ? 1 : photosCount / 50;
    const visualAuth = Math.min(18, photoQuality * 14);
    
    // 3. Profile Completeness (max 15)
    let completeness = 0;
    if (data.website) completeness += 4;
    if (data.phone) completeness += 4;
    if (data.gmb_has_hours) completeness += 3;
    if (data.gmb_types?.length >= 3) completeness += 2;
    if (data.business_description?.length >= 100) completeness += 2;
    
    // 4. Engagement (max 12)
    const engagement = 0; // Frontend doesn't have engagement data
    
    // 5. Penalties (always deduct 8-23 pts)
    const competitivePenalty = Math.round(5 + Math.random() * 10);
    const freshnessPenalty = Math.round(3 + Math.random() * 8);
    
    // Final Score
    const rawScore = 15 + reviewAuth + visualAuth + completeness + engagement;
    const finalScore = Math.round(rawScore - competitivePenalty - freshnessPenalty);
    
    // Cap between 25-85
    return Math.max(25, Math.min(85, finalScore));
  };

  const generateRobustCriticalIssues = (data) => {
    const issues = [];
    
    if (data.gmb_rating < 4.5) {
      issues.push(`⚠️ Rating at ${data.gmb_rating}★ - Businesses above 4.7★ get 67% more clicks`);
    }
    
    if (data.gmb_reviews_count < 50) {
      issues.push(`📊 Only ${data.gmb_reviews_count} reviews detected - Top competitors average 100+ (losing 58% visibility)`);
    }
    
    if (data.gmb_photos_count < 30) {
      issues.push(`📸 Critical photo gap: ${data.gmb_photos_count} photos vs industry standard 50+ (missing 73% more direction requests)`);
    }
    
    if (!data.gmb_has_hours) {
      issues.push('🕐 Missing business hours - Invisible in 40% of searches');
    }
    
    if (!data.phone) {
      issues.push('📞 No phone number - Blocking 89% of mobile users from calling');
    }
    
    if (!data.website) {
      issues.push('🌐 No website linked - Missing 52% more web traffic from Maps');
    }
    
    if (!data.gmb_types || data.gmb_types.length < 2) {
      issues.push('🏷️ Incomplete categories - 2.3x lower ranking in related searches');
    }
    
    return issues;
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

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
      <div className="relative z-10 pt-6 sm:pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              GeeNius<span className="text-purple-400">Path</span>
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">
            Discover exclusive pathways to transform your business growth
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-xl mx-auto mt-4 sm:mt-6">
          <Progress value={progress} className="h-2 bg-gray-800" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span className="hidden xs:inline">{Math.round(progress)}% Complete</span>
            <span className="xs:hidden">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Cookie Consent Tracker */}
      <CookieConsentTracker
        sessionId={sessionId}
        onConsent={async (consent) => {
          try {
            const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
            if (behaviors.length > 0) {
              await base44.entities.UserBehavior.update(behaviors[0].id, {
                consent_given: consent
              });
            }
          } catch (err) {
            console.error('Consent tracking failed:', err);
          }
        }}
      />

      {/* Quiz Steps */}
      <div className="relative z-10 px-4 pb-12 sm:pb-16">
        <div className="max-w-2xl mx-auto">
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
        </div>
      </div>
    </div>
    </GeeniusErrorBoundary>
  );
}