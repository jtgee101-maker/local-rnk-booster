import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Hammer, Star, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

export default function ContractorsLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Homeowners can't find you when they need repairs", impact: "Jobs go to competitors" },
    { icon: AlertCircle, text: "Not showing in 'contractor near me' searches", impact: "$50K+ lost monthly" },
    { icon: AlertCircle, text: "Low review count vs established contractors", impact: "Lose trust instantly" },
    { icon: AlertCircle, text: "Unlicensed competitors outranking you", impact: "Race to bottom pricing" }
  ];

  const benefits = [
    "Rank #1 for 'general contractor near me'",
    "Dominate Map Pack for home improvement",
    "Get emergency repair calls 24/7",
    "Build credibility with verified reviews",
    "Stand out from unlicensed competition",
    "Fill your schedule 3-6 months out"
  ];

  const stats = [
    { value: "220%", label: "More Project Inquiries" },
    { value: "$85K", label: "Monthly Revenue Increase" },
    { value: "3.5x", label: "Larger Project Value" }
  ];

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      <MobileViewportFix />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-[#c8ff00]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-orange-500/20 rounded-full blur-[100px] md:blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <Hammer className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-semibold">CONTRACTOR-SPECIFIC SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing Jobs to
              <br />
              <span className="text-[#c8ff00]">Unlicensed Competitors</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              73% of homeowners hire the <span className="text-white font-semibold">first contractor they see</span> on Google. 
              If you're not visible, unlicensed handymen are stealing your projects.
            </p>

            {/* Mascot Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/bd159c3c4_image_4a6827e0-cd50-4185-bab5-fa7ecf3a2086.png"
                alt="LocalRank Contractor Mascot"
                className="w-full max-w-md rounded-3xl shadow-2xl shadow-orange-500/20"
              />
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizGeenius'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] active:bg-[#a8df00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free Contractor Audit
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
            Why Licensed Contractors Lose <span className="text-red-400">$50K+/Month</span>
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-orange-500/5 to-[#c8ff00]/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            Become the <span className="text-[#c8ff00]">Trusted Local Contractor</span>
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
            "We're now booked 4 months out with quality kitchen remodels. Before, we were chasing small jobs. Google visibility changed everything."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">Tom Anderson</p>
            <p className="text-gray-500">Anderson Construction, Denver CO</p>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-orange-500 rounded-3xl p-6 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-5xl font-bold text-gray-900 mb-4">
            Get More High-Value Projects
          </h2>
          <p className="text-base md:text-xl text-gray-800 mb-8">
            Free audit reveals why homeowners pick other contractors + how to win premium jobs
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate(createPageUrl('QuizGeenius'))}
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-base md:text-lg px-6 md:px-10 py-5 md:py-6 font-bold min-h-[48px] md:min-h-[56px] w-full sm:w-auto touch-manipulation"
            >
              <Shield className="w-5 h-5 mr-2" />
              Start Getting Better Projects
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}