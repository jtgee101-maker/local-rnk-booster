import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Home, Star, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function RoofersLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Storm chasers outranking your established company", impact: "$100K+ lost per season" },
    { icon: AlertCircle, text: "Not visible for 'roofer near me' searches", impact: "Insurance jobs go elsewhere" },
    { icon: AlertCircle, text: "HomeAdvisor taking 15-20% of every lead", impact: "Paying for your own customers" },
    { icon: AlertCircle, text: "Low review count vs fly-by-night operations", impact: "Credibility questioned" }
  ];

  const benefits = [
    "Rank #1 for emergency roof repair",
    "Dominate Map Pack during storm season",
    "Get insurance restoration referrals",
    "Show certifications & licensing",
    "Build long-term customer trust",
    "Stop paying lead aggregator fees"
  ];

  const stats = [
    { value: "310%", label: "More Roof Inquiries" },
    { value: "$120K", label: "Monthly Revenue Increase" },
    { value: "4.5x", label: "Larger Project Value" }
  ];

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] overflow-x-hidden" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-transparent to-[#c8ff00]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-slate-500/20 rounded-full blur-[80px] md:blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-slate-500/10 border border-slate-500/30 rounded-full px-4 py-2 mb-6">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm font-semibold">ROOFING SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing Projects to
              <br />
              <span className="text-[#c8ff00]">Storm Chasers & Aggregators</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              84% of homeowners with roof damage search <span className="text-white font-semibold">'roofer near me'</span> first. 
              If you're not visible, out-of-state contractors are stealing your insurance jobs.
            </p>

            {/* Mascot Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/0f8365acc_image_e83e280e-f84a-465e-9658-b91853417110.png"
                alt="LocalRank Roofer Mascot"
                className="w-full max-w-md rounded-3xl shadow-2xl shadow-slate-500/20"
              />
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] active:bg-[#a8df00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free Roofing Audit
              </Button>
            </div>

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            Why Established Roofers Lose <span className="text-red-400">$100K+ Per Storm</span>
          </h2>

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-500/5 to-[#c8ff00]/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            Become the <span className="text-[#c8ff00]">Trusted Local Roofer</span>
          </h2>

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
            "After the last storm, we closed $450K in insurance jobs in 60 days. All from being #1 in Google Maps. No HomeAdvisor fees."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">Rick Morrison</p>
            <p className="text-gray-500">Morrison Roofing, Dallas TX</p>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-slate-500 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Dominate Your Storm Season
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Free audit shows why storm chasers win + how established roofers can dominate local search
          </p>
          <Button
            onClick={() => navigate(createPageUrl('QuizV3'))}
            size="lg"
            className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-10 py-6 font-bold min-h-[56px] touch-manipulation"
          >
            <Shield className="w-5 h-5 mr-2" />
            Get More Insurance Jobs
          </Button>
        </motion.div>
      </div>
    </div>
    </>
  );
}