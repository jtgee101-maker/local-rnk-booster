import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowRight, CheckCircle2, Zap, Target, TrendingUp, Users, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocsFooter from '@/components/docs/DocsFooter';

export default function GettingStarted() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: 'Start Your Free Audit',
      description: 'Take our 2-minute GeeNiusPath assessment to analyze your Google My Business profile and get a personalized health score.',
      icon: Target,
      action: 'Take Free Audit',
      link: createPageUrl('QuizV3'),
      features: ['2-minute quiz', 'Instant health score', 'Critical issues identified']
    },
    {
      number: 2,
      title: 'Review Your Results',
      description: 'Get a detailed analysis of your GMB health, competitive gaps, and opportunities specific to your industry.',
      icon: TrendingUp,
      action: 'View Results',
      features: ['Detailed breakdown', 'Industry benchmarks', 'Actionable insights']
    },
    {
      number: 3,
      title: 'Choose Your Pathway',
      description: 'Select from three exclusive options: Gov Tech Grants, Done For You Service, or DIY Software License.',
      icon: Zap,
      action: 'Explore Options',
      link: createPageUrl('Pricing'),
      features: ['Flexible pricing', 'Multiple options', 'Scalable solutions']
    },
    {
      number: 4,
      title: 'Get Started',
      description: 'Begin your transformation with dedicated support, training, and access to industry-leading GMB optimization tools.',
      icon: Users,
      action: 'Get Started',
      link: createPageUrl('Pricing'),
      features: ['Expert guidance', 'Ongoing support', 'Proven results']
    }
  ];

  const benefits = [
    {
      icon: CheckCircle2,
      title: '50+ Rankings',
      description: 'Increase your Google local rankings in key service areas'
    },
    {
      icon: TrendingUp,
      title: '3x More Leads',
      description: 'Generate significantly more qualified local leads monthly'
    },
    {
      icon: Clock,
      title: '90 Days',
      description: 'See measurable results in as little as 90 days'
    },
    {
      icon: Shield,
      title: 'Proven Results',
      description: 'Trusted by 500+ local businesses across industries'
    }
  ];

  const faqs = [
    {
      q: 'How long does the audit take?',
      a: 'Our GeeNiusPath assessment takes just 2 minutes. We analyze your GMB profile and provide instant results.'
    },
    {
      q: 'What makes LocalRank.ai different?',
      a: 'We focus specifically on Google My Business optimization using AI-powered analysis. We provide three flexible pathways to fit any business model.'
    },
    {
      q: 'Can I try it before paying?',
      a: 'Yes! The free audit gives you a complete health score and critical issues report. No credit card required.'
    },
    {
      q: 'How quickly will I see results?',
      a: 'Most clients see significant ranking improvements within 30-90 days, with some seeing results in 2-3 weeks.'
    },
    {
      q: 'Do you offer support?',
      a: 'All pathways include comprehensive support, training materials, and ongoing guidance from our team.'
    },
    {
      q: 'What if I need help choosing a pathway?',
      a: 'Contact our team and we\'ll recommend the best option based on your business goals and timeline.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Getting Started - LocalRank.ai | GMB Optimization Made Easy</title>
        <meta name="description" content="Get started with LocalRank.ai in 4 simple steps. From free audit to proven results in 90 days." />
        <meta name="keywords" content="getting started, GMB optimization, local SEO, getting started guide" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        {/* Header */}
        <div className="relative border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2 w-fit">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-4 px-3 py-1 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full">
                <span className="text-[#c8ff00] text-sm font-semibold">4 Simple Steps</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Get Started in <span className="text-[#c8ff00]">Minutes</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Transform your local business presence with LocalRank.ai. Start with a free audit and discover your GMB optimization potential.
              </p>
              <Link to={createPageUrl('QuizV3')}>
                <Button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-lg px-8 py-3 h-auto">
                  Start Your Free Audit Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Steps Section */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    onClick={() => setActiveStep(idx)}
                    className="group cursor-pointer"
                  >
                    <div className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                      activeStep === idx
                        ? 'border-[#c8ff00]/50 bg-[#c8ff00]/5'
                        : 'border-gray-800/50 bg-gray-900/30 hover:border-[#c8ff00]/30'
                    }`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9333ea] to-[#ec4899] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#c8ff00] flex items-center justify-center text-black text-xs font-bold">
                            {step.number}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-6 leading-relaxed">{step.description}</p>

                      <div className="space-y-2 mb-6">
                        {step.features.map((feature, fidx) => (
                          <div key={fidx} className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00]" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {step.link ? (
                        <Link to={step.link} className="w-full">
                          <Button className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold">
                            {step.action}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      ) : (
                        <Button className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold">
                          {step.action}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What You'll Achieve</h2>
              <p className="text-lg text-gray-300">Join hundreds of local businesses getting proven results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="p-6 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:border-[#c8ff00]/30 transition-all hover:bg-gray-900/50"
                  >
                    <Icon className="w-8 h-8 text-[#c8ff00] mb-4" />
                    <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-400">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-gray-300">Have questions? We have answers</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className="p-6 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:border-[#c8ff00]/30 transition-all"
                >
                  <h3 className="font-bold text-white mb-2 text-lg">{faq.q}</h3>
                  <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform Your Local Presence?</h2>
              <p className="text-lg text-gray-300 mb-8">Start with a free audit. No credit card required. Takes just 2 minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl('QuizV3')}>
                  <Button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-8 py-3 h-auto text-lg">
                    Start Free Audit
                  </Button>
                </Link>
                <Link to={createPageUrl('DocsHome')}>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-900 px-8 py-3 h-auto text-lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <DocsFooter />
      </div>
    </>
  );
}