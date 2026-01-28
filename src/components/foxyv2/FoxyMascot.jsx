import React from 'react';
import { motion } from 'framer-motion';

export default function FoxyMascot({ expression = 'detective', size = 'md' }) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const expressions = {
    detective: {
      emoji: '🦊🔍',
      animation: { scale: [1, 1.05, 1], rotate: [0, -5, 5, 0] }
    },
    alert: {
      emoji: '🦊⚠️',
      animation: { scale: [1, 1.1, 1], y: [0, -5, 0] }
    },
    happy: {
      emoji: '🦊✨',
      animation: { scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }
    },
    thinking: {
      emoji: '🦊💭',
      animation: { rotate: [0, -3, 3, 0] }
    }
  };

  const current = expressions[expression] || expressions.detective;

  return (
    <motion.div
      className={`${sizes[size]} flex items-center justify-center text-4xl`}
      animate={current.animation}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {current.emoji}
    </motion.div>
  );
}