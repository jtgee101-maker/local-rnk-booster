import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const DEFAULT_AFFILIATE_URL = 'https://www.merchynt.com/paige?fpr=mr22&fp_sid=sg';
const DEFAULT_REDIRECT_DELAY = 3000; // 3 seconds

export default function BridgeV3() {
  const [countdown, setCountdown] = useState(3);
  const [showExitModal, setShowExitModal] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const [affiliateUrl, setAffiliateUrl] = useState(DEFAULT_AFFILIATE_URL);
  const [redirectDelay, setRedirectDelay] = useState(DEFAULT_REDIRECT_DELAY);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('ab_session_id');
    
    // Track bridge page view
    base44.analytics.track({ eventName: 'bridge_v3_viewed' });
    base44.entities.ConversionEvent.create({
      funnel_version: 'v3',
      event_name: 'bridge_v3_viewed',
      session_id: sessionId
    }).catch(err => console.error('Error tracking event:', err));

    // Load settings
    const loadSettings = async () => {
      try {
        const [linkSettings, timerSettings] = await Promise.all([
          base44.entities.AppSettings.filter({ setting_key: 'affiliate_link' }),
          base44.entities.AppSettings.filter({ setting_key: 'bridge_timer' })
        ]);
        
        if (linkSettings.length > 0) {
          setAffiliateUrl(linkSettings[0].setting_value.url || DEFAULT_AFFILIATE_URL);
        }
        if (timerSettings.length > 0) {
          const seconds = timerSettings[0].setting_value.seconds || 3;
          setCountdown(seconds);
          setRedirectDelay(seconds * 1000);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();

    // Get lead data
    const stored = sessionStorage.getItem('quizLead');
    if (stored) {
      setLeadData(JSON.parse(stored));
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Exit intent detection
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && countdown > 0) {
        setShowExitModal(true);
        base44.analytics.track({ eventName: 'bridge_exit_intent' });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleRedirect = () => {
    const sessionId = sessionStorage.getItem('ab_session_id');
    
    base44.analytics.track({ 
      eventName: 'affiliate_redirect_initiated',
      properties: { 
        business_name: leadData?.business_name,
        health_score: leadData?.health_score,
        affiliate_url: affiliateUrl
      }
    });
    
    base44.entities.ConversionEvent.create({
      funnel_version: 'v3',
      event_name: 'affiliate_redirect_initiated',
      session_id: sessionId,
      lead_id: leadData?.id,
      properties: {
        business_name: leadData?.business_name,
        health_score: leadData?.health_score,
        affiliate_url: affiliateUrl
      }
    }).catch(err => console.error('Error tracking event:', err));

    // Redirect to affiliate link
    window.location.href = affiliateUrl;
  };

  const handleStay = () => {
    setShowExitModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c8ff00]/10 rounded-full blur-[150px] animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Syncing Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 mx-auto mb-8 rounded-full border-4 border-[#c8ff00]/20 border-t-[#c8ff00]"
          />

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Identity Confirmed.
            <br />
            <span className="text-[#c8ff00]">Syncing Your Audit Results...</span>
          </motion.h1>

          {/* Transfer Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#c8ff00]" />
              <span className="text-[#c8ff00] font-semibold">AUTHORIZED CONNECTION</span>
            </div>
            
            <p className="text-gray-300 mb-4">
              Our audit identified <span className="text-red-400 font-bold">3 critical ranking errors</span>. To save you the <span className="line-through text-gray-500">$2,000/mo agency fee</span>, we have authorized a direct connection to the <span className="text-[#c8ff00] font-semibold">Paige AI Automation Engine</span>.
            </p>

            <div className="bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-2">📋 Next Step:</p>
              <p className="text-gray-300 text-sm">
                On the next page, click the <span className="text-[#c8ff00] font-bold">"Start Free Trial"</span> button. This will instantly apply our audit data to your Google Profile for an automated fix.
              </p>
            </div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-semibold">
                This direct-sync link expires in {countdown}:00
              </span>
            </motion.div>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-3 text-gray-400"
          >
            <Loader2 className="w-5 h-5 animate-spin text-[#c8ff00]" />
            <span className="text-sm">Transferring to Paige AI...</span>
          </motion.div>

          {/* Manual Continue (fallback) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8"
          >
            <Button
              onClick={handleRedirect}
              variant="ghost"
              className="text-gray-500 hover:text-white text-sm"
            >
              Continue Manually <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Exit Intent Modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500/50 rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Wait!</h3>
              <p className="text-gray-300 mb-6">
                Your <span className="text-[#c8ff00] font-semibold">free automated fix</span> is ready. Don't leave your leads to your competitors.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleStay}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Stay & Continue
                </Button>
                <Button
                  onClick={() => {
                    base44.analytics.track({ eventName: 'bridge_exit_confirmed' });
                    window.history.back();
                  }}
                  variant="ghost"
                  className="flex-1 text-gray-400"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}