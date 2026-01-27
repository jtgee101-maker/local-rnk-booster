import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';

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
    // Track quiz start
    base44.entities.ConversionEvent.create({
      funnel_version: 'geenius',
      event_name: 'quiz_started',
      session_id: sessionId,
      properties: { entry_page: 'QuizGeenius' }
    }).catch(console.error);

    base44.analytics.track({
      eventName: 'geenius_quiz_started',
      properties: { session_id: sessionId }
    }).catch(console.error);
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

  const handleNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    
    const stepNames = ['category', 'pain_point', 'goals', 'timeline', 'business_search', 'contact_info'];
    if (currentStep < stepNames.length) {
      trackStep(stepNames[currentStep], currentStep + 1);
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async (finalData) => {
    try {
      const completeData = { ...formData, ...finalData };
      
      // Track completion
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'quiz_completed',
        session_id: sessionId,
        properties: { business_name: completeData.business_name }
      });

      // Create lead
      const lead = await base44.entities.Lead.create({
        ...completeData,
        status: 'new',
        last_quiz_date: new Date().toISOString(),
        quiz_submission_count: 1
      });

      // Send email
      try {
        await base44.functions.invoke('sendGeeniusEmail', {
          leadData: lead,
          sessionId: sessionId
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }

      // Track lead creation
      await base44.analytics.track({
        eventName: 'geenius_lead_created',
        properties: {
          lead_id: lead.id,
          business_name: lead.business_name,
          health_score: lead.health_score
        }
      });

      // Redirect to bridge
      window.location.href = createPageUrl('BridgeGeenius') + `?lead_id=${lead.id}`;
      
    } catch (error) {
      console.error('Quiz completion error:', error);
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const steps = [
    <CategoryStep key="category" onNext={handleNext} initialValue={formData.business_category} />,
    <PainPointStep key="pain" onNext={handleNext} onBack={handleBack} initialValue={formData.pain_point} />,
    <GoalsStep key="goals" onNext={handleNext} onBack={handleBack} initialValue={formData.goals} />,
    <TimelineStep key="timeline" onNext={handleNext} onBack={handleBack} initialValue={formData.timeline} />,
    <BusinessSearchStep key="business" onNext={handleNext} onBack={handleBack} initialData={formData} />,
    <ContactInfoStep key="contact" onNext={handleNext} onBack={handleBack} initialData={formData} />,
    <ProcessingStepEnhanced key="processing" formData={formData} onComplete={handleComplete} />
  ];

  return (
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

      {/* Quiz Steps */}
      <div className="relative z-10 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
}