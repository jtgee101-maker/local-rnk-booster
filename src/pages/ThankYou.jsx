import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Calendar, ArrowRight, Star, Users, Gift, Download, Zap, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SocialShareButton from '@/components/shared/SocialShareButton';

export default function ThankYouPage() {
  const [leadData, setLeadData] = useState(null);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('quizLead');
    if (stored) {
      setLeadData(JSON.parse(stored));
    }
    
    // Don't clear immediately - keep for referral program
    // sessionStorage.removeItem('quizLead');
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c8ff00]/10 rounded-full blur-[150px]" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-[#c8ff00]/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[#c8ff00]" />
            </div>
          </motion.div>

          {/* Headline - Personalized */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {leadData?.business_name ? (
              <>
                🎉 Congratulations, <span className="text-[#c8ff00]">{leadData.business_name}</span>!
              </>
            ) : (
              <>
                Welcome to <span className="text-[#c8ff00]">LocalRank.ai</span>!
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 mb-3"
          >
            Your order is confirmed. We're already working on your GMB transformation.
          </motion.p>

          {leadData?.health_score && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-sm text-[#c8ff00]">
                Current Score: {leadData.health_score}/100 • Target: 85+
              </span>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-12"
          >
            {[
              {
                icon: Mail,
                title: 'Check Your Email',
                desc: "We've sent your order confirmation and audit report to your inbox"
              },
              {
                icon: Calendar,
                title: 'Schedule Your Kickoff Call',
                desc: 'Book a time with our team to review your custom optimization plan'
              },
              {
                icon: ArrowRight,
                title: 'See Results in 30 Days',
                desc: "We'll optimize your profile and get you ranking in the Map Pack"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-left"
              >
                <div className="p-3 rounded-xl bg-[#c8ff00]/10 flex-shrink-0">
                  <step.icon className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              onClick={() => window.open('https://calendly.com', '_blank')}
              className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
            >
              Schedule Your Kickoff Call
              <Calendar className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`mailto:${leadData?.email || ''}?subject=My GMB Audit Report`, '_blank')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 px-10 py-6 text-lg rounded-full"
            >
              <Download className="mr-2 w-5 h-5" />
              Download Audit PDF
            </Button>
          </motion.div>

          {/* Social Proof - Oxytocin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#c8ff00]" />
              <span className="text-white font-semibold">Join 8,900+ Local Business Owners</span>
            </div>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
              ))}
            </div>
            <p className="text-gray-400 text-sm text-center italic">
              "LocalRank.ai took us from invisible to #1 in the Map Pack in 28 days. Our calls tripled!"
            </p>
            <p className="text-gray-500 text-xs text-center mt-2">
              — Sarah M., HVAC Owner
            </p>
          </motion.div>

          {/* Social Sharing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-8"
          >
            <p className="text-gray-400 text-sm mb-3">
              <Share2 className="w-4 h-4 inline mr-1" />
              Help other business owners discover their GMB score:
            </p>
            <SocialShareButton 
              businessName={leadData?.business_name}
              healthScore={leadData?.health_score}
            />
          </motion.div>

          {/* Referral Program - Gamification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center"
          >
            <Button
              variant="ghost"
              onClick={() => setShowReferral(!showReferral)}
              className="text-gray-400 hover:text-[#c8ff00] transition-colors"
            >
              <Gift className="mr-2 w-4 h-4" />
              🎁 Refer a Friend, Get $100 Credit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            {showReferral && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border border-[#c8ff00]/30 rounded-xl p-6"
              >
                <h3 className="text-white font-bold mb-2">Share the Love 💚</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Know another business struggling with local SEO? Refer them and earn $100 in service credits when they sign up!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`https://localrank.ai?ref=${leadData?.email || 'friend'}`}
                    readOnly
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://localrank.ai?ref=${leadData?.email || 'friend'}`);
                      alert('Referral link copied!');
                    }}
                    className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
                  >
                    Copy Link
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-gray-600 text-sm mt-12"
          >
            Questions? Email us at <span className="text-[#c8ff00]">support@localrank.ai</span>
          </motion.p>
        </div>
      </div>
    </div>
  );
}