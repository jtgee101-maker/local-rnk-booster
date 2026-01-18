import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function DiscountUnlockStep({ onComplete }) {
  const [isToggled, setIsToggled] = useState(false);

  useEffect(() => {
    // Auto-toggle after 800ms
    const timer = setTimeout(() => {
      setIsToggled(true);
    }, 800);

    // Auto-complete after showing the unlock
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[60vh] flex items-center justify-center"
    >
      <div className="text-center">
        {/* Toggle Switch Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex justify-center"
        >
          <div 
            className={`relative w-32 h-16 rounded-full cursor-pointer transition-all duration-500 ${
              isToggled ? 'bg-[#c8ff00]' : 'bg-gray-700'
            }`}
            onClick={() => setIsToggled(!isToggled)}
          >
            <motion.div
              className={`absolute top-2 left-2 w-12 h-12 rounded-full transition-all duration-500 flex items-center justify-center ${
                isToggled ? 'bg-black' : 'bg-gray-500'
              }`}
              animate={{ 
                x: isToggled ? 64 : 0 
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {isToggled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Zap className="w-6 h-6 text-[#c8ff00]" />
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Text */}
        <AnimatePresence mode="wait">
          {!isToggled ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Unlocking Your Discount...
              </h2>
              <p className="text-gray-400">Please wait</p>
            </motion.div>
          ) : (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring" }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-6xl font-bold text-[#c8ff00] mb-3"
              >
                82% OFF
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                just unlocked for you!
              </h2>
              <p className="text-gray-400">Redirecting to your personalized plan...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}