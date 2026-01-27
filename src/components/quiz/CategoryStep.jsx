import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Stethoscope, ShoppingBag, Briefcase, MoreHorizontal, ArrowRight } from 'lucide-react';

const categories = [
  { id: 'home_services', label: 'Home Services', icon: Home, desc: 'HVAC, Plumbing, Roofing' },
  { id: 'medical', label: 'Medical / Dental', icon: Stethoscope, desc: 'Clinics, Practices' },
  { id: 'retail', label: 'Retail', icon: ShoppingBag, desc: 'Stores, Restaurants' },
  { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Law, Finance, Real Estate' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, desc: 'Tell us more' },
];

export default function CategoryStep({ onSelect }) {
  const [selectedId, setSelectedId] = React.useState(null);

  const handleSelect = async (id) => {
    if (selectedId || !onSelect) return;
    
    setSelectedId(id);
    
    // Small delay for visual feedback
    setTimeout(() => {
      if (typeof onSelect === 'function') {
        onSelect(id);
      }
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto px-4 sm:px-6"
    >
      <div className="text-center mb-8 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs font-semibold text-[#c8ff00] uppercase tracking-wide">Step 1 of 5</span>
        </motion.div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 px-4">
          What Type of Business Are You <span className="text-[#c8ff00]">Dominating?</span>
        </h2>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
          We'll customize your audit to reveal category-specific ranking secrets
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <AnimatePresence>
          {categories.map((cat, index) => {
            const isSelected = selectedId === cat.id;
            const isDisabled = selectedId && !isSelected;
            
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isDisabled ? 0.4 : 1, 
                  y: 0,
                  scale: isSelected ? 1.02 : 1
                }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={!selectedId ? { scale: 1.02 } : {}}
                whileTap={!selectedId ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(cat.id)}
                disabled={!!selectedId}
                className={`
                  group relative w-full
                  bg-gradient-to-br from-gray-900/80 to-gray-900/50 
                  backdrop-blur-sm border rounded-2xl
                  p-4 sm:p-5 md:p-6
                  text-left transition-all duration-300
                  min-h-[110px] sm:min-h-[120px]
                  touch-manipulation
                  ${isSelected 
                    ? 'border-[#c8ff00] bg-[#c8ff00]/5 shadow-[0_0_20px_rgba(200,255,0,0.3)]' 
                    : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/70'
                  }
                  ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <motion.div 
                    className={`
                      p-2.5 sm:p-3 rounded-xl transition-all duration-300
                      ${isSelected 
                        ? 'bg-[#c8ff00]/20 shadow-lg' 
                        : 'bg-gray-800/80 group-hover:bg-gray-800'
                      }
                    `}
                    animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <cat.icon 
                      className={`
                        w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300
                        ${isSelected ? 'text-[#c8ff00]' : 'text-gray-400 group-hover:text-gray-300'}
                      `} 
                    />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`
                      font-semibold text-base sm:text-lg mb-1 transition-colors duration-300
                      ${isSelected ? 'text-[#c8ff00]' : 'text-white group-hover:text-gray-100'}
                    `}>
                      {cat.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                      {cat.desc}
                    </p>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: isSelected ? 1 : 0,
                      x: isSelected ? 0 : -10
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#c8ff00] flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-gray-900" />
                    </div>
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}