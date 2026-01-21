import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Zap, Star, Phone, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';

export default function ElectriciansLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Emergency calls going to big-box electricians", impact: "$8K+ lost weekly" },
    { icon: AlertCircle, text: "Not visible for 'electrician near me' searches", impact: "Competitors get calls" },
    { icon: AlertCircle, text: "Unlicensed handymen outranking you online", impact: "Safety risks ignored" },
    { icon: AlertCircle, text: "Low online reviews vs established companies", impact: "Trust issues" }
  ];

  const benefits = [
    "Rank #1 for emergency electrical searches",
    "Dominate Map Pack over handymen",
    "Get 24/7 emergency service calls",
    "Show licensing & expertise online",
    "Build trust with verified reviews",
    "Stop losing to Home Depot contractors"
  ];

  const stats = [
    { value: "240%", label: "More Service Calls" },
    { value: "$72K", label: "Monthly Revenue Boost" },
    { value: "3.2x", label: "More Emergency Jobs" }
  ];

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-[#c8ff00]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-semibold">ELECTRICIAN SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing Emergency Calls
              <br />
              <span className="text-[#c8ff00]">to Unlicensed Handymen</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              79% of electrical emergencies start with <span className="text-white font-semibold">'electrician near me'</span>. 
              If you're not visible, unlicensed competitors are taking dangerous jobs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] active:bg-[#a8df00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free Visibility Audit
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
            Why Licensed Electricians Lose <span className="text-red-400">$70K+/Month</span>
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-yellow-500/5 to-[#c8ff00]/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            Become the <span className="text-[#c8ff00]">Go-To Licensed Electrician</span>
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
            "We're now the first electrician people see for power outages and panel upgrades. Emergency calls tripled in 30 days."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">James Parker</p>
            <p className="text-gray-500">Parker Electric, Houston TX</p>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-yellow-500 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Get More Emergency Service Calls
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Free audit reveals why homeowners pick handymen + how to dominate with licensing
          </p>
          <Button
            onClick={() => navigate(createPageUrl('QuizV3'))}
            size="lg"
            className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-10 py-6 font-bold min-h-[56px] touch-manipulation"
          >
            <Phone className="w-5 h-5 mr-2" />
            Start Getting Better Calls
          </Button>
        </motion.div>
      </div>
    </div>
    </>
  );
}