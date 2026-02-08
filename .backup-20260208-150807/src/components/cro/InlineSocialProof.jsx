import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, CheckCircle } from 'lucide-react';

const activities = [
  { name: 'Sarah M.', location: 'Austin, TX', action: 'completed audit', time: '2m ago' },
  { name: 'Mike R.', location: 'Miami, FL', action: 'started quiz', time: '5m ago' },
  { name: 'Jessica L.', location: 'Seattle, WA', action: 'purchased package', time: '8m ago' },
  { name: 'David K.', location: 'Chicago, IL', action: 'completed audit', time: '12m ago' },
  { name: 'Amanda P.', location: 'Boston, MA', action: 'started quiz', time: '15m ago' }
];

export default function InlineSocialProof({ variant = 'default' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c8ff00] to-green-500 border-2 border-gray-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-900" />
            </div>
          ))}
        </div>
        <span className="text-gray-400">
          <span className="font-semibold text-white">2,847 businesses</span> analyzed this week
        </span>
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-800">
          <div className="text-2xl font-bold text-[#c8ff00] mb-1">8,947</div>
          <div className="text-xs text-gray-400">Audits Completed</div>
        </div>
        <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-800">
          <div className="text-2xl font-bold text-[#c8ff00] mb-1">94%</div>
          <div className="text-xs text-gray-400">Satisfaction Rate</div>
        </div>
        <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-800">
          <div className="text-2xl font-bold text-[#c8ff00] mb-1">30 Days</div>
          <div className="text-xs text-gray-400">Avg. to Map Pack</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#c8ff00]" />
        <span className="text-xs font-semibold text-gray-400">LIVE ACTIVITY</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c8ff00] to-green-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-white text-sm">{activities[currentIndex].name}</span>
              <span className="text-xs text-gray-500">{activities[currentIndex].location}</span>
            </div>
            <p className="text-sm text-gray-400">
              {activities[currentIndex].action} <span className="text-gray-600">• {activities[currentIndex].time}</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}