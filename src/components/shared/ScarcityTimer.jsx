import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScarcityTimer({ 
  endDate = null, 
  minutesLeft = 30,
  showIcon = true,
  variant = 'inline' 
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      let difference;
      
      if (endDate) {
        difference = new Date(endDate) - new Date();
      } else {
        const stored = sessionStorage.getItem('scarcity_timer_start');
        const startTime = stored ? parseInt(stored) : Date.now();
        
        if (!stored) {
          sessionStorage.setItem('scarcity_timer_start', startTime.toString());
        }
        
        const endTime = startTime + (minutesLeft * 60 * 1000);
        difference = endTime - Date.now();
      }

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, minutesLeft]);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 border-2 border-[#c8ff00] rounded-lg px-3 py-2 min-w-[60px]">
        <div className="text-2xl font-black text-[#c8ff00] tabular-nums">
          {value.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-3 px-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm sm:text-base">
          <Zap className="w-5 h-5 animate-pulse" />
          <span className="font-bold">Limited Time Offer Ends In:</span>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg">{timeLeft.hours.toString().padStart(2, '0')}</span>:
            <span className="font-black text-lg">{timeLeft.minutes.toString().padStart(2, '0')}</span>:
            <span className="font-black text-lg">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
      {showIcon && <Clock className="w-6 h-6 text-red-400 animate-pulse" />}
      <div className="flex items-center gap-2">
        <span className="text-red-300 font-semibold text-sm">Offer expires in:</span>
        <div className="flex items-center gap-2">
          <TimeUnit value={timeLeft.hours} label="hrs" />
          <span className="text-red-400 text-xl font-bold">:</span>
          <TimeUnit value={timeLeft.minutes} label="min" />
          <span className="text-red-400 text-xl font-bold">:</span>
          <TimeUnit value={timeLeft.seconds} label="sec" />
        </div>
      </div>
    </div>
  );
}