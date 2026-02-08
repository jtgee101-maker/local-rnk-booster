import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Search, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocsFooter from '@/components/docs/DocsFooter';

export default function Error404Page() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - LocalRank.ai</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* 404 Number */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] to-[#a3e635] mb-4">
                404
              </div>
              <p className="text-gray-400 text-lg">Page not found</p>
            </div>

            {/* Description */}
            <div className="mb-8 space-y-4">
              <h1 className="text-3xl font-bold text-white">
                Oops! We can't find that page
              </h1>
              <p className="text-gray-400 leading-relaxed">
                The page you're looking for doesn't exist or may have been moved. Don't worry, we'll help you get back on track.
              </p>
            </div>

            {/* Suggestions */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#c8ff00]" />
                What you can do:
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm text-left">
                <li>• Return to the home page and start fresh</li>
                <li>• Check out our documentation and guides</li>
                <li>• Take the free GMB audit to get started</li>
                <li>• View our roadmap and upcoming features</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={createPageUrl('QuizV3')}
                className="flex-1"
              >
                <Button className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <Link
                to={createPageUrl('DocsHome')}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  Documentation
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-8">
              Still need help? Contact us at support@localrank.ai
            </p>
          </motion.div>
        </div>
      </div>

      <DocsFooter />
    </>
  );
}