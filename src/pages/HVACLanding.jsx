import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, TrendingUp, Star, Phone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Helmet } from 'react-helmet';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';

export default function HVACLanding() {
  const navigate = useNavigate();

  const painPoints = [
    { icon: AlertCircle, text: "Lost in search results below competitors", impact: "70% fewer calls" },
    { icon: AlertCircle, text: "Seasonal demand drops hurt revenue", impact: "$15K+ lost/month" },
    { icon: AlertCircle, text: "Not showing up for emergency HVAC searches", impact: "Missing urgent jobs" },
    { icon: AlertCircle, text: "Poor reviews or no reviews visible", impact: "Lose to competition" }
  ];

  const benefits = [
    "Rank #1 for 'emergency AC repair near me' searches",
    "Dominate Google Map Pack in your service area",
    "Get 5x more emergency service calls",
    "Build trust with verified 5-star review strategy",
    "Seasonal optimization for heating/cooling demand",
    "24/7 visibility for urgent HVAC needs"
  ];

  const stats = [
    { value: "156%", label: "Avg Call Volume Increase" },
    { value: "$47K", label: "Monthly Revenue Boost" },
    { value: "2.1x", label: "More Emergency Jobs" }
  ];

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Helmet>
      <MobileOptimizations />
      
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff00]/10 via-transparent to-blue-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c8ff00]/20 rounded-full blur-[150px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-[#c8ff00] text-sm font-semibold">HVAC-SPECIFIC SEO</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Stop Losing Emergency
              <br />
              <span className="text-[#c8ff00]">HVAC Calls</span> to Competitors
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              75% of homeowners call the <span className="text-white font-semibold">first HVAC company</span> they see on Google. 
              If you're not in the Map Pack, you don't exist.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                className="bg-[#c8ff00] text-gray-900 hover:bg-[#b8ef00] active:bg-[#a8df00] text-lg px-8 py-6 font-bold min-h-[56px] touch-manipulation"
              >
                Get Your Free HVAC Visibility Audit
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('QuizV3'))}
                size="lg"
                variant="outline"
                className="border-2 border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00]/10 active:bg-[#c8ff00]/20 text-lg px-8 py-6 min-h-[56px] touch-manipulation"
              >
                See How You Rank Now
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
            Why HVAC Companies Lose <span className="text-red-400">$15K+/Month</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Your competitors are stealing emergency calls while you're invisible
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-[#c8ff00]/5 to-blue-500/5 rounded-3xl my-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4">
            Dominate Local <span className="text-[#c8ff00]">HVAC Searches</span>
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Get found first when homeowners need heating/cooling fast
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
            "We went from 3-4 calls a day to 15+ emergency service calls. Our summer revenue doubled just from showing up first for AC repair searches."
          </blockquote>
          <div className="text-center">
            <p className="text-gray-400 font-semibold">Mike Rodriguez</p>
            <p className="text-gray-500">Rodriguez HVAC, Phoenix AZ</p>
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#c8ff00] to-green-500 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            See Where You're Losing Calls
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Free audit shows exactly why you're invisible + how to fix it in 72 hours
          </p>
          <Button
            onClick={() => navigate(createPageUrl('QuizV3'))}
            size="lg"
            className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 text-lg px-10 py-6 font-bold min-h-[56px] touch-manipulation"
          >
            <Phone className="w-5 h-5 mr-2" />
            Get More Emergency Calls Now
          </Button>
          <p className="text-sm text-gray-700 mt-4">⚡ Results in 72 hours • No contracts • Money-back guarantee</p>
        </motion.div>
      </div>
    </div>
    </>
  );
}