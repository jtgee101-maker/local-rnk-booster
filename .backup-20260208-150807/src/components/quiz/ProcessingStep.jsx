import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const scanSteps = [
  { text: 'Scanning Map Pack proximity...', duration: 1200 },
  { text: 'Analyzing review velocity...', duration: 1000 },
  { text: 'Checking competitor keywords...', duration: 1100 },
  { text: 'Evaluating profile completeness...', duration: 900 },
  { text: 'Generating health score...', duration: 800 },
];

export default function ProcessingStep({ onComplete, businessName }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let totalDuration = 0;
    const totalTime = scanSteps.reduce((acc, step) => acc + step.duration, 0);

    scanSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index);
      }, totalDuration);
      totalDuration += step.duration;
    });

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, totalTime / 50);

    // Complete after all steps
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, totalTime + 500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-lg mx-auto px-4 text-center"
    >
      {/* Animated Scanner */}
      <motion.div
        className="relative w-32 h-32 mx-auto mb-10"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#c8ff00]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle Ring */}
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-[#c8ff00]/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner Pulse */}
        <motion.div
          className="absolute inset-6 rounded-full bg-[#c8ff00]/10"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 rounded-full bg-[#c8ff00]"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(200,255,0,0.3)',
                '0 0 40px rgba(200,255,0,0.6)',
                '0 0 20px rgba(200,255,0,0.3)'
              ]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Analyzing {businessName || 'Your Business'}
      </h2>

      {/* Scan Status */}
      <div className="h-8 mb-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[#c8ff00] font-mono text-sm"
          >
            {scanSteps[currentStepIndex]?.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#c8ff00] to-[#9aff00]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-gray-500 text-sm mt-3">{progress}% complete</p>
      </div>
    </motion.div>
  );
}