import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function VideoAskEmbed({ leadId }) {
  const [isLoading, setIsLoading] = useState(true);

  const handlePathwaysClick = () => {
    window.location.href = createPageUrl('BridgeGeenius') + `?lead_id=${leadId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-10 sm:mb-14"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-6 h-6 text-purple-400" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
            Your Action Plan
          </h2>
        </div>
        <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Meet your AI-powered optimization guide. This interactive video will walk you through each improvement, step-by-step, with actionable tasks you can complete today.
        </p>
      </motion.div>

      {/* VideoAsk Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/20"
      >
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2 }}
            className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-black/50 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center"
            >
              <Play className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-60" />
              <p className="text-white font-semibold">Loading your guide...</p>
            </motion.div>
          </motion.div>
        )}

        {/* VideoAsk iframe */}
        <iframe
          src="https://www.videoask.com/fyshkiuj3"
          allow="camera *; microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *;"
          width="100%"
          height="650"
          style={{ border: 'none', display: 'block' }}
          title="AI-Powered Optimization Guide"
          onLoad={() => setIsLoading(false)}
          className="w-full"
        />
      </motion.div>

      {/* Post-Video CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 sm:mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-green-600/15 via-emerald-600/10 to-green-600/15 border-2 border-green-500/40 backdrop-blur-sm text-center"
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Ready to Transform Your Local Visibility?
        </h3>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-base sm:text-lg">
          Three exclusive pathways are available to accelerate your results. Choose the plan that fits your goals and timeline.
        </p>
        <motion.a
          href="#pathways"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-base sm:text-lg transition-all shadow-lg shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/50 active:scale-95 touch-manipulation"
        >
          View Your Pathways
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.span>
        </motion.a>
      </motion.div>
    </motion.div>
  );
}