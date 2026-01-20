import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExitIntentModal({ onClose, onAccept }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let hasShown = sessionStorage.getItem('exitIntentShown');
    
    const handleMouseLeave = (e) => {
      if (hasShown) return;
      if (e.clientY <= 0) {
        base44.analytics.track({ eventName: 'exit_intent_modal_triggered' });
        setIsVisible(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleClose = () => {
    base44.analytics.track({ eventName: 'exit_intent_modal_dismissed' });
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleAccept = () => {
    base44.analytics.track({ eventName: 'exit_intent_modal_accepted' });
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border-2 border-[#c8ff00] rounded-2xl p-8 max-w-lg w-full relative"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 p-2 min-w-[44px] min-h-[44px] touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#c8ff00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-[#c8ff00]" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                Wait! Don't Miss Your <span className="text-[#c8ff00]">82% Discount</span>
              </h2>

              <p className="text-gray-400 mb-2">
                You're ONE click away from dominating your local market
              </p>

              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm font-semibold mb-1">
                  ⚠️ This offer expires in 14 minutes
                </p>
                <p className="text-gray-500 text-xs">
                  Once you leave, this discount is gone forever
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAccept}
                  className="bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black font-bold py-6 text-lg rounded-full min-h-[56px] touch-manipulation"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  Claim My 82% OFF Now
                </Button>

                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-400 text-sm"
                >
                  No thanks, I'll pay full price later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}