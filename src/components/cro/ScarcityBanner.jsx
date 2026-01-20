import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ScarcityBanner({ 
  spotsLeft = 7, 
  onDismiss,
  showAfter = 30000 // Show after 30 seconds
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => 
    sessionStorage.getItem('scarcity_dismissed') === 'true'
  );

  useEffect(() => {
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfter);

    return () => clearTimeout(timer);
  }, [dismissed, showAfter]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    sessionStorage.setItem('scarcity_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && !dismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="hidden md:block fixed bottom-4 right-4 z-50 max-w-xs"
        >
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-3 shadow-xl border border-white/20">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <AlertTriangle className="w-5 h-5 text-white" />
              </motion.div>
              
              <div>
                <h3 className="text-white font-bold text-sm mb-1">
                  Limited Spots Available
                </h3>
                <p className="text-white/90 text-xs mb-1">
                  Only <span className="font-bold text-base">{spotsLeft}</span> discounted audits left
                </p>
                <p className="text-white/70 text-[10px]">
                  Price increases to $497 when full
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}