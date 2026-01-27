import React from 'react';
import { motion } from 'framer-motion';

export default function VideoAskEmbed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
          Your Personalized Optimization Guide
        </h2>
        <p className="text-gray-400 text-lg">
          Watch as our AI guide walks you through your specific opportunities
        </p>
      </div>

      {/* VideoAsk iframe embed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        <iframe
          src="https://www.videoask.com/fyshkiuj3"
          allow="camera *; microphone *; autoplay *; encrypted-media *; fullscreen *; display-capture *;"
          width="100%"
          height="600"
          style={{ border: 'none', borderRadius: '24px' }}
          title="VideoAsk Optimization Guide"
        />
      </motion.div>
    </motion.div>
  );
}