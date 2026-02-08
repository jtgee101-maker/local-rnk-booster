import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Scale, Star, Briefcase, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function LegalLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Competitors outranking you for high-value cases", impact: "$100K+ in lost clients" },
    { icon: AlertCircle, text: "Not showing up for 'lawyer near me' searches", impact: "Missing urgent inquiries" },
    { icon: AlertCircle, text: "Low online presence vs other law firms", impact: "Clients choose competitors" },
    { icon: AlertCircle, text: "Poor reviews hurt credibility and trust", impact: "Cases go elsewhere" }
  ];

  const benefits = [
    "Rank #1 for practice area + location searches",
    "Dominate Google Map Pack in your market",
    "Attract high-value clients actively searching",
    "Build authority with verified client reviews",
    "Optimize for mobile legal searches (85% of traffic)",
    "Stand out from 50+ competing law firms"
  ];

  const stats = [
    { value: "340%", label: "More Quality Leads" },
    { value: "$180K", label: "Avg Annual Case Value Increase" },
    { value: "3.8x", label: "Higher Consultation Rate" }
  ];

  const practiceAreas = [
    "Personal Injury", "Family Law", "Criminal Defense", 
    "Estate Planning", "Business Law", "Real Estate Law"
  ];

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] overflow-x-hidden" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff00]/10 via-transparent to-blue-900/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-blue-500/20 rounded-full blur-[80px] md:blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-semibold">LEGAL-SPECIFIC SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing High-Value
              <br />
              <span className="text-[#c8ff00]">Legal Cases</span> to Other Firms
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              89% of people looking for a lawyer choose from <span className="text-white font-semibold">Google's top 3 results</span>. 
              If you're not visible, you're losing $100K+ in cases every month.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] active:bg-[#a8df00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free Law Firm Audit
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                variant="outline"
                className="border-2 border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00]/10 active:bg-[#c8ff00]/20 text-lg px-8 py-6 min-h-[56px] touch-manipulation"
              >
                See Your Rankings Now
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                >
                  <div className="text-3xl md:text-4xl font-bold text-[#c8ff00] mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Practice Areas */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-400 mb-4">Specialized SEO for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {practiceAreas.map((area, i) => (
              <span
                key={i}
                className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-full text-sm"
              >
                {area}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pain Points Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Why Law Firms Lose <span className="text-red-400">6-Figure Cases</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Potential clients can't find you when they need legal help most
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-red-500/5 border-2 border-red-500/30 rounded-xl p-6 flex items-start gap-4"
              >
                <point.icon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{point.text}</h3>
                  <p className="text-red-300 text-sm font-medium">→ {point.impact}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Benefits Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-blue-500/5 to-[#c8ff00]/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Become the <span className="text-[#c8ff00]">Go-To Law Firm</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Get found first by clients searching for legal representation
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-[#c8ff00] flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Social Proof */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-12"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-[#c8ff00] fill-[#c8ff00]" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl text-white text-center mb-6 italic">
            "We jumped from page 4 to the #1 spot for 'personal injury lawyer [city]'. Our case intake tripled in 60 days. This paid for itself with one case."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">Sarah Chen, Esq.</p>
            <p className="text-gray-500">Chen & Associates Law, Seattle WA</p>
          </div>
        </motion.div>
      </div>

      {/* Trust Badges */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Attorney-Verified Methods</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm">500+ Law Firms Helped</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            <span className="text-sm">ABA Marketing Guidelines Compliant</span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-blue-500 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            See Why You're Losing Cases
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Free audit reveals exactly why clients choose other firms + how to fix it fast
          </p>
          <Button
            onClick={() => navigate(createPageUrl('QuizV3'))}
            size="lg"
            className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-10 py-6 font-bold min-h-[56px] touch-manipulation"
          >
            <Scale className="w-5 h-5 mr-2" />
            Get More High-Value Clients
          </Button>
          <p className="text-sm text-gray-700 mt-4">⚡ Results in 72 hours • No long contracts • Ethical & compliant</p>
        </motion.div>
      </div>
    </div>
    </>
  );
}