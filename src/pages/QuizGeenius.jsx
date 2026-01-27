import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
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
    const initTracking = async () => {
      // Capture UTM parameters and campaign data
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
      setUtmParams(utm);

      // Capture campaign/QR tracking
      const campaign = {
        ref: params.get('ref'),
        short_code: params.get('sc'),
        campaign_id: params.get('cid'),
        affiliate_code: params.get('aff')
      };
      setCampaignData(campaign);

    // Track campaign click if present
    if (campaign.short_code || campaign.campaign_id) {
      try {
        await base44.entities.CampaignClick.create({
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
        });
      } catch (err) {
        console.error('Campaign click tracking failed:', err);
      }
    }

    // Track quiz start with full context
    try {
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'quiz_started',
        session_id: sessionId,
        properties: {
          entry_page: 'QuizGeenius',
          ...utm,
          ...campaign,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }
      });

      await base44.analytics.track({
        eventName: 'geenius_quiz_started',
        properties: {
          session_id: sessionId,
          ...utm,
          ...campaign
        }
      });

      // Initialize behavior tracking
      await base44.entities.UserBehavior.create({
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
      });
    } catch (err) {
      console.error('Tracking initialization failed:', err);
    }

    // Track scroll depth
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const depth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      setScrollDepth(Math.max(scrollDepth, depth));
    };

    // Track clicks
    const handleClick = () => {
      setClickCount(prev => prev + 1);
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('click', handleClick);
      };
    };

    initTracking();
  }, [sessionId]);

  const trackStep = (stepName, stepNumber) => {
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius',
      event_name: `quiz_step_${stepName}`,
      session_id: sessionId,
      step_number: stepNumber,
      properties: { step_name: stepName }
    }).catch(console.error);
  };

  const handleNext = async (data) => {
    const timeOnStep = Date.now() - stepStartTime;
    
    setFormData(prev => ({ ...prev, ...data }));
    
    const stepNames = ['category', 'pain_point', 'goals', 'timeline', 'business_search', 'contact_info'];
    if (currentStep < stepNames.length) {
      trackStep(stepNames[currentStep], currentStep + 1);
      
      // Track detailed step behavior
      try {
        const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
        if (behaviors.length > 0) {
          const behavior = behaviors[0];
          await base44.entities.UserBehavior.update(behavior.id, {
            interactions: [
              ...(behavior.interactions || []),
              {
                type: `step_${stepNames[currentStep]}_completed`,
                timestamp: Date.now(),
                step: currentStep + 1,
                time_spent: timeOnStep,
                data: data
              }
            ],
            quiz_completion: Math.round(((currentStep + 1) / totalSteps) * 100),
            scroll_depth: scrollDepth,
            click_count: clickCount,
            time_on_page: Math.round((Date.now() - startTime) / 1000)
          });
        }
      } catch (err) {
        console.error('Step tracking failed:', err);
      }
    }
    
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
      
      // Track completion
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'quiz_completed',
        session_id: sessionId,
        properties: {
          business_name: completeData.business_name,
          completion_time_seconds: totalTime,
          ...utmParams,
          ...campaignData
        }
      });

      // Calculate health score using backend enhanced analysis
      let healthScore = 50;
      let criticalIssues = [];
      
      try {
        const analysisResponse = await base44.functions.invoke('enhancedGMBAnalysis', {
          leadData: completeData
        });
        
        if (analysisResponse?.data?.success && analysisResponse?.data?.analysis) {
          healthScore = analysisResponse.data.analysis.score || 50;
          
          // Generate critical issues from competitive insights
          const insights = analysisResponse.data.analysis.competitiveInsights || {};
          if (insights.vulnerabilities && insights.vulnerabilities.length > 0) {
            criticalIssues = insights.vulnerabilities;
          }
        }
      } catch (analysisError) {
        console.error('Enhanced analysis failed, using fallback:', analysisError);
        // Fallback to basic calculation
        healthScore = calculateBasicHealthScore(completeData);
        criticalIssues = generateBasicCriticalIssues(completeData);
      }

      // Create lead with calculated health score
      const lead = await base44.entities.Lead.create({
        ...completeData,
        health_score: healthScore,
        critical_issues: criticalIssues,
        status: 'new',
        last_quiz_date: new Date().toISOString(),
        quiz_submission_count: 1
      });

      // Update or create comprehensive user behavior record
      try {
        const behaviors = await base44.entities.UserBehavior.filter({ session_id: sessionId });
        
        if (behaviors.length > 0) {
          await base44.entities.UserBehavior.update(behaviors[0].id, {
            email: lead.email,
            consent_given: true,
            engagement_score: 100,
            scroll_depth: scrollDepth,
            click_count: clickCount,
            time_on_page: totalTime,
            quiz_completion: 100,
            interactions: [
              ...(behaviors[0].interactions || []),
              {
                type: 'quiz_completed',
                timestamp: Date.now(),
                lead_id: lead.id,
                business_name: lead.business_name,
                health_score: lead.health_score
              }
            ],
            quiz_progress: {
              total_steps: totalSteps,
              completed_steps: totalSteps,
              completion_time: totalTime,
              email_captured: lead.email,
              phone_captured: lead.phone
            }
          });
        } else {
          await base44.entities.UserBehavior.create({
            session_id: sessionId,
            email: lead.email,
            consent_given: true,
            engagement_score: 100,
            scroll_depth: scrollDepth,
            click_count: clickCount,
            time_on_page: totalTime,
            quiz_completion: 100,
            pages_viewed: ['QuizGeenius'],
            interactions: [
              { type: 'quiz_started', timestamp: startTime },
              { type: 'quiz_completed', timestamp: Date.now(), lead_id: lead.id }
            ],
            first_visit: new Date(startTime).toISOString(),
            total_visits: 1,
            device_info: {
              user_agent: navigator.userAgent,
              platform: navigator.platform
            },
            traffic_source: utmParams,
            quiz_progress: {
              total_steps: totalSteps,
              completed_steps: totalSteps,
              completion_time: totalTime
            }
          });
        }
      } catch (behaviorError) {
        console.error('Behavior tracking failed:', behaviorError);
      }

      // Send email with tracking context
      try {
        await base44.functions.invoke('sendGeeniusEmail', {
          leadData: lead,
          sessionId: sessionId,
          utmParams: utmParams,
          campaignData: campaignData,
          behaviorData: {
            time_on_page: totalTime,
            scroll_depth: scrollDepth,
            click_count: clickCount
          }
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }

      // Track lead creation with full context
      await base44.analytics.track({
        eventName: 'geenius_lead_created',
        properties: {
          lead_id: lead.id,
          business_name: lead.business_name,
          health_score: lead.health_score,
          email: lead.email,
          phone: lead.phone,
          completion_time: totalTime,
          engagement_score: 100,
          ...utmParams,
          ...campaignData
        }
      });

      // Redirect to results page
      window.location.href = createPageUrl('ResultsGeenius') + `?lead_id=${lead.id}`;
      
    } catch (error) {
      console.error('Quiz completion error:', error);
      
      // Log error
      base44.entities.ErrorLog.create({
        error_type: 'system_error',
        severity: 'high',
        message: error.message,
        stack_trace: error.stack,
        metadata: {
          component: 'QuizGeenius',
          session_id: sessionId,
          step: 'completion'
        }
      }).catch(console.error);
      
      alert('Something went wrong. Please try again.');
    }
  };

  // Fallback health score calculation
  const calculateBasicHealthScore = (data) => {
    let score = 20;
    
    if (data.gmb_rating >= 4.7) score += 15;
    else if (data.gmb_rating >= 4.5) score += 10;
    else if (data.gmb_rating >= 4.0) score += 5;
    
    if (data.gmb_reviews_count >= 100) score += 15;
    else if (data.gmb_reviews_count >= 50) score += 10;
    else if (data.gmb_reviews_count >= 25) score += 5;
    
    if (data.gmb_photos_count >= 50) score += 15;
    else if (data.gmb_photos_count >= 30) score += 10;
    else if (data.gmb_photos_count >= 15) score += 5;
    
    score += data.gmb_has_hours ? 5 : -5;
    score += data.website ? 5 : -3;
    score += data.phone ? 5 : -3;
    
    return Math.max(10, Math.min(90, score));
  };

  const generateBasicCriticalIssues = (data) => {
    const issues = [];
    if (data.gmb_rating < 4.5) {
      issues.push(`Rating at ${data.gmb_rating}★ - Businesses above 4.7★ get 67% more clicks`);
    }
    if (data.gmb_reviews_count < 50) {
      issues.push(`Only ${data.gmb_reviews_count} reviews - Top competitors average 100+ (losing 58% visibility)`);
    }
    if (data.gmb_photos_count < 30) {
      issues.push(`${data.gmb_photos_count} photos vs industry standard 50+ (missing 73% more direction requests)`);
    }
    if (!data.gmb_has_hours) {
      issues.push('Missing business hours - Invisible in 40% of searches');
    }
    if (!data.phone) {
      issues.push('No phone number - Blocking 89% of mobile users');
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
      <div className="relative z-10 pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-black text-white">
              GeeNius<span className="text-purple-400">Path</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Discover exclusive pathways to transform your business growth
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-xl mx-auto mt-6">
          <Progress value={progress} className="h-2 bg-gray-800" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
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
      <div className="relative z-10 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {steps[currentStep]}
        </div>
      </div>
    </div>
    </GeeniusErrorBoundary>
  );
}