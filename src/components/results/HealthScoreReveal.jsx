import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function HealthScoreReveal({ healthScore, onRevealComplete }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    if (!isAnimating) return;

    const duration = 2800; // Slightly longer for premium feel
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing for smooth, premium feel
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const currentScore = Math.round(healthScore * easeOutQuad);

      setDisplayScore(currentScore);

      if (progress === 1) {
        clearInterval(interval);
        setIsAnimating(false);
        setTimeout(() => {
          setShowCTA(true);
          setTimeout(onRevealComplete, 1200);
        }, 600);
      }
    }, 16);

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
      className="relative flex items-center justify-center min-h-[600px] sm:min-h-[700px]"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-pink-500/15 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center px-4 sm:px-0"
      >
        {/* Animated Border Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 bg-clip-border blur-sm"
          style={{ width: 'clamp(280px, 80vw, 400px)', height: 'clamp(280px, 80vw, 400px)' }}
        />

        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 60 }}
          className={`relative rounded-full bg-gradient-to-br ${getScoreColor(displayScore)} ${getScoreGlow(displayScore)} flex items-center justify-center backdrop-blur-xl border-4 border-white/20 shadow-2xl`}
          style={{ width: 'clamp(280px, 80vw, 380px)', height: 'clamp(280px, 80vw, 380px)' }}
        >
          {/* Premium Inner Gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/30 via-transparent to-white/10" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, type: 'spring' }}
            className="relative z-10 text-center"
          >
            <div className="text-6xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-2xl leading-none">
              {displayScore}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white/80 drop-shadow-lg mt-1"
            >
              /100
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-12 sm:mt-16 text-center max-w-2xl px-4"
        >
          <motion.p
            className="text-2xl sm:text-3xl font-black text-white mb-3"
          >
            {displayScore >= 80
              ? '🎉 Excellent Foundation'
              : displayScore >= 60
              ? '⚡ Strong Potential'
              : '🚀 Major Opportunity'}
          </motion.p>
          <motion.p
            className="text-gray-300 text-base sm:text-lg leading-relaxed"
          >
            {displayScore >= 80
              ? 'Your GMB profile is performing well. Focus on competitive advantages and growth optimization.'
              : displayScore >= 60
              ? 'You have solid fundamentals. Strategic improvements will significantly boost visibility.'
              : 'Quick fixes can dramatically improve your local search visibility and customer acquisition.'}
          </motion.p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={showCTA ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          onClick={onRevealComplete}
          className="mt-12 sm:mt-16 px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 touch-manipulation"
        >
          <span className="flex items-center gap-2">
            See My Insights
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}