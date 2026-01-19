import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Zap } from 'lucide-react';

export default function V2WelcomeStep({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-4 text-center"
    >
      {/* Alert Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-3 mb-8"
      >
        <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
        <span className="text-red-400 font-bold">REVENUE LEAK DETECTED</span>
      </motion.div>

      {/* Headline */}
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
        Stop <span className="text-red-400">"Renting"</span> Your Leads from Thumbtack.<br />
        Start <span className="text-[#c8ff00]">Owning</span> the Map Pack.
      </h1>

      {/* Subheadline */}
      <p className="text-xl text-gray-400 mb-4">
        Are you tired of paying Angi, HomeAdvisor, and Thumbtack to sell the <span className="text-red-400 font-semibold">same lead</span> to 5 of your competitors?
      </p>
      <p className="text-lg text-gray-500 mb-8">
        Stop funding their growth. Start fueling yours.
      </p>

      {/* The Hook */}
      <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-8 mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <DollarSign className="w-8 h-8 text-red-400" />
          <h2 className="text-2xl font-bold text-white">The Lead-Theft Audit</h2>
        </div>
        <p className="text-gray-300 mb-6">
          Our 60-second AI scan reveals exactly how much revenue you're losing to third-party aggregators and shady agencies like Olly Olly, Scorpion, and Web.com.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            <span>60-Second Scan</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            <span>See Real Revenue Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c8ff00]" />
            <span>No Credit Card</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onStart}
        className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-xl px-16 py-8 rounded-xl shadow-[0_0_40px_rgba(200,255,0,0.3)] hover:scale-105 transition-all mb-6"
      >
        Start My Lead-Theft Audit Now
      </Button>

      <p className="text-gray-600 text-sm">
        Join 7M+ business owners who stopped renting and started owning
      </p>

      {/* Trust Elements */}
      <div className="mt-12 flex items-center justify-center gap-8 flex-wrap text-gray-500 text-sm">
        <div>✓ No Credit Card</div>
        <div>✓ 100% Free Scan</div>
        <div>✓ Instant Results</div>
        <div>✓ 4.9★ Rating</div>
      </div>
    </motion.div>
  );
}