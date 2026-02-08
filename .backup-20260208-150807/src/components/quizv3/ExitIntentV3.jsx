import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Zap, AlertCircle, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExitIntentV3({ onClose, onAccept }) {
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleAccept = () => {
    base44.analytics.track({ eventName: 'quizv3_exit_offer_accepted' });
    onAccept();
    onClose();
  };

  const handleDecline = () => {
    base44.analytics.track({ eventName: 'quizv3_exit_offer_declined' });
    onClose();
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={handleDecline}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-red-500/50 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Alert Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
          Wait! Don't Let Your Competitors Win
        </h3>

        <p className="text-gray-300 text-center mb-6">
          While you're here reading this, your competitors are claiming the free trials in your zip code. <span className="text-red-400 font-bold">Only 1 allowed per territory.</span>
        </p>

        {/* Loss Framing */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">What You'll Miss:</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>
              <span>Your personalized GMB health audit ($500 value)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>
              <span>Pre-authorized Paige AI auto-fix (saves $2,000/mo)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>
              <span>72-hour fast-track to Map Pack rankings</span>
            </li>
          </ul>
        </div>

        {/* Urgency Timer */}
        <div className="bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-lg p-4 mb-6 text-center">
          <p className="text-[#c8ff00] font-semibold text-sm mb-2">
            This offer expires in:
          </p>
          <div className="text-3xl font-bold text-white">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-[0_0_40px_rgba(200,255,0,0.4)] transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            Complete My Free Audit Now
          </Button>
          
          <button
            onClick={handleDecline}
            className="w-full text-gray-400 hover:text-gray-300 text-sm font-medium py-2 transition-colors"
          >
            No thanks, I'll pay for leads on Thumbtack
          </button>
        </div>

        {/* Social Proof */}
        <p className="text-center text-xs text-gray-500 mt-4">
          🔥 87 businesses in your area completed this today
        </p>
      </motion.div>
    </motion.div>
  );
}