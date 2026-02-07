import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, Star, Phone, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const beforeStats = [
  { label: 'Map Pack Rank', value: '#7', icon: TrendingUp, color: 'text-red-400' },
  { label: 'Monthly Calls', value: '12', icon: Phone, color: 'text-red-400' },
  { label: 'Review Rating', value: '3.8', icon: Star, color: 'text-red-400' },
  { label: 'Monthly Revenue', value: '$4.2K', icon: DollarSign, color: 'text-red-400' }
];

const afterStats = [
  { label: 'Map Pack Rank', value: '#1', icon: TrendingUp, color: 'text-[#c8ff00]' },
  { label: 'Monthly Calls', value: '87', icon: Phone, color: 'text-[#c8ff00]' },
  { label: 'Review Rating', value: '4.9', icon: Star, color: 'text-[#c8ff00]' },
  { label: 'Monthly Revenue', value: '$31K', icon: DollarSign, color: 'text-[#c8ff00]' }
];

export default function VisualizeFutureStep({ onContinue, businessName }) {
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAfter(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 rounded-full px-5 py-2 mb-6"
        >
          <span className="text-sm text-purple-400 font-bold">✨ VISUALIZE YOUR SUCCESS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
        >
          Imagine {businessName || 'Your Business'} <br />
          <span className="text-[#c8ff00]">Dominating the Map Pack</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto"
        >
          Here's what happens when you fix those 3 critical errors we found...
        </motion.p>
      </div>

      {/* Before & After Comparison */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Before */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="absolute -top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            BEFORE
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 h-full">
            <div className="space-y-6">
              {beforeStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-gray-500 text-sm italic">
                "Struggling to compete, losing leads to competitors daily..."
              </p>
            </div>
          </div>
        </motion.div>

        {/* After */}
        <AnimatePresence>
          {showAfter && (
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -top-4 left-4 bg-[#c8ff00] text-black px-3 py-1 rounded-full text-xs font-bold z-10">
                AFTER (30 DAYS)
              </div>
              <motion.div
                className="bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border-2 border-[#c8ff00] rounded-2xl p-8 h-full relative overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(200,255,0,0.2)',
                    '0 0 40px rgba(200,255,0,0.4)',
                    '0 0 20px rgba(200,255,0,0.2)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff00]/5 to-transparent" />
                
                <div className="relative space-y-6">
                  {afterStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-gray-300 text-sm font-medium">{stat.label}</span>
                      </div>
                      <motion.span
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                        className={`text-2xl font-bold ${stat.color}`}
                      >
                        {stat.value}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[#c8ff00]/30 relative">
                  <p className="text-gray-300 text-sm font-medium">
                    "Dominating my area, phone won't stop ringing! 🚀"
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Key Transformations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: showAfter ? 1.5 : 0 }}
        className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 mb-8"
      >
        <h3 className="text-white font-bold text-xl mb-6 text-center">
          🎯 What Changed in Just 30 Days?
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: '625% more calls', desc: 'Fixed GMB profile errors' },
            { label: '#1 ranking', desc: 'Optimized keywords & categories' },
            { label: '638% revenue boost', desc: 'Implemented all 3 fixes' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: showAfter ? 1.6 + index * 0.1 : 0 }}
              className="text-center"
            >
              <div className="text-[#c8ff00] font-bold text-2xl mb-2">{item.label}</div>
              <div className="text-gray-400 text-sm">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: showAfter ? 2 : 0 }}
        className="text-center"
      >
        <Button
          onClick={onContinue}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-12 py-7 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,255,0,0.4)] hover:scale-105"
        >
          Show Me My Custom Strategy
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-gray-500 text-sm mt-4">
          See your exact roadmap to dominate the Map Pack
        </p>
      </motion.div>
    </motion.div>
  );
}