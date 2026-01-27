import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wrench, MapPin, Star, TrendingUp, DollarSign } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LegalFooter from '@/components/shared/LegalFooter';
import InlineSocialProof from '@/components/cro/InlineSocialProof';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function PlumbersLanding() {
  React.useEffect(() => {
    base44.analytics.track({ eventName: 'plumbers_landing_viewed' });
  }, []);

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'plumbers_landing_cta_clicked' });
    window.location.href = createPageUrl('QuizGeenius');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <Helmet>
        <title>Free GMB Audit for Plumbers - Get More Emergency Calls | LocalRank.ai</title>
        <meta name="description" content="Stop paying $150/lead to HomeAdvisor. Get 3x more emergency plumbing calls from Google Maps. Free AI audit reveals what's killing your rankings." />
        <meta name="keywords" content="plumber marketing, plumbing leads, google my business plumbers, local seo plumbers" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,90vw)] h-[800px] bg-blue-500/5 rounded-full blur-[80px] md:blur-[150px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="p-6 text-center">
          <div className="text-[#c8ff00] font-bold text-2xl tracking-tight">
            LocalRank<span className="text-white">.ai</span>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
              <Wrench className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-semibold text-sm">FOR PLUMBERS ONLY</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Stop Paying <span className="text-red-400">$150/Lead</span> to HomeAdvisor.<br />
              Get <span className="text-[#c8ff00]">3x More Emergency Calls</span> From Google Maps.
            </h1>

            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Free AI audit reveals the 3 critical errors keeping you out of the Map Pack while your competitors steal your after-hours emergency calls.
            </p>

            <Button
              onClick={handleCTA}
              className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-8 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 active:scale-95 min-h-[56px] md:min-h-[64px] touch-manipulation"
            >
              Get My Free Plumbing Audit Now
            </Button>

            <div className="mt-6">
              <InlineSocialProof variant="stats" />
            </div>
          </motion.div>
        </div>

        {/* Pain Points */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Sound Familiar?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: "Bleeding Money on Lead Gen Sites",
                description: "Paying $100-$200 per lead to Thumbtack/Angi, only to find out the 'customer' shopped 5 other plumbers"
              },
              {
                icon: MapPin,
                title: "Not Showing Up in Google Maps",
                description: "Your shop is 2 blocks away but customers are calling competitors 10 miles out"
              },
              {
                icon: TrendingUp,
                title: "Missing Emergency Calls",
                description: "Losing $500+ jobs to competitors because homeowners can't find you at 2am when pipes burst"
              }
            ].map((pain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <pain.icon className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{pain.title}</h3>
                <p className="text-gray-400 text-sm">{pain.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 bg-[#c8ff00]/5 border-y border-[#c8ff00]/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            What You'll Discover in Your Free Audit:
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            We analyze your actual Google My Business profile and give you a complete breakdown
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Why your Map Pack ranking dropped (and how to fix it in 48 hours)",
              "The exact keywords emergency callers are using that you're NOT ranking for",
              "Which competitor is stealing your service area calls (and their weak spots)",
              "Your GMB Health Score vs. top-ranked plumbers in your zip code",
              "The review strategy that got Mike's Plumbing 47 new 5-stars in 60 days",
              "How to rank for 'emergency plumber near me' without spending a dime on ads"
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-[#c8ff00] rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-black font-bold text-sm">✓</span>
                </div>
                <p className="text-white">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
            Real Plumbers, Real Results
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                text: "Went from 12 calls/week to 47 just by fixing my GMB listing. Canceled my HomeAdvisor account — don't need it anymore.",
                author: "Mike Rodriguez",
                business: "Rodriguez Plumbing, Houston TX",
                rating: 5
              },
              {
                text: "The audit showed me I wasn't even ranking for 'emergency plumber' in my own town. Fixed it in 2 days, now I'm #1.",
                author: "Sarah Chen",
                business: "Quick Fix Plumbing, San Diego CA",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="text-sm">
                  <div className="text-white font-semibold">{testimonial.author}</div>
                  <div className="text-gray-500">{testimonial.business}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Dominate Your Local Market?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Takes 90 seconds. Zero cost. Could save you thousands in wasted ad spend.
          </p>

          <Button
            onClick={handleCTA}
            className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-12 py-8 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 active:scale-95 min-h-[64px] touch-manipulation"
          >
            Claim My Free Audit
          </Button>

          <div className="mt-6 text-sm text-gray-500">
            ✓ No credit card required  ✓ Instant results  ✓ 100% free
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}