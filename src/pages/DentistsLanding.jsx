import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star, Users, DollarSign } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LegalFooter from '@/components/shared/LegalFooter';
import InlineSocialProof from '@/components/cro/InlineSocialProof';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function DentistsLanding() {
  React.useEffect(() => {
    base44.analytics.track({ eventName: 'dentists_landing_viewed' });
  }, []);

  const handleCTA = () => {
    base44.analytics.track({ eventName: 'dentists_landing_cta_clicked' });
    window.location.href = createPageUrl('QuizGeenius');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <Helmet>
        <title>Free GMB Audit for Dentists - Fill Your Schedule with New Patients | LocalRank.ai</title>
        <meta name="description" content="Stop relying on expensive PPC. Get 40+ new patient calls per month from Google Maps. Free AI audit for dental practices." />
        <meta name="keywords" content="dentist marketing, dental practice marketing, google my business dentists, new dental patients" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />

      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,90vw)] h-[800px] bg-cyan-500/5 rounded-full blur-[80px] md:blur-[150px]" />

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
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-semibold text-sm">FOR DENTAL PRACTICES</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Fill Your Schedule with <span className="text-[#c8ff00]">40+ New Patients</span><br />
              Without Spending <span className="text-red-400">$10K/Month</span> on Google Ads
            </h1>

            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Free AI-powered audit reveals why new patients can't find your practice on Google Maps — and how to fix it in 72 hours.
            </p>

            <Button
              onClick={handleCTA}
              className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-8 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 min-h-[56px] md:min-h-[64px] touch-manipulation"
            >
              Get My Free Dental Practice Audit
            </Button>

            <div className="mt-6">
              <InlineSocialProof variant="stats" />
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            The Hidden Cost of Poor Local SEO
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: "Burning Cash on PPC",
                description: "Spending $8-15 per click while organic competitors get FREE new patient calls from Map Pack rankings"
              },
              {
                icon: MapPin,
                title: "Invisible to Local Searches",
                description: "Families searching 'dentist near me' are booking with practices 5 miles away because yours doesn't show up"
              },
              {
                icon: Users,
                title: "Empty Chairs, Full Stress",
                description: "Gaps in your schedule while competitors are booked 3 weeks out — all from better GMB optimization"
              }
            ].map((pain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
              >
                <pain.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{pain.title}</h3>
                <p className="text-gray-400 text-sm">{pain.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 bg-[#c8ff00]/5 border-y border-[#c8ff00]/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Your Free Audit Reveals:
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Why you're not showing up for 'emergency dentist' searches (even if you offer same-day appointments)",
              "The exact review gaps keeping you out of the Top 3 Map Pack",
              "Which dental keywords have zero competition in your area (easy wins)",
              "Your GMB completeness score vs. top-ranked dentists within 5 miles",
              "The photo strategy that helped Dr. Smith get 63 new patients in 90 days",
              "How to rank for 'cosmetic dentist' + 'implants' without spending on ads"
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

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
            Trusted by 2,000+ Dental Practices
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                text: "We went from 12 new patients/month to 47. I stopped my Google Ads completely. This audit changed everything.",
                author: "Dr. Jennifer Park",
                business: "Bright Smiles Dentistry, Seattle WA",
                rating: 5
              },
              {
                text: "Fixed 3 GMB errors in one afternoon. Now we're #1 for 'family dentist' in our town. Worth every minute.",
                author: "Dr. Michael Torres",
                business: "Torres Family Dental, Austin TX",
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

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Getting More New Patients This Week
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            90-second audit. Zero cost. Results you can implement today.
          </p>

          <Button
            onClick={handleCTA}
            className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-12 py-8 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 min-h-[64px] touch-manipulation"
          >
            Claim My Free Audit
          </Button>

          <div className="mt-6 text-sm text-gray-500">
            ✓ No credit card  ✓ Instant results  ✓ HIPAA-compliant
          </div>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}