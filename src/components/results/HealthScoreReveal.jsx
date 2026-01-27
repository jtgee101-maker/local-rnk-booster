import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function HealthScoreReveal({ healthScore, onRevealComplete }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    // Animated counter from 0 to healthScore
    const duration = 2500; // 2.5 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const currentScore = Math.round(healthScore * easeOutQuad);

      setDisplayScore(currentScore);

      if (progress === 1) {
        clearInterval(interval);
        setIsAnimating(false);
        // Call completion callback after animation finishes
        setTimeout(onRevealComplete, 500);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [healthScore, isAnimating, onRevealComplete]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-400 to-emerald-400';
    if (score >= 60) return 'from-yellow-400 to-amber-400';
    return 'from-red-400 to-rose-400';
  };

  const getScoreGlow = (score) => {
    if (score >= 80) return 'shadow-2xl shadow-green-500/50';
    if (score >= 60) return 'shadow-2xl shadow-yellow-500/50';
    return 'shadow-2xl shadow-red-500/50';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex items-center justify-center min-h-[500px]"
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/3 -left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1/3 -right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Score Circle Container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-border"
          style={{ width: '320px', height: '320px', margin: 'auto' }}
        />

        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`relative w-80 h-80 rounded-full bg-gradient-to-br ${getScoreColor(displayScore)} ${getScoreGlow(displayScore)} flex items-center justify-center backdrop-blur-xl border-4 border-white/10`}
        >
          {/* Inner gradient circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-t from-black/40 to-transparent" />

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative z-10 text-center"
          >
            <div className="text-7xl md:text-8xl font-black text-white drop-shadow-2xl">
              {displayScore}
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white/90 drop-shadow-lg">/100</div>
          </motion.div>
        </motion.div>

        {/* Status Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-xl md:text-2xl font-bold text-white mb-2">
            {displayScore >= 80
              ? '🎉 Excellent GMB Foundation'
              : displayScore >= 60
              ? '⚡ Strong Foundation'
              : '🚀 Massive Opportunity'}
          </p>
          <p className="text-gray-400 text-sm md:text-base max-w-md">
            {displayScore >= 80
              ? 'Your business is well-optimized. Now fine-tune for maximum visibility.'
              : displayScore >= 60
              ? 'Good start with clear opportunities for improvement ahead.'
              : 'Critical opportunities detected. Quick fixes can unlock significant growth.'}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}