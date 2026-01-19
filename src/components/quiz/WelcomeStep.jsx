import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, MapPin, Star, Shield, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import FlowPreview from './FlowPreview';
import { useABTest } from '@/components/abtest/ABTestProvider';

export default function WelcomeStep({ onStart }) {
  const { getVariant, trackView } = useABTest();
  const headlineVariant = getVariant('quiz', 'headline');

  useEffect(() => {
    trackView('quiz', 'headline');
  }, []);

  const headline = headlineVariant?.variant?.content?.headline || 'Stop Losing 15 Calls a Day To Your Competitors';
  const subheadline = headlineVariant?.variant?.content?.subheadline || "Don't Read a 100-Page Blueprint. Run Our 60-Second AI Scan.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-4xl mx-auto px-4"
    >
      {/* Dopamine Badge - Instant Reward Hook */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-5 py-2 mb-6"
      >
        <Zap className="w-5 h-5 text-red-400 animate-pulse" />
        <span className="text-sm text-red-400 font-bold tracking-wide">⚡ 82% OFF - EXPIRES IN 14 MINUTES</span>
      </motion.div>

      {/* Main Headline - Dopamine Hook */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight"
        dangerouslySetInnerHTML={{ __html: headline }}
      />

      {/* Subheadline - Pain + Promise */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-300 text-xl md:text-2xl mb-4 leading-relaxed font-medium"
      >
        {subheadline}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-gray-500 text-base mb-10"
      >
        Auto-fix the $2,000/mo agency errors for the price of a coffee — no technical skills required
      </motion.p>

      {/* Serotonin - Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-8 mb-10 text-sm"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-full border-3 border-[#0a0a0f] overflow-hidden shadow-lg">
                  <div className={`w-full h-full ${
                    i === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    i === 1 ? 'bg-gradient-to-br from-[#c8ff00] to-yellow-400' :
                    i === 2 ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                    'bg-gradient-to-br from-green-400 to-emerald-500'
                  } flex items-center justify-center text-white font-bold text-xs`}>
                    {i === 0 ? '👨‍💼' : i === 1 ? '👩‍💼' : i === 2 ? '🏪' : '🔧'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold">7M+ Business Owners</div>
            <div className="text-gray-500 text-xs">discovered their ranking blind spots</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
            ))}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold">4.9/5 Rating</div>
            <div className="text-gray-500 text-xs">from 89,000+ verified audits</div>
          </div>
        </div>
      </motion.div>

      {/* What You'll Get - Value Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 max-w-2xl mx-auto"
      >
        <h3 className="text-white font-bold text-lg mb-4">Your Personalized Audit Reveals:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-left">
              {[
                { icon: TrendingUp, text: 'Instant "Map Pack Gap" analysis showing lost revenue' },
                { icon: MapPin, text: 'AI-powered scan of 40+ directories in 60 seconds' },
                { icon: CheckCircle, text: '1-click automated optimization (not a homework manual)' },
                { icon: Award, text: 'Same software $2,000/mo agencies use — for $0.11/day' }
              ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="w-3 h-3 text-[#c8ff00]" />
              </div>
              <span className="text-gray-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Button - Adrenaline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-6"
      >
        <Button
          onClick={onStart}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-12 py-7 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,255,0,0.4)] hover:scale-105"
        >
          <Clock className="w-5 h-5 mr-2" />
          Claim My Free Audit Now
        </Button>
      </motion.div>

      {/* Endorphin - Ease + Guarantee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap justify-center gap-4 text-xs text-gray-500"
      >
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Results in 60 seconds</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#c8ff00]" />
          <span>100% Free Analysis</span>
        </div>
      </motion.div>

      {/* Oxytocin - Mini Testimonial */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-10 max-w-xl mx-auto"
      >
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
          <div className="flex gap-1 mb-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
            ))}
          </div>
          <p className="text-gray-400 text-sm italic mb-3">
            "I never imagined finding the exact reason I wasn't ranking. The audit showed me 3 errors I fixed in 10 minutes, and I'm now in the Top 3!"
          </p>
          <div className="text-gray-500 text-xs">
            <span className="font-semibold text-gray-300">Michael R.</span> • HVAC Owner, Phoenix
          </div>
        </div>
      </motion.div>

      {/* Flow Preview */}
      <FlowPreview />
    </motion.div>
  );
}