import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

export default function StickyConversionBar({ 
  onCTA, 
  ctaText = 'Claim Your Audit',
  price = '0.11',
  showAfterScroll = 800 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl pointer-events-auto"
          style={{ WebkitTransform: 'translateZ(0)' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-12 h-12 rounded-full bg-[#c8ff00]/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base">
                    82% OFF Ending Soon
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Start for just ${price}/day
                  </p>
                </div>
              </div>

              <Button
                onClick={onCTA}
                className="w-full sm:w-auto bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-8 py-6 text-base rounded-full transition-all hover:shadow-[0_0_30px_rgba(200,255,0,0.4)] hover:scale-105 active:scale-95 min-h-[56px] md:min-h-[48px] touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="flex items-center gap-2">
                  {ctaText}
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}