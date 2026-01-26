import React from 'react';
import { motion } from 'framer-motion';
import { Home, Stethoscope, ShoppingBag, Briefcase, MoreHorizontal } from 'lucide-react';

const categories = [
  { id: 'home_services', label: 'Home Services', icon: Home, desc: 'HVAC, Plumbing, Roofing' },
  { id: 'medical', label: 'Medical / Dental', icon: Stethoscope, desc: 'Clinics, Practices' },
  { id: 'retail', label: 'Retail', icon: ShoppingBag, desc: 'Stores, Restaurants' },
  { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Law, Finance, Real Estate' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, desc: 'Tell us more' },
];

export default function CategoryStep({ onSelect }) {
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
          <span className="text-xs text-[#c8ff00] font-semibold">STEP 1 OF 5</span>
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          What Type of Business Are You <span className="text-[#c8ff00]">Dominating?</span>
        </h2>
        <p className="text-gray-400 text-lg">
          We'll customize your audit to reveal category-specific ranking secrets
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {categories.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(cat.id)}
            disabled={isSelecting}
            className="w-full group relative bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-5 md:p-6 text-left transition-all duration-200 active:border-[#c8ff00]/50 active:bg-gray-900/80 min-h-[100px] touch-manipulation disabled:opacity-50"
          >
              <div className="flex items-start gap-4">
                <div className="p-2.5 md:p-3 rounded-xl bg-gray-800 group-active:bg-[#c8ff00]/10 transition-colors">
                  <cat.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-active:text-[#c8ff00] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base md:text-lg text-white group-active:text-[#c8ff00] transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">{cat.desc}</p>
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