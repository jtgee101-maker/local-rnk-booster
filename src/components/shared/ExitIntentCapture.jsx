import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Zap, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExitIntentCapture({ 
  onCapture, 
  headline = "Wait! Don't Miss Your Free Audit",
  subtext = "See exactly where you're losing customers before you go",
  enabled = true 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (!enabled || captured) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !isOpen && !captured) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [enabled, isOpen, captured]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      // Track exit intent capture
      base44.analytics.track({
        eventName: 'exit_intent_captured',
        properties: { email, source: 'exit_popup' }
      });

      // Create lead
      await base44.entities.Lead.create({
        email,
        status: 'new',
        last_quiz_date: new Date().toISOString()
      });

      setCaptured(true);
      if (onCapture) onCapture(email);
      
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error('Exit intent capture error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-lg"
          >
            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-4 border-[#c8ff00] p-6 sm:p-8 relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!captured ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white text-center mb-3">
                    {headline}
                  </h3>
                  <p className="text-gray-300 text-center mb-6">
                    {subtext}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white h-12"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-black text-lg py-6 min-h-[56px]"
                    >
                      {loading ? (
                        'Sending...'
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Get My Free Audit Report
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="text-gray-500 text-xs text-center mt-4">
                    No credit card required • 100% free forever
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">
                    We'll Send It Right Over!
                  </h3>
                  <p className="text-gray-300">
                    Check your email for your free audit report
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}