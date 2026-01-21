import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, MapPin, Star, TrendingUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LegalFooter from '@/components/shared/LegalFooter';
import InlineSocialProof from '@/components/cro/InlineSocialProof';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function RestaurantsLanding() {
  React.useEffect(() => {
    base44.analytics.track({ eventName: 'restaurants_landing_viewed' });
  }, []);

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'restaurants_landing_cta_clicked' });
    window.location.href = createPageUrl('QuizV3');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <Helmet>
        <title>Free GMB Audit for Restaurants - Fill Tables Every Night | LocalRank.ai</title>
        <meta name="description" content="Stop losing diners to competitors. Get more foot traffic and reservations from Google Maps. Free AI audit for restaurants." />
        <meta name="keywords" content="restaurant marketing, google my business restaurants, local seo restaurants, restaurant visibility" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />

      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,90vw)] h-[800px] bg-orange-500/5 rounded-full blur-[80px] md:blur-[150px]" />

      <div className="relative z-10">
        <header className="p-6 text-center">
          <div className="text-[#c8ff00] font-bold text-2xl tracking-tight">
            LocalRank<span className="text-white">.ai</span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm">FOR RESTAURANTS & CAFES</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Fill Every Table Without <span className="text-red-400">Paying 30%</span> to DoorDash<br />
              <span className="text-[#c8ff00]">Own Your Google Maps Presence</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Free AI audit shows why hungry customers walk past your door to eat at competitors — and how to fix it this weekend.
            </p>

            <Button
              onClick={handleCTA}
              className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-8 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 min-h-[56px] md:min-h-[64px] touch-manipulation"
            >
              Get My Free Restaurant Audit
            </Button>

            <div className="mt-6">
              <InlineSocialProof variant="stats" />
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Why Local Visibility Matters More Than Ever
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Lost Foot Traffic",
                description: "70% of diners use Google Maps to find restaurants. If you're not in the Top 3, you're invisible."
              },
              {
                title: "Delivery App Fees Killing Margins",
                description: "Paying 25-30% to Uber Eats when you could be driving direct reservations from Google for free"
              },
              {
                title: "Competitors Stealing Your Keywords",
                description: "They rank for 'best Italian restaurant' in your neighborhood while you don't even show up"
              }
            ].map((pain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-2">{pain.title}</h3>
                <p className="text-gray-400 text-sm">{pain.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 bg-[#c8ff00]/5 border-y border-[#c8ff00]/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Your Free Audit Includes:
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Why you're not showing up for '[cuisine type] near me' searches in your own zip code",
              "The photo mistakes costing you 40% of potential walk-ins",
              "Exactly how many reviews you need to outrank the restaurant next door",
              "The menu keywords that drive the most reservations (and which ones to remove)",
              "How to get featured in Google's 'Popular Dishes' carousel",
              "The hours/location data errors sending customers to wrong address"
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

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Filling Tables This Week
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Takes 2 minutes. Zero cost. Immediate actionable insights.
          </p>

          <Button
            onClick={handleCTA}
            className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-12 py-8 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 min-h-[64px] touch-manipulation"
          >
            Claim My Free Audit
          </Button>

          <div className="mt-6 text-sm text-gray-500">
            ✓ No credit card  ✓ Instant results  ✓ 100% free
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}