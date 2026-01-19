import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const leadOptions = [
  { value: 2, label: '1-3 leads', cost: '$200-600/week', desc: 'Low volume, high waste' },
  { value: 5, label: '4-7 leads', cost: '$400-1,400/week', desc: 'Moderate dependency' },
  { value: 10, label: '8-15 leads', cost: '$800-3,000/week', desc: 'Heavy platform reliance' },
  { value: 20, label: '15+ leads', cost: '$1,500+/week', desc: 'Critical revenue leak' }
];

export default function V2LeadsLostStep({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-4"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-red-400 font-semibold">QUESTION 2 OF 3</span>
        </motion.div>
        
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          How Many <span className="text-red-400">Shared Leads</span> Did You Lose<br />
          to Competitors <span className="text-[#c8ff00]">Last Week</span>?
        </h2>
        <p className="text-gray-400 text-lg mb-6">
          Every lead you pay for is likely being sold to 3-5 of your competitors
        </p>

        {/* Adrenaline Trigger */}
        <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm font-semibold">This is costing you thousands</span>
        </div>
      </div>

      <div className="space-y-3">
        {leadOptions.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.value)}
            className="w-full group bg-gray-900/50 border-2 border-gray-800 hover:border-[#c8ff00]/50 rounded-2xl p-6 text-left transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-white group-hover:text-[#c8ff00] transition-colors">
                {option.label}
              </h3>
              <span className="text-red-400 font-semibold">{option.cost}</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">{option.desc}</p>
            <div className="text-[#c8ff00] text-sm font-medium group-hover:underline">
              Select this range →
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-gray-600 text-sm mt-6">
        Don't worry - we'll show you exactly how to stop this revenue leak
      </p>
    </motion.div>
  );
}