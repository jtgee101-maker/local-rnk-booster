import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error500Page() {
  const [copied, setCopied] = useState(false);
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(errorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Server Error - LocalRank.ai</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Alert Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/50 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 mb-2">
                500
              </div>
              <p className="text-gray-400 text-lg">Server Error</p>
            </div>

            {/* Description */}
            <div className="mb-8 space-y-4">
              <h1 className="text-3xl font-bold text-white">
                Something went wrong
              </h1>
              <p className="text-gray-400 leading-relaxed">
                We're experiencing a temporary issue. Our team has been notified and is working to fix it.
              </p>
            </div>

            {/* Error ID Box */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-2">Error Reference ID</p>
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <code className="text-sm text-[#c8ff00] font-mono break-all">
                  {errorId}
                </code>
                <button
                  onClick={handleCopy}
                  className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-3">What happened?</h3>
              <ul className="space-y-2 text-gray-400 text-sm text-left">
                <li>• An unexpected error occurred on our server</li>
                <li>• This is being logged and reviewed</li>
                <li>• You can try refreshing the page</li>
                <li>• Share the error ID if contacting support</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRefresh}
                className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Link to={createPageUrl('QuizV3')} className="flex-1">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-8">
              Error ID: {errorId.slice(0, 12)}... | Contact support@localrank.ai if it persists
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}