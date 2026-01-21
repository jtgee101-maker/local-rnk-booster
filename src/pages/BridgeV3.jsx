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
      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 text-center">
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
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
          >
            ✓ Audit Complete.
            <br />
            <span className="text-[#c8ff00]">Connecting to Paige AI...</span>
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
            
            <p className="text-gray-300 mb-4 text-base">
              We found <span className="text-red-400 font-bold">3 fixable errors</span> causing ${leadData?.health_score ? Math.round((100 - leadData.health_score) * 150) : '3,000'}/mo in lost revenue.
            </p>

            <div className="bg-gradient-to-r from-[#c8ff00]/15 to-green-500/10 border-2 border-[#c8ff00]/40 rounded-lg p-5 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🤖</div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold mb-2">Automated Fix Authorized</p>
                  <p className="text-gray-300 text-sm mb-3">
                    Your audit data has been pre-loaded into Paige AI's automation engine. <span className="text-[#c8ff00] font-semibold">No manual setup needed.</span>
                  </p>
                  <p className="text-xs text-gray-400 bg-gray-900/50 rounded px-3 py-2">
                    <span className="text-[#c8ff00] font-bold">Next:</span> Click "Start Free Trial" and Paige AI applies fixes automatically (72-hour turnaround).
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-red-500/20 border-2 border-red-500/50 rounded-full px-5 py-2.5 shadow-lg shadow-red-500/20"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </div>
              <span className="text-red-200 text-sm font-bold">
                Pre-auth expires: {countdown}:00
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

              <h3 className="text-2xl font-bold text-white mb-3">You're So Close!</h3>
              <p className="text-gray-300 mb-6">
                Your <span className="text-[#c8ff00] font-bold">pre-authorized AI fix</span> is ready on the next page. Leaving now means manual setup later (or your competitor claims your territory).
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