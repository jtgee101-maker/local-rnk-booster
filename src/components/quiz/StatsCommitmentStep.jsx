import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Award } from 'lucide-react';

const stats = [
  {
    number: '7M+',
    label: 'unique business audits discovered through our platform'
  },
  {
    number: '87%',
    label: 'of business owners said their ranking strategy became clearer after the audit'
  },
  {
    number: '92%',
    label: 'felt our competitor analysis guided their Map Pack strategy'
  }
];

export default function StatsCommitmentStep({ onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/50 mb-6"
      >
        <TrendingUp className="w-8 h-8 text-purple-400" />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-white mb-8"
      >
        Are you ready to dominate your local market?
      </motion.h1>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8 space-y-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-left"
          >
            <div className="text-3xl md:text-4xl font-bold text-[#c8ff00] mb-2">
              {stat.number}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onContinue}
          className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
        >
          Continue
        </Button>

        <p className="text-xs text-gray-600 mt-4">
          🔒 Secure • ⚡ Instant Access
        </p>
      </motion.div>
    </motion.div>
  );
}