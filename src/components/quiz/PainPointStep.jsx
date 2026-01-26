import React from 'react';
import { motion } from 'framer-motion';
import { MapPinOff, Star, PhoneOff, Settings } from 'lucide-react';

const painPoints = [
  {
    id: 'not_in_map_pack',
    label: "I don't show up in the Map Pack",
    icon: MapPinOff,
    desc: 'Competitors are ranking above me'
  },
  {
    id: 'low_reviews',
    label: 'My competitors have more reviews',
    icon: Star,
    desc: 'Review count is holding me back'
  },
  {
    id: 'no_calls',
    label: "I'm getting views but no calls",
    icon: PhoneOff,
    desc: 'Low conversion rate'
  },
  {
    id: 'not_optimized',
    label: "Not sure if I'm optimized",
    icon: Settings,
    desc: 'Need a professional review'
  },
];

export default function PainPointStep({ onSelect }) {
  const [isSelecting, setIsSelecting] = React.useState(false);

  const handleSelect = (id) => {
    if (isSelecting) return;
    setIsSelecting(true);
    onSelect(id);
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
          <span className="text-xs text-[#c8ff00] font-semibold">STEP 2 OF 5</span>
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          What's the <span className="text-[#c8ff00]">#1 Thing</span> Holding You Back?
        </h2>
        <p className="text-gray-400 text-lg">
          Your audit will prioritize this pain point with an instant fix
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {painPoints.map((point, index) => (
          <motion.button
            key={point.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(point.id)}
            disabled={isSelecting}
            className="group w-full bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4 md:p-5 text-left transition-all duration-200 active:border-[#c8ff00]/50 active:bg-gray-900/80 min-h-[88px] touch-manipulation disabled:opacity-50"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 rounded-xl bg-gray-800 group-active:bg-[#c8ff00]/10 transition-colors">
                <point.icon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-active:text-[#c8ff00] transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base md:text-lg text-white group-active:text-[#c8ff00] transition-colors">
                  {point.label}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">{point.desc}</p>
              </div>
              <div className="text-[#c8ff00] opacity-0 group-active:opacity-100 transition-opacity text-xl">
                →
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}