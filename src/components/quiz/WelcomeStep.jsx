import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, MapPin, Star } from 'lucide-react';

export default function WelcomeStep({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-lg mx-auto px-4"
    >
      {/* Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-8"
      >
        <Zap className="w-4 h-4 text-[#c8ff00]" />
        <span className="text-sm text-[#c8ff00] font-medium">Free 60-Second Audit</span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
      >
        Audit Your Local
        <br />
        <span className="text-[#c8ff00]">Ranking Power</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-lg mb-10 leading-relaxed"
      >
        See how your business appears to customers on Google and discover the #1 reason you aren't in the Map Pack.
      </motion.p>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-6 mb-10"
      >
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">Local SEO</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Star className="w-4 h-4" />
          <span className="text-sm">2,400+ Audits</span>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onStart}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
        >
          Start Free Scan
        </Button>
      </motion.div>

      {/* Micro-copy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-gray-600 text-xs mt-6"
      >
        No credit card required • Takes 60 seconds
      </motion.p>
    </motion.div>
  );
}