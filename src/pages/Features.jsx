import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowLeft, CheckCircle2, Star, Lock, TrendingUp, BarChart3, Zap } from 'lucide-react';
import DocsFooter from '@/components/docs/DocsFooter';

const features = [
  {
    category: 'Analysis',
    features: [
      {
        title: 'AI Health Score',
        description: 'Get a 0-100 score showing your local SEO performance across 40+ ranking factors',
        available: true,
        icon: Star
      },
      {
        title: 'Critical Issues Detection',
        description: 'Identify your top obstacles preventing growth and visibility',
        available: true,
        icon: AlertCircle
      },
      {
        title: 'Competitor Benchmarking',
        description: 'See exactly how you stack up against your top 5 local competitors',
        available: true,
        icon: TrendingUp
      },
      {
        title: 'Keyword Opportunity Discovery',
        description: 'Find high-intent keywords your competitors are missing',
        available: false,
        icon: Zap,
        coming: 'Q2 2026'
      }
    ]
  },
  {
    category: 'Optimization',
    features: [
      {
        title: 'Profile Recommendations',
        description: 'Actionable steps to optimize your Google My Business profile',
        available: true,
        icon: CheckCircle2
      },
      {
        title: 'Automated Optimization',
        description: 'One-click improvements to your GMB profile without manual work',
        available: false,
        icon: Zap,
        coming: 'Q2 2026'
      },
      {
        title: 'Photo Management',
        description: 'Smart scheduling and optimization of business photos',
        available: false,
        icon: Star,
        coming: 'Q2 2026'
      },
      {
        title: 'Review Response Engine',
        description: 'AI-powered automatic responses to customer reviews',
        available: false,
        icon: TrendingUp,
        coming: 'Q2 2026'
      }
    ]
  },
  {
    category: 'Analytics & Reporting',
    features: [
      {
        title: 'Real-Time Analytics',
        description: 'Track your performance metrics and improvements over time',
        available: false,
        icon: BarChart3,
        coming: 'Q1 2026'
      },
      {
        title: 'Predictive Analytics',
        description: 'Forecast your rankings and traffic 30-90 days out',
        available: false,
        icon: TrendingUp,
        coming: 'Q3 2026'
      },
      {
        title: 'Custom Reports',
        description: 'Download branded reports to share with stakeholders',
        available: false,
        icon: CheckCircle2,
        coming: 'Q2 2026'
      },
      {
        title: 'Revenue Impact Tracking',
        description: 'See how many leads and revenue your improvements generated',
        available: false,
        icon: Star,
        coming: 'Q3 2026'
      }
    ]
  }
];

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative p-6 rounded-xl border transition-all ${
        feature.available
          ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-[#c8ff00]/30 hover:border-[#c8ff00]/50'
          : 'bg-gray-900/30 border-gray-700/30'
      }`}
    >
      {/* Available Badge */}
      {feature.available && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Available
          </div>
        </div>
      )}

      {/* Coming Soon Badge */}
      {!feature.available && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-gray-700/50 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold">
            <Lock className="w-3 h-3" />
            {feature.coming}
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        feature.available
          ? 'bg-[#c8ff00]/20'
          : 'bg-gray-700/30'
      }`}>
        <Icon className={`w-6 h-6 ${
          feature.available ? 'text-[#c8ff00]' : 'text-gray-500'
        }`} />
      </div>

      {/* Title */}
      <h4 className={`font-bold mb-2 ${
        feature.available ? 'text-white' : 'text-gray-400'
      }`}>
        {feature.title}
      </h4>

      {/* Description */}
      <p className={`text-sm leading-relaxed ${
        feature.available ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>Features & Capabilities - LocalRank.ai</title>
        <meta name="description" content="Explore all features of LocalRank and what's coming in 2026." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <Link
                to={createPageUrl('DocsHome')}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Docs
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Features & Capabilities
                </h1>
                <p className="text-xl text-gray-400">
                  Everything LocalRank.ai offers to help you dominate local search
                </p>
              </motion.div>
            </div>
          </div>

          {/* Feature Categories */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-12">
              {features.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold text-white mb-6">{category.category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.features.map((feature, fIdx) => (
                      <FeatureCard key={fIdx} feature={feature} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="px-4 md:px-6 py-12">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 border border-[#c8ff00]/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to get started?</h3>
              <p className="text-gray-300 mb-6">
                Start with our free GMB audit and discover how many of these features can help your business
              </p>
              <Link to={createPageUrl('QuizV3')}>
                <button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-8 py-3 rounded-lg transition-colors">
                  Take Free Audit
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <DocsFooter />
    </>
  );
}