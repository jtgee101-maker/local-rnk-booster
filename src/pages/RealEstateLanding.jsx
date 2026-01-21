import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Home, Star, TrendingUp, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function RealEstateLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Not showing up for 'homes for sale near me'", impact: "Lost to Zillow/Redfin" },
    { icon: AlertCircle, text: "Buried below mega-brokerages in search", impact: "Missing buyer leads" },
    { icon: AlertCircle, text: "Low online presence vs competing agents", impact: "Sellers pick others" },
    { icon: AlertCircle, text: "Few reviews compared to top agents", impact: "Lose credibility" }
  ];

  const benefits = [
    "Rank #1 for '[neighborhood] real estate agent' searches",
    "Dominate local Map Pack in your farm area",
    "Get more qualified buyer & seller leads",
    "Build trust with verified client testimonials",
    "Optimize for mobile (80% of homebuyers search mobile)",
    "Stand out from 100+ competing agents"
  ];

  const stats = [
    { value: "285%", label: "More Qualified Leads" },
    { value: "$240K", label: "Avg Annual Commission Increase" },
    { value: "4.2x", label: "More Listing Appointments" }
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff00]/10 via-transparent to-purple-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-purple-500/20 rounded-full blur-[80px] md:blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Home className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-semibold">REAL ESTATE SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing Listings
              <br />
              <span className="text-[#c8ff00]">to Zillow & Big Brokerages</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              82% of buyers & sellers search for <span className="text-white font-semibold">local agents on Google</span>. 
              If you're not on page 1, you're invisible to motivated clients.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free Agent Visibility Audit
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                variant="outline"
                className="border-2 border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00]/10 text-lg px-8 py-6 min-h-[56px] touch-manipulation"
              >
                See Where You Rank
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

      {/* Pain Points Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Why Agents Lose <span className="text-red-400">$200K+/Year</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Zillow and mega-brokerages are stealing your local leads
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-purple-500/5 to-[#c8ff00]/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Become the <span className="text-[#c8ff00]">Go-To Local Agent</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Get found first by motivated buyers and sellers in your area
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
            "I went from 2-3 listings a month to 12+ after dominating local search. Now I'm the first agent homeowners see when they search for help in our neighborhood."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">Jennifer Martinez</p>
            <p className="text-gray-500">Top Producer, Keller Williams, Austin TX</p>
          </div>
        </motion.div>
      </div>

      {/* Neighborhood Focus */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-500/10 to-[#c8ff00]/10 border border-purple-500/30 rounded-2xl p-8 text-center"
        >
          <MapPin className="w-12 h-12 text-[#c8ff00] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Own Your Farm Area</h3>
          <p className="text-gray-300 max-w-2xl mx-auto">
            We optimize your Google My Business to dominate specific neighborhoods. 
            When homeowners search "realtor in [your area]", <span className="text-[#c8ff00] font-semibold">you show up first</span>.
          </p>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-purple-500 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            See Why You're Losing Listings
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Free audit shows exactly where you're invisible + how to dominate your area
          </p>
          <Button
            onClick={() => navigate(createPageUrl('QuizV3'))}
            size="lg"
            className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-10 py-6 font-bold min-h-[56px] touch-manipulation"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Get More Listings & Buyers
          </Button>
          <p className="text-sm text-gray-700 mt-4">⚡ Results in 72 hours • No long contracts • Proven for agents</p>
        </motion.div>
      </div>
    </div>
    </>
  );
}