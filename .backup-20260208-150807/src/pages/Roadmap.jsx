import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Zap, TrendingUp, Lightbulb, CheckCircle2 } from 'lucide-react';
import DocsFooter from '@/components/docs/DocsFooter';

const phases = [
  {
    title: 'Phase 1: Foundation (Jan - Mar 2026)',
    description: 'Building core capabilities',
    color: 'from-blue-500 to-cyan-500',
    features: [
      {
        title: 'Enhanced GMB Analysis',
        description: 'AI-powered deep analysis of every Google My Business signal',
        status: 'In Progress'
      },
      {
        title: 'Competitor Benchmarking',
        description: 'Real-time comparison against your top 5 local competitors',
        status: 'In Progress'
      },
      {
        title: 'Actionable Recommendations',
        description: 'Specific, prioritized tasks to improve your rankings',
        status: 'Planned'
      },
      {
        title: 'Performance Dashboard',
        description: 'Track your improvements over time with visual analytics',
        status: 'Planned'
      }
    ]
  },
  {
    title: 'Phase 2: Automation (Apr - Jun 2026)',
    description: 'Automating improvements',
    color: 'from-purple-500 to-pink-500',
    features: [
      {
        title: 'Automated Profile Optimization',
        description: 'One-click improvements to your GMB profile',
        status: 'In Development'
      },
      {
        title: 'AI Review Response Engine',
        description: 'Automatically respond to reviews with personalized messages',
        status: 'In Development'
      },
      {
        title: 'Smart Photo Management',
        description: 'Auto-optimize and schedule high-performing photos',
        status: 'Planned'
      },
      {
        title: 'Content Calendar',
        description: 'GMB posts and updates planned and scheduled automatically',
        status: 'Planned'
      }
    ]
  },
  {
    title: 'Phase 3: Intelligence (Jul - Sep 2026)',
    description: 'Advanced AI capabilities',
    color: 'from-green-500 to-emerald-500',
    features: [
      {
        title: 'Predictive Analytics',
        description: 'Forecast your rankings and traffic 30-90 days out',
        status: 'Planned'
      },
      {
        title: 'Opportunity Detection',
        description: 'AI identifies new keywords and service areas to target',
        status: 'Planned'
      },
      {
        title: 'Competitor Intelligence',
        description: 'Monitor competitor moves and get strategic alerts',
        status: 'Planned'
      },
      {
        title: 'Custom Strategy Engine',
        description: 'AI creates your unique 90-day action plan',
        status: 'Planned'
      }
    ]
  },
  {
    title: 'Phase 4: Enterprise (Oct - Dec 2026)',
    description: 'Multi-location & advanced features',
    color: 'from-orange-500 to-red-500',
    features: [
      {
        title: 'Multi-Location Management',
        description: 'Manage entire business networks from one dashboard',
        status: 'Planned'
      },
      {
        title: 'Team Collaboration',
        description: 'Assign tasks, track progress, and manage workflows',
        status: 'Planned'
      },
      {
        title: 'API Access',
        description: 'Integrate LocalRank with your existing tools',
        status: 'Planned'
      },
      {
        title: 'White Label Solution',
        description: 'Resell LocalRank under your own brand',
        status: 'Planned'
      }
    ]
  }
];

function PhaseCard({ phase, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-700/50 rounded-2xl overflow-hidden hover:border-[#c8ff00]/30 transition-colors"
    >
      {/* Phase Header */}
      <div className={`bg-gradient-to-r ${phase.color} p-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-pattern" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2">{phase.title}</h3>
          <p className="text-white/80">{phase.description}</p>
        </div>
      </div>

      {/* Features */}
      <div className="p-6 space-y-4">
        {phase.features.map((feature, idx) => (
          <div key={idx} className="border-b border-gray-700/50 pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-white">{feature.title}</h4>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                feature.status === 'In Progress' ? 'bg-blue-500/30 text-blue-300' :
                feature.status === 'In Development' ? 'bg-purple-500/30 text-purple-300' :
                'bg-gray-700/50 text-gray-400'
              }`}>
                {feature.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function RoadmapPage() {
  return (
    <>
      <Helmet>
        <title>Product Roadmap - LocalRank.ai</title>
        <meta name="description" content="See what we're building over the next 12 months and how it will transform your local business." />
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
                  12-Month Roadmap
                </h1>
                <p className="text-xl text-gray-400">
                  Here's what we're building and how it will transform your local business growth over the next year
                </p>
              </motion.div>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: CheckCircle2, title: '4 Major Phases', desc: 'Foundation → Intelligence' },
                { icon: Zap, title: '20+ Features', desc: 'Coming throughout 2026' },
                { icon: TrendingUp, title: '10x ROI', desc: 'Expected impact on your business' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
                    <Icon className="w-8 h-8 text-[#c8ff00] mx-auto mb-3" />
                    <h4 className="text-white font-bold mb-1">{stat.title}</h4>
                    <p className="text-gray-400 text-sm">{stat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phases */}
          <div className="px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {phases.map((phase, idx) => (
                  <PhaseCard key={idx} phase={phase} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="px-4 md:px-6 py-12">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 border border-[#c8ff00]/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[#c8ff00]" />
                Want to Shape Our Future?
              </h3>
              <p className="text-gray-300 mb-6">
                We'd love to hear your feedback on what you'd like to see next. Your input directly influences our development priorities.
              </p>
              <button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold px-6 py-3 rounded-lg transition-colors">
                Share Your Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      <DocsFooter />
    </>
  );
}