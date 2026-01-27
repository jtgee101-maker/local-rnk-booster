import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Star, Users, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const scanSteps = [
  { text: 'Scanning your business category...', duration: 3000 },
  { text: 'Analyzing competitor rankings...', duration: 3500 },
  { text: 'Checking GMB optimization score...', duration: 3000 },
  { text: 'Identifying critical issues...', duration: 4000 },
  { text: 'Generating your custom strategy...', duration: 3500 }
];

const testimonials = [
  {
    text: "I never imagined finding the exact reason I wasn't ranking. The audit showed me 3 errors I fixed in 10 minutes, and I'm now in the Top 3!",
    author: "Michael Rodriguez",
    business: "Rodriguez HVAC",
    rating: 5
  },
  {
    text: "This audit was a game-changer. I couldn't believe how many leads I was losing to simple mistakes. Fixed them and calls doubled!",
    author: "Sarah Chen",
    business: "Downtown Dental",
    rating: 5
  },
  {
    text: "The competitor analysis opened my eyes. I was making the same 3 mistakes keeping me invisible. Now I own the map pack in my area.",
    author: "James Patterson",
    business: "Patterson Law Firm",
    rating: 5
  }
];

const engagementQuestions = [
  {
    question: "Have you researched local SEO strategies before?",
    options: ["Yes", "No"]
  },
  {
    question: "Do you currently track your Map Pack rankings?",
    options: ["Yes, regularly", "Sometimes", "Never"]
  }
];

export default function ProcessingStepEnhanced({ onComplete, formData = {} }) {
  const businessName = formData?.business_name || 'Your Business';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  const totalDuration = scanSteps.reduce((sum, step) => sum + step.duration, 0);

  // P0-2 FIX: Safety timeout to prevent stuck spinner
  useEffect(() => {
    if (!onComplete || typeof onComplete !== 'function') {
      console.error('ProcessingStepEnhanced: onComplete is not a function');
      return;
    }

    const safetyTimeout = setTimeout(() => {
      console.warn('ProcessingStep safety timeout triggered');
      try {
        onComplete(formData);
      } catch (error) {
        console.error('ProcessingStep safety timeout error:', error);
      }
    }, 20000); // 20 second max

    return () => clearTimeout(safetyTimeout);
  }, [onComplete, formData]);

  useEffect(() => {
    // Show first engagement modal after 4 seconds
    const engagementTimer = setTimeout(() => {
      setShowEngagementModal(true);
    }, 4000);

    // P0-1 FIX: Auto-dismiss modal after 15s if no interaction
    const autoDismissTimer = setTimeout(() => {
      setShowEngagementModal(false);
    }, 19000);

    return () => {
      clearTimeout(engagementTimer);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  useEffect(() => {
    // Progress through scan steps
    let stepTimer;
    let progressInterval;

    const startProgress = () => {
      const currentStep = scanSteps[currentStepIndex];
      const startTime = Date.now();

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const stepProgress = (elapsed / currentStep.duration) * (1 / scanSteps.length);
        const baseProgress = currentStepIndex / scanSteps.length;
        setProgress((baseProgress + stepProgress) * 100);
      }, 50);

      stepTimer = setTimeout(() => {
        if (currentStepIndex < scanSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          clearInterval(progressInterval);
          setProgress(100);
          setTimeout(() => {
            if (onComplete && typeof onComplete === 'function') {
              try {
                onComplete(formData);
              } catch (error) {
                console.error('ProcessingStep onComplete error:', error);
              }
            }
          }, 500);
        }
      }, currentStep.duration);
    };

    startProgress();

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressInterval);
    };
  }, [currentStepIndex, onComplete]);

  useEffect(() => {
    // P2-1 FIX: Reduce rotation frequency to 8s (less repaints)
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(testimonialTimer);
  }, []);

  const handleEngagementAnswer = (answer) => {
    setHasAnswered(true);
    
    setTimeout(() => {
      if (currentQuestionIndex < engagementQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setHasAnswered(false);
      } else {
        setShowEngagementModal(false);
      }
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      {/* Main Processing UI */}
      <AnimatePresence mode="wait">
        <motion.div
          key="processing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center"
        >
          {/* Scanner Animation - P1-1 FIX: Replace rotation with pulse (GPU-accelerated) */}
          <motion.div
            className="relative w-32 h-32 mx-auto mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#c8ff00] border-r-[#c8ff00] animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 rounded-full bg-[#c8ff00]/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#c8ff00]" />
            </div>
          </motion.div>

          {/* Business Name */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-white mb-2"
          >
            Analyzing {businessName}
          </motion.h2>

          <p className="text-gray-400 text-sm mb-4">
            Please wait while we analyze your business visibility...
          </p>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="inline-flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3 mb-8"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-white font-semibold text-sm">7M+ Users</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-[#c8ff00] fill-[#c8ff00]" />
              ))}
              <span className="text-white font-semibold text-sm ml-1">4.9</span>
            </div>
          </motion.div>

          {/* Progress Info */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[#c8ff00] font-medium mb-4"
            >
              {scanSteps[currentStepIndex].text}
            </motion.p>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#c8ff00] to-[#a0d600] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Rotating Testimonials */}
          <div className="mt-12">
            <h3 className="text-white font-bold text-lg mb-6">
              While you wait, see what others discovered:
            </h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonialIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 max-w-lg mx-auto"
              >
                <Quote className="w-8 h-8 text-[#c8ff00]/30 mb-3" />
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonials[currentTestimonialIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed italic">
                  "{testimonials[currentTestimonialIndex].text}"
                </p>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">
                    {testimonials[currentTestimonialIndex].author}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {testimonials[currentTestimonialIndex].business}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Engagement Modal - P0-1 FIX: Add close button and auto-dismiss */}
      <AnimatePresence>
        {showEngagementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEngagementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* P0-1: Explicit close button */}
              <button
                onClick={() => setShowEngagementModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-white font-bold text-xl mb-6 text-center pr-8">
                {engagementQuestions[currentQuestionIndex].question}
              </h3>
              <div className="space-y-3">
                {engagementQuestions[currentQuestionIndex].options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleEngagementAnswer(option)}
                    disabled={hasAnswered}
                    className="w-full bg-gray-800 hover:bg-[#c8ff00] hover:text-black text-white py-4 rounded-xl transition-all duration-300 disabled:opacity-50 min-h-[44px]"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}