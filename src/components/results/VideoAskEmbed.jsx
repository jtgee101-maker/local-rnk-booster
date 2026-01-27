import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function VideoAskEmbed() {
  useEffect(() => {
    // Load VideoAsk embed script
    window.VIDEOASK_EMBED_CONFIG = {
      kind: 'widget',
      url: 'https://www.videoask.com/fyshkiuj3',
      options: {
        widgetType: 'VideoThumbnailWindowTall',
        text: '',
        backgroundColor: '#37FB73',
        position: 'bottom-left',
        dismissible: true,
        videoPosition: 'center center',
      },
    };

    // Load the embed script if not already loaded
    if (!window.VideoAskEmbed) {
      const script = document.createElement('script');
      script.src = 'https://www.videoask.com/embed/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

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

      {/* VideoAsk will render here via the embed script */}
      <div className="min-h-[400px] relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center py-12 text-gray-400"
        >
          <p>VideoAsk widget is loading...</p>
        </motion.div>
      </div>
    </motion.div>
  );
}