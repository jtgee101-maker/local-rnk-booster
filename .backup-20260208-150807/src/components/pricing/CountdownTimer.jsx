import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ minutes = 15 }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-4 shadow-lg pointer-events-none"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm md:text-base font-semibold">
        <Clock className="w-5 h-5 animate-pulse" />
        <span>
          URGENT: 82% DISCOUNT EXPIRES IN{' '}
          <span className="font-mono bg-white/20 px-2 py-0.5 rounded">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </span>
      </div>
    </motion.div>
  );
}