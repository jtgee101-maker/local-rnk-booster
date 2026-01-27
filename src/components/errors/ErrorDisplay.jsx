import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw, Copy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorDisplay({ error, onDismiss, context }) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getErrorCategory = (error) => {
    const msg = error?.message || '';
    if (msg.includes('Cannot read properties') || msg.includes('undefined')) return 'state';
    if (msg.includes('network') || msg.includes('fetch')) return 'network';
    if (msg.includes('parse') || msg.includes('JSON')) return 'parsing';
    return 'unknown';
  };

  const getErrorTitle = (category) => {
    switch (category) {
      case 'state': return '⚠️ Data Issue';
      case 'network': return '🌐 Connection Issue';
      case 'parsing': return '📝 Data Format Issue';
      default: return '❌ Oops!';
    }
  };

  const getErrorDescription = (category) => {
    switch (category) {
      case 'state': return 'Something went wrong loading your data. Please refresh and try again.';
      case 'network': return 'Check your internet connection and try again.';
      case 'parsing': return 'We encountered an issue processing the response. Refreshing may help.';
      default: return 'An unexpected error occurred. Our team has been notified.';
    }
  };

  const category = getErrorCategory(error);
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCopy = () => {
    const errorInfo = `Error ID: ${errorId}\nType: ${error?.name || 'Unknown'}\nMessage: ${error?.message}\nContext: ${context || 'N/A'}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {error && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{getErrorTitle(category)}</h3>
                  <p className="text-xs text-gray-400">ID: {errorId.slice(0, 12)}...</p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {getErrorDescription(category)}
              </p>

              {/* Error Details Expandable */}
              <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-xs font-mono text-gray-400">Technical Details</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      showDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-700/50 bg-gray-900/50 px-4 py-3"
                    >
                      <div className="space-y-2 text-xs font-mono text-gray-400 max-h-40 overflow-y-auto">
                        <div>
                          <span className="text-gray-500">Error:</span>{' '}
                          <span className="text-red-400">{error?.message}</span>
                        </div>
                        {error?.name && (
                          <div>
                            <span className="text-gray-500">Type:</span>{' '}
                            <span className="text-yellow-400">{error.name}</span>
                          </div>
                        )}
                        {context && (
                          <div>
                            <span className="text-gray-500">Context:</span>{' '}
                            <span className="text-blue-400">{context}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Time:</span>{' '}
                          <span className="text-gray-400">{new Date().toISOString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleRefresh}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-2 px-3 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Info'}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                Our team will investigate this issue. Thank you for your patience.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}