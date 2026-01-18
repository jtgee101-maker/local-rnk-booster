import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ minutes = 14, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = sessionStorage.getItem('countdownExpiry');
    if (saved) {
      const expiry = parseInt(saved);
      const now = Date.now();
      if (expiry > now) {
        return Math.floor((expiry - now) / 1000);
      }
    }
    
    const expiry = Date.now() + (minutes * 60 * 1000);
    sessionStorage.setItem('countdownExpiry', expiry.toString());
    return minutes * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;

  const isUrgent = timeLeft < 300; // Less than 5 minutes

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
        isUrgent 
          ? 'bg-red-500/20 border border-red-500/50' 
          : 'bg-[#c8ff00]/10 border border-[#c8ff00]/30'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-[#c8ff00]'}`} />
      <span className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-[#c8ff00]'}`}>
        {minutesLeft}:{secondsLeft.toString().padStart(2, '0')} Remaining
      </span>
    </motion.div>
  );
}