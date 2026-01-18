import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ArrowRight, Zap, DollarSign } from 'lucide-react';
import CompetitorComparison from './CompetitorComparison';
import { useABTest } from '@/components/abtest/ABTestProvider';

export default function ResultsStep({ healthScore, criticalIssues, businessName, onCTA }) {
  const { trackConversion } = useABTest();

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Work';
    return 'Critical';
  };

  const calculateRevenueLoss = () => {
    const lossPercentage = (100 - healthScore) / 100;
    const baseLoss = 2000;
    return Math.round(baseLoss * (1 + lossPercentage * 7));
  };

  const estimatedLoss = calculateRevenueLoss();

  const handleCTAClick = () => {
    trackConversion('quiz', 'headline');
    onCTA();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <CheckCircle className="w-4 h-4 text-[#c8ff00]" />
          <span className="text-sm text-[#c8ff00] font-medium">Scan Complete</span>
        </motion.div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {businessName}'s AI-Powered Revenue Gap Report
        </h2>
        <p className="text-gray-400 text-sm">
          60-second scan complete — here's what competitors don't want you to know
        </p>
      </div>

      {/* Revenue Loss Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Estimated Monthly Revenue Loss
            </h3>
            <div className="text-3xl font-bold text-red-400">
              ${estimatedLoss.toLocaleString()}+
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Based on your Map Pack visibility gaps vs. competitors
            </p>
          </div>
        </div>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/70 backdrop-blur border border-gray-800 rounded-3xl p-8 mb-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm mb-1">Your GMB Health Score</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`text-6xl font-bold ${getScoreColor(healthScore)}`}
              >
                {healthScore}
              </motion.span>
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <p className={`text-sm font-medium mt-1 ${getScoreColor(healthScore)}`}>
              {getScoreLabel(healthScore)}
            </p>
          </div>

          {/* Score Gauge */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#1f2937"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="#c8ff00"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 56 * (1 - healthScore / 100) 
                }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Critical Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-white">AI-Detected Ranking Sabotage</h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">
          These errors would take 40+ hours to find manually. Our AI found them in 60 seconds.
        </p>

        <div className="space-y-3">
          {criticalIssues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-gray-300 text-sm">{issue}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Competitor Comparison */}
      <CompetitorComparison />

      {/* Kill-Shot Messaging */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-2xl p-6 mb-8 text-center"
      >
        <p className="text-[#c8ff00] font-semibold text-lg mb-2">
          💡 Why pay a $2,000/mo agency for "insider tricks"...
        </p>
        <p className="text-white text-xl font-bold">
          When you can use the same AI software they use for $0.11/day?
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center"
      >
        <Button
          onClick={handleCTAClick}
          className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
        >
          <Zap className="mr-2 w-5 h-5" />
          Get Automated Fix for $0.11/Day
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <p className="text-gray-500 text-sm mt-4">
          82% off expires in 14 minutes • Zero technical skills required
        </p>
      </motion.div>
    </motion.div>
  );
}