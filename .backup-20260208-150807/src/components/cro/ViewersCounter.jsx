import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp } from 'lucide-react';

export default function ViewersCounter({ baseCount = 47 }) {
  const [viewers, setViewers] = useState(baseCount);

  useEffect(() => {
    // Simulate live viewer count fluctuation
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        // Keep between baseCount-10 and baseCount+15
        return Math.max(baseCount - 10, Math.min(baseCount + 15, newCount));
      });
    }, 4000 + Math.random() * 3000); // Random interval 4-7 seconds

    return () => clearInterval(interval);
  }, [baseCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-full px-4 py-2 shadow-lg"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-2 h-2 rounded-full bg-green-500"
      />
      <Eye className="w-4 h-4 text-gray-400" />
      <motion.span
        key={viewers}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-semibold text-white"
      >
        {viewers}
      </motion.span>
      <span className="text-xs text-gray-500">viewing now</span>
      {viewers > baseCount && (
        <TrendingUp className="w-3 h-3 text-green-500" />
      )}
    </motion.div>
  );
}