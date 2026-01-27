import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ChevronDown, ArrowLeft, Zap, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Category Selection',
    description: 'Tell us what industry you\'re in so we can customize the assessment for your specific market',
    details: [
      'Helps us understand your competitive landscape',
      'Tailors recommendations to your industry standards',
      'Identifies category-specific ranking factors',
      'Compares you against local competitors'
    ],
    icon: Zap
  },
  {
    number: 2,
    title: 'Pain Point Identification',
    description: 'Select your biggest challenge - are you missing from the map pack, lacking reviews, or not getting calls?',
    details: [
      'Not in Map Pack: Your business doesn\'t show in local search results',
      'Low Reviews: You have reviews but not enough to compete',
      'No Calls: People find you but don\'t contact you',
      'Not Optimized: Your profile is incomplete or outdated'
    ],
    icon: AlertCircle
  },
  {
    number: 3,
    title: 'Business Goals',
    description: 'Choose what success looks like for you in the next 6 months',
    details: [
      'Increase qualified leads by 50%+',
      'Improve review ratings and count',
      'Get more customer calls and inquiries',
      'Dominate local search rankings',
      'Establish market authority'
    ],
    icon: TrendingUp
  },
  {
    number: 4,
    title: 'Timeline & Urgency',
    description: 'How quickly do you need results? This affects our strategy priority',
    details: [
      'URGENT: Need results within 2-4 weeks',
      '30 Days: Want quick wins first',
      '60 Days: Can do a comprehensive overhaul',
      'Planning Phase: Still exploring options'
    ],
    icon: Zap
  },
  {
    number: 5,
    title: 'Business Discovery',
    description: 'We pull real-time data from Google My Business to analyze your actual performance',
    details: [
      'Analyzes your current GMB profile',
      'Pulls competitor benchmarking data',
      'Reviews your photo count and recency',
      'Checks your Q&A and review metrics',
      'Evaluates service area coverage'
    ],
    icon: CheckCircle2
  },
  {
    number: 6,
    title: 'AI Analysis & Scoring',
    description: 'Our AI engine calculates your health score based on 40+ ranking factors',
    details: [
      'Generates your GMB Health Score (0-100)',
      'Identifies your top 3 critical issues',
      'Estimates revenue impact of improvements',
      'Benchmarks you against competitors',
      'Provides quick-win recommendations'
    ],
    icon: TrendingUp
  },
  {
    number: 7,
    title: 'Contact & Results',
    description: 'Share your contact info and receive a detailed breakdown of your audit',
    details: [
      'Personalized audit report sent to email',
      'AI-powered recommendations for improvement',
      'Estimated timeline to see results',
      'Next steps for implementation',
      'Access to our improvement platform'
    ],
    icon: CheckCircle2
  }
];

function StepAccordion({ step, isOpen, onToggle }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-700/50 rounded-xl overflow-hidden hover:border-[#c8ff00]/30 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Icon className="w-5 h-5 text-[#c8ff00]" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-lg">
              Step {step.number}: {step.title}
            </h4>
            <p className="text-gray-400 text-sm mt-1">{step.description}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-700/50 bg-gray-800/20 px-6 py-4"
        >
          <ul className="space-y-2">
            {step.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function GuideQuizGeniusPage() {
  const [openStep, setOpenStep] = useState(0);

  return (
    <>
      <Helmet>
        <title>QuizGeenius Flow Guide - LocalRank.ai</title>
        <meta name="description" content="Learn how the QuizGeenius assessment works and what each step reveals about your business." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <Link
                to={createPageUrl('DocsHome')}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Docs
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  QuizGeenius Flow Guide
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed">
                  A comprehensive walkthrough of how our AI-powered assessment reveals exactly what's holding your business back in local search
                </p>
              </motion.div>
            </div>
          </div>

          {/* Overview */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 border border-[#c8ff00]/30 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">What is QuizGeenius?</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                QuizGeenius is a 7-step AI-powered assessment that analyzes your Google My Business profile, competitive landscape, and local market position. It generates a personalized health score and identifies critical improvements to increase your visibility and attract more customers.
              </p>
              <p className="text-gray-400">
                Average completion time: 5-7 minutes | Results delivered instantly
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8">The 7 Steps Explained</h2>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <StepAccordion
                    key={step.number}
                    step={step}
                    isOpen={openStep === idx}
                    onToggle={() => setOpenStep(openStep === idx ? -1 : idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8">What You Get at the End</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Health Score', description: 'A 0-100 score showing your local SEO performance' },
                  { title: 'Critical Issues', description: 'Your top 3 obstacles preventing growth' },
                  { title: 'Quick Wins', description: 'Fast improvements you can implement today' },
                  { title: 'Recommendations', description: 'AI-powered suggestions tailored to your business' },
                  { title: 'Benchmarking', description: 'How you compare to local competitors' },
                  { title: 'Timeline', description: 'Estimated results if you implement changes' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6"
                  >
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#c8ff00]" />
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 md:px-6 py-12">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 border border-[#c8ff00]/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to see your assessment?</h3>
              <p className="text-gray-400 mb-6">
                Take the free QuizGeenius assessment and get your personalized health score in less than 5 minutes
              </p>
              <Link to={createPageUrl('QuizV3')}>
                <button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-8 py-3 rounded-lg transition-colors">
                  Start Quiz Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}