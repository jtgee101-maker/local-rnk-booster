import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TransitionStep({ title, description, icon: Icon = Sparkles }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl mx-auto px-4 text-center"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative inline-block">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 40px rgba(200,255,0,0.3)',
                '0 0 60px rgba(200,255,0,0.5)',
                '0 0 40px rgba(200,255,0,0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Icon container */}
          <div className="relative w-32 h-32 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 flex items-center justify-center">
            <Icon className="w-16 h-16 text-[#c8ff00]" />
          </div>
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          {title}
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
          {description}
        </p>
      </motion.div>

      {/* Animated dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-2 mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#c8ff00]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}