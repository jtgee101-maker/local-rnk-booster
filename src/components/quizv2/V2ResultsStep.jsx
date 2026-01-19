import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, TrendingUp, Shield, Zap, CheckCircle } from 'lucide-react';

export default function V2ResultsStep({ 
  healthScore, 
  criticalIssues, 
  businessName, 
  thumbtackTax,
  leadSource,
  onCTA 
}) {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getScoreColor = (score) => {
    if (score >= 70) return { color: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 50) return { color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { color: 'text-red-500', bg: 'bg-red-500' };
  };

  const scoreStyle = getScoreColor(healthScore);
  const platformName = leadSource === 'scorpion' ? 'Agency Fees' : 'Lead Costs';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 pb-12"
    >
      {/* Scan Complete */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-6 py-3 mb-4">
          <CheckCircle className="w-5 h-5 text-[#c8ff00]" />
          <span className="text-[#c8ff00] font-bold">SCAN COMPLETE</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
          {businessName}'s <span className="text-red-400">Revenue Leak</span> Report
        </h1>
        <p className="text-gray-400">
          Here's exactly how much you're losing to lead-gen platforms
        </p>
      </motion.div>

      {/* Thumbtack Tax Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-3 border-red-500/50 rounded-3xl p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-red-500/20">
            <DollarSign className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Annual {platformName}</div>
            <div className="text-4xl md:text-5xl font-bold text-red-400">
              ${thumbtackTax.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-xl p-6 mb-4">
          <h3 className="text-white font-semibold mb-3">What You Could Do With This Money:</h3>
          <div className="space-y-2 text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
              <span>Hire 2 full-time team members</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
              <span>Buy 3 work vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
              <span>Own your digital assets forever</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Instead, you're <span className="text-red-400 font-semibold">renting</span> leads that your competitors also get
          </p>
        </div>
      </motion.div>

      {/* GMB Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#1f2937"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - healthScore / 100)}`}
                className={scoreStyle.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${scoreStyle.color}`}>{healthScore}</div>
                <div className="text-gray-500 text-xs">out of 100</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">GMB Ownership Score</h3>
            <p className="text-gray-400 mb-4">
              Your current profile isn't optimized to compete with businesses that own their rankings. 
              They're not wasting money on shared leads - they're investing in permanent visibility.
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${scoreStyle.bg}/20`}>
              <TrendingUp className={`w-4 h-4 ${scoreStyle.color}`} />
              <span className={`text-sm font-semibold ${scoreStyle.color}`}>
                {healthScore >= 70 ? 'Good Foundation' : healthScore >= 50 ? 'Needs Work' : 'Critical Issues'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Critical Ranking Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Why You're Trapped in the Lead-Buying Cycle</h3>
        </div>
        
        <div className="space-y-4">
          {criticalIssues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-red-400 font-bold text-sm">{index + 1}</span>
              </div>
              <p className="text-gray-300 leading-relaxed pt-1">{issue}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* The Solution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border-2 border-[#c8ff00] rounded-3xl p-8 text-center"
      >
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-[#c8ff00]/20 rounded-full px-4 py-2 mb-4">
            <Shield className="w-4 h-4 text-[#c8ff00]" />
            <span className="text-[#c8ff00] font-semibold text-sm">THE SOLUTION</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Stop Renting. Start <span className="text-[#c8ff00]">Owning</span>.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Our AI builds permanent digital equity on Google. No more $100+ shared leads. 
            No more $2,000/mo agency retainers. Just ownership.
          </p>
        </div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-red-500/30 rounded-xl p-6">
            <div className="text-red-400 font-bold mb-3">❌ Old Way (Renting)</div>
            <div className="space-y-2 text-sm text-gray-400 text-left">
              <div>• Pay $100+ per shared lead</div>
              <div>• Compete on price with 5 others</div>
              <div>• Zero ownership or equity</div>
              <div>• Stop paying = invisible</div>
            </div>
          </div>
          <div className="bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-xl p-6">
            <div className="text-[#c8ff00] font-bold mb-3">✅ New Way (Owning)</div>
            <div className="space-y-2 text-sm text-gray-300 text-left">
              <div>• $0.11/day for AI automation</div>
              <div>• Exclusive leads from Map Pack</div>
              <div>• Build permanent digital assets</div>
              <div>• Rankings compound over time</div>
            </div>
          </div>
        </div>

        <Button
          onClick={onCTA}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold text-xl px-16 py-8 rounded-xl shadow-[0_0_60px_rgba(200,255,0,0.4)] hover:scale-105 transition-all"
        >
          <Zap className="w-6 h-6 mr-3" />
          Claim Lead Independence Now
        </Button>
        
        <p className="text-gray-600 text-sm mt-4">
          Join 7M+ businesses who stopped renting and started owning
        </p>
      </motion.div>
    </motion.div>
  );
}