import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Calendar, TrendingUp } from 'lucide-react';

const timelines = [
  { id: 'urgent', label: 'ASAP - Need Results Now', icon: Zap, desc: 'Priority treatment', color: 'text-red-400' },
  { id: '30_days', label: 'Within 30 Days', icon: Clock, desc: 'Standard timeline', color: 'text-yellow-400' },
  { id: '60_days', label: 'Within 60 Days', icon: Calendar, desc: 'Flexible approach', color: 'text-green-400' },
  { id: 'planning', label: 'Just Planning Ahead', icon: TrendingUp, desc: 'Long-term strategy', color: 'text-blue-400' }
];

export default function TimelineStep({ onNext, onBack, initialValue }) {
  const [selectedId, setSelectedId] = React.useState(null);

  const handleSelect = (id) => {
    if (selectedId || !onNext) return;
    
    setSelectedId(id);
    
    setTimeout(() => {
      if (typeof onNext === 'function') {
        onNext({ timeline: id });
      }
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4 w-full"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-[#c8ff00] font-semibold">STEP 4 OF 5</span>
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          How <span className="text-[#c8ff00]">Urgent</span> Is This For You?
        </h2>
        <p className="text-gray-400 text-lg">
          We'll match your timeline with the perfect action plan
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {timelines.map((timeline, index) => {
          const Icon = timeline.icon;
          const isSelected = selectedId === timeline.id;
          const isDisabled = selectedId && !isSelected;
          
          return (
            <motion.button
              key={timeline.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isDisabled ? 0.4 : 1, 
                x: 0,
                scale: isSelected ? 1.02 : 1
              }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={!selectedId ? { scale: 1.02 } : {}}
              whileTap={!selectedId ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(timeline.id)}
              disabled={!!selectedId}
              className={`
                group w-full bg-gradient-to-br from-gray-900/80 to-gray-900/50 
                backdrop-blur-sm border rounded-2xl p-5 md:p-6 text-left 
                transition-all duration-300 min-h-[96px] touch-manipulation
                ${isSelected 
                  ? 'border-[#c8ff00] bg-[#c8ff00]/5 shadow-[0_0_20px_rgba(200,255,0,0.3)]' 
                  : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/70'
                }
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <motion.div 
                  className={`
                    p-2.5 md:p-3 rounded-xl transition-all duration-300
                    ${isSelected ? 'bg-[#c8ff00]/20 shadow-lg' : 'bg-gray-800/80 group-hover:bg-gray-800'}
                  `}
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={`
                    w-5 h-5 md:w-6 md:h-6 transition-colors duration-300
                    ${isSelected ? 'text-[#c8ff00]' : `${timeline.color} group-hover:text-gray-300`}
                  `} />
                </motion.div>
                <div className="flex-1">
                  <h3 className={`
                    font-semibold text-base md:text-lg transition-colors duration-300
                    ${isSelected ? 'text-[#c8ff00]' : 'text-white group-hover:text-gray-100'}
                  `}>
                    {timeline.label}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">{timeline.desc}</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: isSelected ? 1 : 0,
                    x: isSelected ? 0 : -10
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#c8ff00] flex items-center justify-center">
                    <span className="text-gray-900 text-lg">→</span>
                  </div>
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}