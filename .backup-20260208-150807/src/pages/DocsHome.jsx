import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { BookOpen, Zap, Target, Lightbulb, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DocsFooter from '@/components/docs/DocsFooter';

const docs = [
  {
    title: 'QuizGeenius Flow',
    description: 'Understand how the assessment works and what each step reveals about your business',
    icon: Target,
    path: 'GuideQuizGeenius',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Product Roadmap',
    description: 'See what we\'re building over the next 6-12 months and how it impacts your growth',
    icon: Zap,
    path: 'Roadmap',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Features & Capabilities',
    description: 'Explore all features, how they work, and how to get the most from LocalRank',
    icon: Lightbulb,
    path: 'Features',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Getting Started',
    description: 'A beginner\'s guide to understanding local SEO and why it matters for your business',
    icon: BookOpen,
    path: 'GettingStarted',
    color: 'from-orange-500 to-red-500'
  }
];

export default function DocsHomePage() {
  const [search, setSearch] = useState('');

  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Documentation & Guides - LocalRank.ai</title>
        <meta name="description" content="Learn how LocalRank works, explore our roadmap, and understand the QuizGeenius assessment process." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="px-4 md:px-6 py-12 md:py-20">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Documentation & Guides
                </h1>
                <p className="text-xl text-gray-400">
                  Everything you need to know about LocalRank.ai and how to transform your local business
                </p>
              </motion.div>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-[#c8ff00]/50"
                />
              </div>
            </div>

            {/* Documentation Cards */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDocs.map((doc, index) => {
                const Icon = doc.icon;
                return (
                  <motion.div
                    key={doc.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={createPageUrl(doc.path)}>
                      <div className="group h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 hover:border-[#c8ff00]/30 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-[#c8ff00]/10">
                        {/* Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${doc.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#c8ff00] transition-colors">
                          {doc.title}
                        </h3>
                        <p className="text-gray-400 mb-4 leading-relaxed">
                          {doc.description}
                        </p>

                        {/* Arrow */}
                        <div className="flex items-center text-[#c8ff00] text-sm font-semibold group-hover:translate-x-1 transition-transform">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No documentation found matching your search.</p>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 border-t border-gray-800/50">
            <div className="bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 border border-[#c8ff00]/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to transform your local business?</h3>
              <p className="text-gray-400 mb-6">
                Start with our free GMB audit to see exactly what's holding you back
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