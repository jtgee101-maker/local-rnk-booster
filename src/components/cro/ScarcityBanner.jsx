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
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <AlertTriangle className="w-8 h-8 text-white" />
              </motion.div>
              
              <div>
                <h3 className="text-white font-bold text-lg mb-2">
                  Limited Spots Available
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  Only <span className="font-bold text-xl">{spotsLeft}</span> discounted audits left today
                </p>
                <p className="text-white/70 text-xs">
                  Price increases to full $497 when spots fill up
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}