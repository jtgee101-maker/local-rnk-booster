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

      {/* Critical Issues Section */}
      {criticalIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-7 rounded-2xl border-2 border-red-500/30 bg-red-500/5 backdrop-blur-sm mb-12"
        >
          <div className="flex items-start gap-3 mb-5">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            </motion.div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {criticalIssues.length} {criticalIssues.length === 1 ? 'Issue' : 'Issues'} Found
              </h3>
              <p className="text-sm text-gray-400 mt-1">Quick fixes to boost visibility</p>
            </div>
          </div>
          <div className="space-y-3">
            {criticalIssues.slice(0, 4).map((issue, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                className="flex gap-3 text-sm text-gray-300"
              >
                <span className="text-red-400 font-bold flex-shrink-0">✓</span>
                <span>{issue}</span>
              </motion.div>
            ))}
          </div>
          {criticalIssues.length > 4 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-gray-400 mt-4 pl-7"
            >
              +{criticalIssues.length - 4} more issues (revealed in your action plan)
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Premium CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-purple-600/20 border-2 border-purple-500/40 backdrop-blur-sm overflow-hidden group"
      >
        {/* Animated background */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
        />

        <div className="relative z-10 text-center">
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Lightbulb className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          </motion.div>

          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Ready for Your Action Plan?
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Our AI guide walks you through each improvement with step-by-step video instructions. Most changes take 5–15 minutes and show results within days.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 touch-manipulation"
          >
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            View Your Action Plan
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}