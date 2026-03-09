import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function FinalCTA({ onContinue, healthScore }) {
  const urgency = healthScore < 50
    ? 'Every week without action = more leads going to competitors.'
    : 'You have a solid foundation — small optimizations now deliver outsized returns.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl bg-gradient-to-br from-[#1a0a2e] to-[#0a0a1f] border-2 border-purple-500/50 p-8 sm:p-12 text-center space-y-6"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold mb-2">
        <Zap className="w-4 h-4" /> Your Report Is Ready
      </div>

      <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
        Your GMB Score is <span className={`${healthScore < 50 ? 'text-red-400' : healthScore < 70 ? 'text-amber-400' : 'text-green-400'}`}>{healthScore}/100</span>
        <br />— Here's What to Do Next
      </h2>

      <p className="text-gray-300 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
        {urgency}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg shadow-2xl shadow-purple-500/40 transition-all active:scale-95"
        >
          See Your Recommended Growth Plan
          <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ArrowRight className="w-5 h-5" />
          </motion.span>
        </motion.button>
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-semibold text-base transition-all"
        >
          Book a Strategy Call
        </motion.button>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm pt-2">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        Free to view — no credit card required
      </div>
    </motion.div>
  );
}