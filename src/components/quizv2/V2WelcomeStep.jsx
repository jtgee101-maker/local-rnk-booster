import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingDown, Zap, Users, Award } from 'lucide-react';

export default function V2WelcomeStep({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-4 text-center"
    >
      {/* Premium Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c8ff00]/20 to-emerald-500/20 border border-[#c8ff00]/40 rounded-full px-6 py-3 mb-8"
      >
        <TrendingDown className="w-5 h-5 text-[#c8ff00] animate-pulse" />
        <span className="text-[#c8ff00] font-bold text-sm md:text-base">LEAD INDEPENDENCE ANALYSIS</span>
      </motion.div>

      {/* Premium Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
      >
        Stop <span className="text-[#c8ff00]">Paying</span> for<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] via-emerald-400 to-teal-400">Shared Leads</span>
      </motion.h1>

      {/* Subheadline with powerful messaging */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-10"
      >
        <p className="text-xl md:text-2xl text-gray-300 font-medium">
          Discover how much revenue you're <span className="text-red-400">actually losing</span> to Thumbtack, HomeAdvisor, Angi, and Scorpion
        </p>
        <p className="text-lg text-white font-medium">
          The same lead you pay $100 for is being sold to 4 of your competitors right now.
        </p>
      </motion.div>

      {/* Premium Hook Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#c8ff00]/15 via-emerald-500/10 to-teal-500/5 border-2 border-[#c8ff00]/40 rounded-3xl p-8 md:p-10 mb-12 backdrop-blur-sm"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-[#c8ff00]/20 flex-shrink-0">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#c8ff00]" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Your Personal Lead Independence Audit</h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Our AI instantly analyzes your business profile to calculate your exact "lead-gen tax" — the money you'd save by owning your rankings instead of renting leads from platforms that sell you out.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: Zap, label: '60-Second Scan' },
            { icon: Award, label: 'AI Personalized' },
            { icon: Users, label: 'Zero Commitment' }
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 md:p-4 flex flex-col items-center gap-2">
              <item.icon className="w-5 h-5 text-[#c8ff00]" />
              <span className="text-xs md:text-sm text-gray-300 font-medium text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Premium CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <Button
          onClick={onStart}
          className="w-full md:w-auto bg-gradient-to-r from-[#c8ff00] to-emerald-400 hover:from-[#d4ff33] hover:to-emerald-300 text-black font-bold text-lg md:text-xl px-12 md:px-20 py-7 md:py-8 rounded-full shadow-[0_0_60px_rgba(200,255,0,0.3)] hover:shadow-[0_0_80px_rgba(200,255,0,0.5)] hover:scale-105 transition-all duration-300 transform active:scale-95 min-h-[56px] touch-manipulation"
        >
          <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2" />
          Start My Lead Independence Audit
        </Button>

        <p className="text-gray-600 text-sm md:text-base">
          Instantly see your annual lead-gen costs • No credit card • Results in 60 seconds
        </p>
      </motion.div>

      {/* Trust & Social Proof */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-14 pt-10 border-t border-gray-800 space-y-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#c8ff00]">45,000+</div>
            <div className="text-gray-500 text-sm">Audits Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-emerald-400">$124M+</div>
            <div className="text-gray-500 text-sm">Revenue Identified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-teal-400">4.9/5</div>
            <div className="text-gray-500 text-sm">Client Rating</div>
          </div>
        </div>

        <div className="text-gray-600 text-xs md:text-sm">
          ✓ 100% Free • ✓ Completely Confidential • ✓ Instant Analysis
        </div>
      </motion.div>
    </motion.div>
  );
}