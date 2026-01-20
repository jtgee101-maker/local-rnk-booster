import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, DollarSign, Zap, ArrowRight, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ResultsV3({ healthScore, criticalIssues, businessName, onCTA }) {
  const lostRevenue = Math.round((100 - healthScore) * 150); // $150 per point lost
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 pb-8"
    >
      {/* Health Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-2xl p-8 mb-6 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="text-red-300 font-semibold text-sm">CRITICAL ISSUES DETECTED</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
          {businessName}'s Local Health Score
        </h2>
        
        <div className="relative inline-block mb-6">
          <div className="text-8xl font-black text-red-400">{healthScore}</div>
          <div className="text-2xl text-gray-400 font-semibold">/100</div>
        </div>

        {/* Lost Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 max-w-md mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-gray-400 text-sm">Estimated Lost Revenue</span>
          </div>
          <div className="text-4xl font-bold text-red-400 mb-1">
            ${lostRevenue.toLocaleString()}<span className="text-lg text-gray-500">/mo</span>
          </div>
          <p className="text-xs text-gray-500">
            Due to invisible rankings and Thumbtack-style aggregator fees
          </p>
        </motion.div>
      </motion.div>

      {/* Critical Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 mb-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          What's Killing Your Rankings
        </h3>
        <div className="space-y-4">
          {criticalIssues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
            >
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-red-400 font-bold text-sm">{index + 1}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{issue}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* The Villain (WOMP Framework) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 md:p-8 mb-6"
      >
        <h3 className="text-xl font-bold text-white mb-3">
          💰 The Hidden Tax You're Paying
        </h3>
        <p className="text-gray-300 mb-4">
          Aggregators like Thumbtack and Angi are charging you <span className="text-orange-400 font-bold">$25-$100 per lead</span> for customers who were already searching for businesses like yours on Google.
        </p>
        <p className="text-gray-400 text-sm">
          <span className="text-[#c8ff00] font-semibold">The reality:</span> Those customers found YOU organically, but because your Google profile isn't optimized, they're being intercepted by lead-gen platforms who then charge you to "connect" you with your own customers.
        </p>
      </motion.div>

      {/* The Solution */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="bg-gradient-to-br from-[#c8ff00]/15 via-green-500/10 to-[#c8ff00]/5 border-2 border-[#c8ff00]/50 rounded-2xl p-8 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-[#c8ff00]/20 border border-[#c8ff00]/40 rounded-full px-4 py-2 mb-4">
          <Zap className="w-4 h-4 text-[#c8ff00]" />
          <span className="text-[#c8ff00] font-semibold text-sm">SOLUTION FOUND</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Fix These Errors <span className="text-[#c8ff00]">Automatically</span> (Free Trial)
        </h3>

        <p className="text-gray-300 mb-2 max-w-2xl mx-auto">
          Our AI found 3 critical errors costing you ${lostRevenue.toLocaleString()}/mo. Usually, an agency charges <span className="line-through text-gray-500">$2,000/mo</span> to fix these.
        </p>

        <p className="text-[#c8ff00] font-semibold text-lg mb-6">
          You can fix them yourself for FREE using the Paige AI Automation tool.
        </p>

        {/* Trust Elements */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
            <div className="text-[#c8ff00] font-bold text-2xl mb-1">72hrs</div>
            <div className="text-gray-400 text-xs">Avg. Time to Map Pack</div>
          </div>
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
            <div className="text-[#c8ff00] font-bold text-2xl mb-1">$0</div>
            <div className="text-gray-400 text-xs">Agency Fees Saved</div>
          </div>
          <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
            <div className="text-[#c8ff00] font-bold text-2xl mb-1">AI</div>
            <div className="text-gray-400 text-xs">Automated Optimization</div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onCTA}
          className="w-full max-w-md mx-auto bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold py-8 text-xl rounded-xl transition-all duration-300 hover:shadow-[0_0_60px_rgba(200,255,0,0.5)] transform hover:scale-105 active:scale-95 min-h-[64px] touch-manipulation"
        >
          <Zap className="w-6 h-6 mr-2" />
          Activate My Free AI Fix
          <ArrowRight className="w-6 h-6 ml-2" />
        </Button>

        <p className="text-gray-500 text-xs mt-4">
          ⚡ Free trial • No credit card required • Cancel anytime
        </p>

        {/* Scarcity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-300 text-sm font-semibold">
            ⏰ Free trials limited by zip code. Claim yours before your competitor does.
          </p>
        </motion.div>
      </motion.div>

      {/* Trust Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-8 text-center"
      >
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#c8ff00]" />
            <span>Powered by Paige AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            <span>7M+ Businesses</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}