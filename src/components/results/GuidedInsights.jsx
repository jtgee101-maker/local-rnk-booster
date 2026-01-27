import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Zap, BarChart3, Lightbulb, ArrowRight } from 'lucide-react';

export default function GuidedInsights({ healthScore, criticalIssues, onComplete }) {
  const [selectedInsight, setSelectedInsight] = useState(null);

  const insights = [
    {
      icon: AlertTriangle,
      title: 'Your Score Analysis',
      description:
        healthScore >= 80
          ? 'Your GMB profile is well-maintained with strong fundamentals. Now focus on competitive advantages.'
          : healthScore >= 60
          ? 'You have a solid foundation with significant untapped potential for visibility gains.'
          : 'Critical improvements available. Quick wins can dramatically boost visibility.',
      details:
        healthScore >= 80
          ? 'Continue optimizing photos, reviews, and Q&A to maintain competitive advantage.'
          : healthScore >= 60
          ? 'Focus on increasing reviews, adding photos, and optimizing your service areas.'
          : 'Priority: improve rating, increase recent reviews, add more high-quality photos.',
      color: healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red',
    },
    {
      icon: TrendingUp,
      title: 'Why It Matters',
      description:
        'Optimized GMB profiles receive 5x more calls, 3x more website clicks, and rank 2.8x higher in local search results.',
      details:
        `A ${healthScore}% profile means you're likely missing ${100 - healthScore}% of potential customer actions. Even a 10-point improvement can mean hundreds of extra calls and inquiries per month.`,
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'Quick Wins Found',
      description:
        `${criticalIssues.length} specific opportunities identified to boost your visibility immediately.`,
      details:
        criticalIssues.length > 0
          ? 'These fixes typically take 5-30 minutes each and show results within 3-7 days.'
          : 'Your profile is already well-optimized. Focus on maintaining and growing reviews.',
      color: 'blue',
    },
    {
      icon: CheckCircle,
      title: 'Personalized Action Plan',
      description:
        'Watch our AI guide walk you through each improvement with step-by-step video instructions.',
      details: 'Most improvements take 5-15 minutes. Results typically visible within one week.',
      color: 'pink',
    },
  ];

  const colorMap = {
    red: 'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    purple: 'border-purple-500/30 bg-purple-500/30',
    blue: 'border-blue-500/30 bg-blue-500/5',
    pink: 'border-pink-500/30 bg-pink-500/5',
  };

  const iconColorMap = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    pink: 'text-pink-400',
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
          Understanding Your Score
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Here's what your {healthScore} score means and the exact steps to improve it
        </p>
      </motion.div>

      {/* Interactive Insights Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12"
      >
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const isSelected = selectedInsight === idx;

          return (
            <motion.button
              key={idx}
              variants={item}
              onClick={() => setSelectedInsight(isSelected ? null : idx)}
              className="text-left group cursor-pointer"
            >
              <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 sm:p-7 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
                  isSelected
                    ? `${colorMap[insight.color]} scale-105`
                    : `${colorMap[insight.color]} hover:border-opacity-70 group-hover:shadow-xl group-hover:shadow-${insight.color}-500/20`
                }`}
              >
                <div className="flex gap-4 items-start">
                  <motion.div
                    className={`flex-shrink-0 p-3 rounded-xl bg-white/10 ${iconColorMap[insight.color]} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {insight.title}
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      {insight.description}
                    </p>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={
                        isSelected ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }
                      }
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {insight.details}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Critical Issues Preview */}
      {criticalIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="p-6 rounded-2xl border-2 border-red-500/30 bg-red-500/5 backdrop-blur-sm"
        >
          <div className="flex gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white">
              {criticalIssues.length} Opportunities Identified
            </h3>
          </div>
          <div className="space-y-2 mb-4">
            {criticalIssues.slice(0, 3).map((issue, idx) => (
              <div key={idx} className="flex gap-2 text-sm text-gray-300">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span>{issue}</span>
              </div>
            ))}
          </div>
          {criticalIssues.length > 3 && (
            <p className="text-sm text-gray-400">
              +{criticalIssues.length - 3} more issues found
            </p>
          )}
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 text-center"
      >
        <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-3">Ready to Improve?</h3>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          Our AI-powered optimization guide will walk you through each improvement step-by-step.
          Most businesses see results within 7 days.
        </p>
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
        >
          <BarChart3 className="w-5 h-5" />
          See Your Optimization Plan
        </button>
      </motion.div>
    </motion.div>
  );
}