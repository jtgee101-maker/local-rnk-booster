import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocsFooter from '@/components/docs/DocsFooter';

export default function Error403Page() {
  return (
    <>
      <Helmet>
        <title>Access Denied - LocalRank.ai</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Lock Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/50">
                <Lock className="w-10 h-10 text-red-400" />
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                403
              </div>
              <p className="text-gray-400 text-lg">Access Denied</p>
            </div>

            {/* Description */}
            <div className="mb-8 space-y-4">
              <h1 className="text-3xl font-bold text-white">
                This page is restricted
              </h1>
              <p className="text-gray-400 leading-relaxed">
                You don't have permission to access this resource. This area is reserved for authorized users only.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-3">Why am I seeing this?</h3>
              <ul className="space-y-2 text-gray-400 text-sm text-left">
                <li>• You may not have the required permissions</li>
                <li>• Your account might not be verified</li>
                <li>• You may need admin access to view this</li>
                <li>• This resource may have been removed</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={createPageUrl('QuizV3')} className="flex-1">
                <Button className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-8">
              If you believe this is an error, contact support@localrank.ai
            </p>
          </motion.div>
        </div>
      </div>

      <DocsFooter />
    </>
  );
}