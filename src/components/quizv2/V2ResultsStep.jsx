import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Shield, Zap, CheckCircle, Users, Lightbulb, Target } from 'lucide-react';

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
      {/* Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c8ff00]/20 to-emerald-500/20 border border-[#c8ff00]/40 rounded-full px-6 py-3 mb-6">
          <CheckCircle className="w-5 h-5 text-[#c8ff00]" />
          <span className="text-[#c8ff00] font-bold">ANALYSIS COMPLETE</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
          Your Lead Independence<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] to-emerald-400">Recovery Plan</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Here's exactly how much revenue you could reclaim by owning your rankings instead of renting from platforms.
        </p>
      </motion.div>

      {/* Annual Cost Calculator - Premium Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-red-500/15 via-orange-500/10 to-red-500/5 border-2 border-red-500/40 rounded-3xl p-6 md:p-10 mb-10 backdrop-blur-sm"
      >
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Left: The Cost */}
          <div>
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 rounded-xl bg-red-500/20 flex-shrink-0">
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Your Annual {platformName}</div>
                <div className="text-4xl md:text-5xl font-bold text-red-400 mt-2">
                  ${thumbtackTax.toLocaleString()}
                </div>
                <div className="text-gray-500 text-xs mt-2">
                  That's ${(thumbtackTax/12).toLocaleString(undefined, {maximumFractionDigits: 0})}/month on platforms that don't own you any leads
                </div>
              </div>
            </div>
          </div>

          {/* Right: What You Could Buy */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 md:p-6">
            <h3 className="text-white font-bold mb-4 text-base md:text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#c8ff00]" />
              What This Money Could Buy:
            </h3>
            <div className="space-y-3 text-sm md:text-base">
              {[
                '2 Full-time team members earning $45k/year',
                '3 branded work vehicles for your crew',
                'Permanent, appreciating digital assets',
                'Real customer relationships that scale'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-center text-sm md:text-base">
            But instead, you're paying this every single year for leads that <span className="text-red-400 font-semibold">your 4 competitors also get</span>.
          </p>
        </div>
      </motion.div>

      {/* GMB Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-8 mb-8"
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
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">GMB Ownership Score</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base leading-relaxed">
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

      {/* Why The Cycle Trap - Premium Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 md:p-8 mb-10"
      >
        <div className="flex items-center gap-3 mb-7">
          <div className="p-3 rounded-xl bg-red-500/20">
            <Target className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">Why You're Trapped in the Lead-Buying Cycle</h3>
        </div>
        
        <div className="space-y-3">
          {criticalIssues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-4 p-4 md:p-5 bg-gradient-to-r from-red-500/15 to-transparent border border-red-500/25 rounded-2xl hover:border-red-500/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-red-300 text-sm">
                {index + 1}
              </div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed flex-1 pt-0.5">{issue}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* The Freedom Path - Premium Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-[#c8ff00]/15 via-emerald-500/10 to-teal-500/5 border-2 border-[#c8ff00]/40 rounded-3xl p-6 md:p-10 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c8ff00]/20 to-emerald-500/20 rounded-full px-5 py-2 mb-6 border border-[#c8ff00]/30">
            <Shield className="w-4 h-4 text-[#c8ff00]" />
            <span className="text-[#c8ff00] font-bold text-sm">LEAD INDEPENDENCE PATH</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Your Path to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] to-emerald-400">Complete Freedom</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Stop renting visibility. Start building permanent digital equity that compounds every single month.
          </p>
        </div>

        {/* Comparison - Redesigned */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-10">
          {/* Left: Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900/50 border border-red-500/30 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 font-bold text-sm">✗</span>
              </div>
              <h3 className="text-red-400 font-bold text-lg">The Old Way (Lead Renting)</h3>
            </div>
            <div className="space-y-3 text-sm md:text-base text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                <span>Pay $100+ per shared lead</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                <span>Competitors bid on same leads</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                <span>Zero ownership or equity building</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                <span>Stop paying = instant invisibility</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                <span>No customer data ownership</span>
              </div>
            </div>
          </motion.div>

          {/* Right: New Way */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-br from-[#c8ff00]/20 to-emerald-500/10 border border-[#c8ff00]/40 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
              </div>
              <h3 className="text-[#c8ff00] font-bold text-lg">The New Way (Lead Ownership)</h3>
            </div>
            <div className="space-y-3 text-sm md:text-base text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-[#c8ff00] mt-1 flex-shrink-0 font-bold">+</span>
                <span>Exclusive Map Pack leads ($0.11/day automation)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#c8ff00] mt-1 flex-shrink-0 font-bold">+</span>
                <span>Zero competition for your customers</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#c8ff00] mt-1 flex-shrink-0 font-bold">+</span>
                <span>Build permanent digital assets</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#c8ff00] mt-1 flex-shrink-0 font-bold">+</span>
                <span>Rankings compound & strengthen over time</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#c8ff00] mt-1 flex-shrink-0 font-bold">+</span>
                <span>Own all customer data & relationships</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center space-y-4"
        >
          <Button
            onClick={onCTA}
            className="w-full md:w-auto bg-gradient-to-r from-[#c8ff00] to-emerald-400 hover:from-[#d4ff33] hover:to-emerald-300 text-black font-bold text-base md:text-xl px-10 md:px-20 py-6 md:py-8 rounded-full shadow-[0_0_80px_rgba(200,255,0,0.4)] hover:shadow-[0_0_120px_rgba(200,255,0,0.6)] hover:scale-105 transition-all duration-300 transform active:scale-95 min-h-[56px] touch-manipulation"
          >
            <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
            Start My Lead Independence Plan
          </Button>
          
          <p className="text-gray-600 text-sm md:text-base">
            <span className="font-semibold text-gray-400">45,000+ businesses</span> have claimed lead independence this year.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}