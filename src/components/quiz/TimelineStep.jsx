import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Calendar, TrendingUp } from 'lucide-react';

const timelines = [
  { id: 'urgent', label: 'ASAP - Need Results Now', icon: Zap, desc: 'Priority treatment', color: 'text-red-400' },
  { id: '30_days', label: 'Within 30 Days', icon: Clock, desc: 'Standard timeline', color: 'text-yellow-400' },
  { id: '60_days', label: 'Within 60 Days', icon: Calendar, desc: 'Flexible approach', color: 'text-green-400' },
  { id: 'planning', label: 'Just Planning Ahead', icon: TrendingUp, desc: 'Long-term strategy', color: 'text-blue-400' }
];

export default function TimelineStep({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          When do you want to see results?
        </h2>
        <p className="text-gray-400">
          This helps us customize your implementation plan
        </p>
      </div>

      <div className="space-y-4">
        {timelines.map((timeline, index) => {
          const Icon = timeline.icon;
          
          return (
            <motion.button
              key={timeline.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(timeline.id)}
              className="group w-full bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 text-left transition-all duration-300 hover:border-[#c8ff00]/50 hover:bg-gray-900/80"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-[#c8ff00]/10 transition-colors">
                  <Icon className={`w-6 h-6 ${timeline.color} group-hover:text-[#c8ff00] transition-colors`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg group-hover:text-[#c8ff00] transition-colors">
                    {timeline.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{timeline.desc}</p>
                </div>
                <motion.div
                  className="text-[#c8ff00] opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 5 }}
                >
                  →
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}