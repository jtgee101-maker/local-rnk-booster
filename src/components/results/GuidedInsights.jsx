import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Zap, BarChart3, Lightbulb } from 'lucide-react';

export default function GuidedInsights({ healthScore, criticalIssues, onComplete }) {
  const insights = [
    {
      icon: AlertTriangle,
      title: 'What Your Score Means',
      description:
        healthScore >= 80
          ? 'Your GMB profile is well-maintained with strong fundamentals. Focus on growth optimization.'
          : healthScore >= 60
          ? 'Your profile has a solid foundation but significant untapped potential for visibility gains.'
          : 'Your profile needs critical attention. Quick improvements will dramatically boost visibility.',
      color: healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red',
    },
    {
      icon: TrendingUp,
      title: 'Why It Matters',
      description:
        'Businesses with optimized GMB profiles get 5x more calls, 3x more website traffic, and rank 2.8x higher in local search. Your current score determines how much opportunity you\'re missing.',
      color: 'purple',
    },
    {
      icon: Zap,
      title: 'The Quick Wins',
      description:
        'We found ' +
        criticalIssues.length +
        ' quick-fix opportunities. Addressing these can boost your visibility within days, not months.',
      color: 'blue',
    },
    {
      icon: CheckCircle,
      title: 'Next Steps',
      description:
        'Our automated optimization guide will walk you through each improvement, with actionable tasks that take 5-15 minutes each.',
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
          Understanding Your Score
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Here's what your health score reveals and how we'll help you improve it
        </p>
      </motion.div>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
              className={`p-6 rounded-2xl border-2 backdrop-blur-sm hover:scale-105 transition-transform ${colorMap[insight.color]}`}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 p-3 rounded-xl bg-white/10 ${iconColorMap[insight.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{insight.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

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