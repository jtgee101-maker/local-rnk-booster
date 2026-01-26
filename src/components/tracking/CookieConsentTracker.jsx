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
    // Check if user has already consented
    const consent = localStorage.getItem('lr_tracking_consent');
    const existingSession = localStorage.getItem('lr_session_data');
    
    if (consent === 'accepted') {
      setHasConsented(true);
      if (existingSession) {
        setSessionData(JSON.parse(existingSession));
      }
      initializeTracking();
    } else if (!consent) {
      // Show banner after 3 seconds if no consent recorded
      setTimeout(() => setShowBanner(true), 3000);
    }
  }, []);

  const initializeTracking = () => {
    const existingData = localStorage.getItem('lr_session_data');
    let session;

    if (existingData) {
      session = JSON.parse(existingData);
      session.total_visits += 1;
      session.last_visit = new Date().toISOString();
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
    localStorage.setItem('lr_session_data', JSON.stringify(session));

    // Track this session
    trackSessionStart(session);
    
    // Initialize behavior tracking
    startBehaviorTracking(session);
  };

  const trackSessionStart = (session) => {
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
    });
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
      interactionCount++;
      const interaction = {
        type: 'click',
        element: e.target.tagName,
        text: e.target.innerText?.substring(0, 50) || '',
        timestamp: new Date().toISOString()
      };
      
      updateSessionData({ 
        interactions: [...(sessionData.interactions || []), interaction],
        interaction_count: interactionCount
      });

      base44.analytics.track({
        eventName: 'user_interaction',
        properties: {
          session_id: session.session_id,
          ...interaction
        }
      });
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
      
      if (timeOnPage % 30 === 0) { // Every 30 seconds
        base44.analytics.track({
          eventName: 'engagement_milestone',
          properties: {
            session_id: session.session_id,
            time_on_page: timeOnPage,
            scroll_depth: maxScroll,
            interactions: interactionCount
          }
        });
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
    setSessionData(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('lr_session_data', JSON.stringify(updated));
      return updated;
    });
  };

  // Track quiz progress
  useEffect(() => {
    if (hasConsented && quizStep) {
      base44.analytics.track({
        eventName: 'quiz_progress_tracked',
        properties: {
          session_id: sessionData.session_id,
          current_step: quizStep,
          quiz_data: quizData,
          timestamp: new Date().toISOString()
        }
      });

      updateSessionData({
        quiz_progress: {
          current_step: quizStep,
          timestamp: new Date().toISOString(),
          data: quizData
        }
      });
    }
  }, [quizStep, hasConsented]);

  const handleAccept = () => {
    localStorage.setItem('lr_tracking_consent', 'accepted');
    setHasConsented(true);
    setShowBanner(false);
    
    base44.analytics.track({
      eventName: 'tracking_consent_accepted',
      properties: {
        timestamp: new Date().toISOString()
      }
    });

    initializeTracking();
  };

  const handleDecline = () => {
    localStorage.setItem('lr_tracking_consent', 'declined');
    setShowBanner(false);
    
    base44.analytics.track({
      eventName: 'tracking_consent_declined',
      properties: {
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-[#c8ff00]/30 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#c8ff00]/20 rounded-xl flex items-center justify-center">
                      <Cookie className="w-6 h-6 text-[#c8ff00]" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#c8ff00]" />
                      Enhanced Experience & Insights
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      We use cookies and tracking to provide you with personalized insights and improve your experience. 
                      This helps us understand your needs better, even before you submit your information.
                    </p>
                    
                    {/* What we track */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span>Page interactions</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MousePointer className="w-4 h-4 text-purple-400" />
                        <span>User behavior</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span>Session data</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleAccept}
                        className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-6"
                      >
                        Accept & Continue
                      </Button>
                      <Button
                        onClick={handleDecline}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>

                  <button
                    onClick={handleDecline}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
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