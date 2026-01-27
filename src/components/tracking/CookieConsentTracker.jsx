import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Cookie, X, Shield, Eye, MousePointer, Clock } from 'lucide-react';

export default function CookieConsentTracker({ quizStep, quizData }) {
  const [showBanner, setShowBanner] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [sessionData, setSessionData] = useState({
    session_id: null,
    first_visit: null,
    total_visits: 0,
    interactions: [],
    scroll_depth: 0,
    time_on_page: 0,
    pages_viewed: []
  });

  useEffect(() => {
    try {
      // Capture attribution data immediately on page load
      captureAttributionData();
      
      // Check if user has already consented
      const consent = localStorage?.getItem('lr_tracking_consent');
      const existingSession = localStorage?.getItem('lr_session_data');
      
      if (consent === 'accepted') {
        setHasConsented(true);
        if (existingSession) {
          try {
            setSessionData(JSON.parse(existingSession));
          } catch (e) {
            console.warn('Failed to parse session data:', e);
          }
        }
        initializeTracking();
      } else if (!consent) {
        // Show banner after 3 seconds if no consent recorded
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Cookie consent initialization error:', error);
      setShowBanner(true);
    }
  }, []);

  const captureAttributionData = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      
      const attribution = {
        utm_source: params.get('utm_source') || 'organic',
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        utm_term: params.get('utm_term'),
        fbclid: params.get('fbclid'),
        affiliate_id: params.get('ref') || params.get('aff') || params.get('affiliate'),
        sub_id: params.get('subid') || params.get('sub_id'),
        gclid: params.get('gclid'),
        referrer: document.referrer || 'direct',
        landing_page: window.location.pathname,
        timestamp: new Date().toISOString()
      };

      if (localStorage && !localStorage.getItem('lr_first_touch')) {
        localStorage.setItem('lr_first_touch', JSON.stringify(attribution));
      }

      if (sessionStorage) {
        sessionStorage.setItem('lr_last_touch', JSON.stringify(attribution));
      }
      
      return attribution;
    } catch (error) {
      console.error('Attribution capture error:', error);
      return {};
    }
  };

  const initializeTracking = () => {
    try {
      const existingData = localStorage?.getItem('lr_session_data');
      let session;

      if (existingData) {
        try {
          session = JSON.parse(existingData);
          session.total_visits = (session.total_visits || 0) + 1;
          session.last_visit = new Date().toISOString();
        } catch {
          throw new Error('Invalid session data');
        }
      } else {
        session = {
          session_id: `lr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          total_visits: 1,
          interactions: [],
          scroll_depth: 0,
          time_on_page: 0,
          pages_viewed: [window.location.pathname]
        };
      }

      setSessionData(session);
      if (localStorage) {
        localStorage.setItem('lr_session_data', JSON.stringify(session));
      }

      trackSessionStart(session);
      startBehaviorTracking(session);
    } catch (error) {
      console.error('Tracking initialization error:', error);
    }
  };

  const trackSessionStart = (session) => {
    if (!session?.session_id || !base44?.analytics?.track) return;
    try {
      Promise.resolve(
        base44.analytics.track({
          eventName: 'tracking_session_started',
          properties: {
            session_id: session.session_id,
            is_returning_user: session.total_visits > 1,
            total_visits: session.total_visits,
            days_since_first_visit: session.first_visit 
              ? Math.floor((Date.now() - new Date(session.first_visit).getTime()) / (1000 * 60 * 60 * 24))
              : 0
          }
        })
      ).catch(() => {});
    } catch (error) {
      console.warn('Session tracking error:', error);
    }
  };

  const startBehaviorTracking = (session) => {
    const startTime = Date.now();
    let maxScroll = 0;
    let interactionCount = 0;

    // Track scroll depth
    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;
        updateSessionData({ scroll_depth: scrollPercentage });
      }
    };

    // Track clicks
    const handleClick = (e) => {
      if (!e?.target) return;
      interactionCount++;
      const interaction = {
        type: 'click',
        element: e.target.tagName || 'unknown',
        text: (e.target.innerText || '')?.substring(0, 50) || '',
        timestamp: new Date().toISOString()
      };

      updateSessionData({ 
        interactions: [...(sessionData.interactions || []), interaction],
        interaction_count: interactionCount
      });

      if (base44?.analytics?.track && session?.session_id) {
        try {
          Promise.resolve(
            base44.analytics.track({
              eventName: 'user_interaction',
              properties: {
                session_id: session.session_id,
                ...interaction
              }
            })
          ).catch(() => {});
        } catch (e) {
          console.warn('Click tracking error:', e);
        }
      }
    };

    // Track form field interactions
    const handleInput = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const interaction = {
          type: 'form_interaction',
          field_type: e.target.type,
          field_name: e.target.name || e.target.placeholder,
          timestamp: new Date().toISOString()
        };
        
        updateSessionData({ 
          interactions: [...(sessionData.interactions || []), interaction]
        });
      }
    };

    // Track mouse movement patterns
    let mouseMovements = 0;
    const handleMouseMove = () => {
      mouseMovements++;
      if (mouseMovements % 100 === 0) { // Track every 100 movements
        updateSessionData({ mouse_activity: mouseMovements });
      }
    };

    // Update time on page every 10 seconds
    const timeInterval = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
      updateSessionData({ time_on_page: timeOnPage });
      
      if (timeOnPage % 30 === 0 && base44?.analytics?.track && session?.session_id) {
        try {
          Promise.resolve(
            base44.analytics.track({
              eventName: 'engagement_milestone',
              properties: {
                session_id: session.session_id,
                time_on_page: timeOnPage,
                scroll_depth: maxScroll,
                interactions: interactionCount
              }
            })
          ).catch(() => {});
        } catch (e) {
          console.warn('Engagement tracking error:', e);
        }
      }
    }, 10000);

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(timeInterval);
    };
  };

  const updateSessionData = (updates) => {
    try {
      setSessionData(prev => {
        const updated = { ...prev, ...updates };
        if (localStorage) {
          localStorage.setItem('lr_session_data', JSON.stringify(updated));
          const engagementScore = calculateEngagementScore(updated);
          localStorage.setItem('lr_engagement_score', engagementScore.toString());
        }
        return updated;
      });
    } catch (error) {
      console.error('Session update error:', error);
    }
  };

  const calculateEngagementScore = (data) => {
    // Formula: ES = (0.2 × S) + (0.3 × C) + (0.3 × T) + (0.2 × Q)
    const S = data.scroll_depth || 0; // Already 0-100
    const C = Math.min((data.interaction_count || 0) * 2, 100); // Clicks normalized to 100
    const T = Math.min((data.time_on_page || 0) / 3, 100); // Time (300s = 100%)
    const Q = (data.quiz_progress?.current_step ? (data.quiz_progress.current_step / 7) * 100 : 0); // Quiz 7 steps
    
    const score = (0.2 * S) + (0.3 * C) + (0.3 * T) + (0.2 * Q);
    return Math.round(Math.min(score, 100));
  };

  // Track quiz progress
  useEffect(() => {
    if (hasConsented && quizStep && base44?.analytics?.track && sessionData?.session_id) {
      try {
        Promise.resolve(
          base44.analytics.track({
            eventName: 'quiz_progress_tracked',
            properties: {
              session_id: sessionData.session_id,
              current_step: quizStep,
              quiz_data: quizData,
              timestamp: new Date().toISOString()
            }
          })
        ).catch(() => {});
      } catch (e) {
        console.warn('Quiz progress tracking error:', e);
      }

      updateSessionData({
        quiz_progress: {
          current_step: quizStep,
          timestamp: new Date().toISOString(),
          data: quizData
        }
      });
    }
  }, [quizStep, hasConsented]);

  const handleAccept = async () => {
    try {
      if (localStorage) {
        localStorage.setItem('lr_tracking_consent', 'accepted');
      }
      setHasConsented(true);
      setShowBanner(false);

      if (base44?.analytics?.track) {
        try {
          Promise.resolve(
            base44.analytics.track({
              eventName: 'tracking_consent_accepted',
              properties: {
                timestamp: new Date().toISOString()
              }
            })
          ).catch(() => {});
        } catch (e) {
          console.warn('Analytics tracking error:', e);
        }
      }

      initializeTracking();
      syncBehaviorToBackend();
    } catch (error) {
      console.warn('Accept consent error:', error);
      setHasConsented(true);
      setShowBanner(false);
    }
  };

  const syncBehaviorToBackend = async () => {
    try {
      const behaviorDataRaw = localStorage?.getItem('lr_session_data') || '{}';
      let behaviorData;
      try {
        behaviorData = typeof behaviorDataRaw === 'string' ? JSON.parse(behaviorDataRaw) : behaviorDataRaw;
      } catch (e) {
        console.warn('Failed to parse behavior data:', e);
        behaviorData = {};
      }

      const engagementScore = parseInt(localStorage?.getItem('lr_engagement_score') || '0') || 0;

      const firstTouchRaw = localStorage?.getItem('lr_first_touch') || '{}';
      let firstTouch;
      try {
        firstTouch = typeof firstTouchRaw === 'string' ? JSON.parse(firstTouchRaw) : firstTouchRaw;
      } catch (e) {
        firstTouch = {};
      }

      const lastTouchRaw = sessionStorage?.getItem('lr_last_touch') || '{}';
      let lastTouch;
      try {
        lastTouch = typeof lastTouchRaw === 'string' ? JSON.parse(lastTouchRaw) : lastTouchRaw;
      } catch (e) {
        lastTouch = {};
      }

      if (!behaviorData?.session_id || !base44?.functions?.invoke) {
        return;
      }

      try {
        await base44.functions.invoke('syncUserBehavior', {
          session_id: behaviorData.session_id,
          consent_given: true,
          engagement_score: engagementScore,
          scroll_depth: behaviorData.scroll_depth || 0,
          click_count: behaviorData.interaction_count || 0,
          time_on_page: behaviorData.time_on_page || 0,
          quiz_completion: behaviorData.quiz_progress?.current_step ? (behaviorData.quiz_progress.current_step / 7) * 100 : 0,
          interactions: Array.isArray(behaviorData.interactions) ? behaviorData.interactions : [],
          quiz_progress: behaviorData.quiz_progress || {},
          is_returning: (behaviorData.total_visits || 0) > 1,
          first_visit: behaviorData.first_visit,
          last_visit: behaviorData.last_visit,
          total_visits: behaviorData.total_visits || 1,
          pages_viewed: Array.isArray(behaviorData.pages_viewed) ? behaviorData.pages_viewed : [],
          device_info: {
            user_agent: navigator?.userAgent || 'unknown',
            screen_width: window?.innerWidth || 0,
            screen_height: window?.innerHeight || 0
          },
          traffic_source: {
            first_touch: firstTouch,
            last_touch: lastTouch
          }
        });
      } catch (syncError) {
        console.warn('Sync request error:', syncError);
      }
    } catch (error) {
      console.warn('Failed to prepare behavior sync:', error);
    }
  };

  const handleDecline = () => {
    try {
      if (localStorage) {
        localStorage.setItem('lr_tracking_consent', 'declined');
      }
      setShowBanner(false);

      if (base44?.analytics?.track) {
        try {
          Promise.resolve(
            base44.analytics.track({
              eventName: 'tracking_consent_declined',
              properties: {
                timestamp: new Date().toISOString()
              }
            })
          ).catch(() => {});
        } catch (e) {
          console.warn('Analytics tracking error:', e);
        }
      }
    } catch (error) {
      console.warn('Decline consent error:', error);
      setShowBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 md:p-6 safe-bottom"
        >
          <div className="w-full max-w-full sm:max-w-5xl mx-auto px-0 sm:px-4">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-[#c8ff00]/30 rounded-lg sm:rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#c8ff00]/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-none">
                    <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-[#c8ff00]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8ff00] flex-shrink-0" />
                      <span>We Value Your Privacy</span>
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                      We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                      By clicking "Accept", you consent to our use of cookies and agree to our Privacy Policy.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Eye className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">Page interactions</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MousePointer className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">User behavior</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="truncate">Session data</span>
                      </div>
                    </div>

                    <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full">
                      <Button
                        onClick={handleAccept}
                        disabled={hasConsented}
                        className="bg-[#c8ff00] hover:bg-[#d4ff33] disabled:bg-gray-600 text-black font-semibold px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base shadow-lg w-full xs:w-auto"
                      >
                        Accept & Continue
                      </Button>
                      <Button
                        onClick={handleDecline}
                        disabled={hasConsented}
                        variant="outline"
                        className="border-gray-500 text-white hover:bg-gray-700 hover:text-white hover:border-gray-400 disabled:bg-gray-700 disabled:text-gray-500 font-medium px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base w-full xs:w-auto"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>

                  <button
                    onClick={handleDecline}
                    disabled={hasConsented}
                    className="flex-shrink-0 text-gray-400 hover:text-white disabled:text-gray-600 transition-colors p-1 -m-1 ml-auto sm:ml-0"
                    aria-label="Close cookie banner"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}