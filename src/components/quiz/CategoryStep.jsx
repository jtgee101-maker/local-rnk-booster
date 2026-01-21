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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat, index) => (
          <motion.div 
            key={cat.id}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(cat.id)}
              className="w-full group relative bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 text-left transition-all duration-300 hover:border-[#c8ff00]/50 hover:bg-gray-900/80 min-h-[100px] touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-[#c8ff00]/10 transition-colors">
                  <cat.icon className="w-6 h-6 text-gray-400 group-hover:text-[#c8ff00] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-[#c8ff00] transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
                </div>
                <motion.div
                  className="text-[#c8ff00] opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 5 }}
                >
                  →
                </motion.div>
              </div>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}