import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Zap, X, ArrowRight, Clock, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Upsell1Page() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const [leadData, setLeadData] = React.useState(null);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('quizLead');
    if (stored) {
      setLeadData(JSON.parse(stored));
    }
  }, []);

  const criticalIssues = leadData?.critical_issues || [
    'Missing geo-tagged photos reducing local relevance by 34%',
    'Primary category not optimized for high-intent searches',
    'Keyword density 67% below top 3 competitors'
  ];

  const handleAccept = async () => {
    setIsProcessing(true);
    
    try {
      const stored = sessionStorage.getItem('quizLead');
      const leadEmail = stored ? JSON.parse(stored).email : 'customer@example.com';
      
      await base44.entities.Order.create({
        email: leadEmail,
        lead_id: leadData?.id,
        upsells: [{
          product: 'Google Authority Engine (48hr Fix)',
          price: 197,
          accepted: true
        }],
        total_amount: 197,
        status: 'completed'
      });
      
      navigate(createPageUrl('Upsell'));
    } catch (error) {
      console.error('Upsell error:', error);
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    navigate(createPageUrl('Upsell'));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center py-12 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[150px]" />
      
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Skip Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end mb-4"
        >
          <Button
            variant="ghost"
            onClick={handleDecline}
            className="text-gray-500 hover:text-gray-300"
          >
            Skip this offer
            <X className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/70 backdrop-blur border-2 border-red-500/50 rounded-3xl p-8 md:p-12 shadow-[0_0_60px_rgba(239,68,68,0.3)]"
        >
          {/* Alert Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-5 py-2">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-bold text-sm">CRITICAL VULNERABILITIES DETECTED</span>
            </div>
          </motion.div>

          {/* Headline - DOPAMINE + ADRENALINE */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              ⚠️ URGENT: {leadData?.business_name || 'Your Business'} Is Losing <span className="text-red-400">$4,300/Month</span> to These Errors
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              Your audit revealed {criticalIssues.length} critical vulnerabilities costing you customers <span className="text-red-400 font-semibold">right now</span>
            </p>
            <p className="text-gray-500 text-sm">
              Every day you wait = 18 more customers going to competitors
            </p>
          </motion.div>

          {/* Issues List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-950/50 border border-gray-800 rounded-2xl p-6 mb-8"
          >
            <h3 className="flex items-center gap-2 font-semibold text-white text-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Issues Found in Your Profile
            </h3>
            
            <div className="space-y-3">
              {criticalIssues.map((issue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{issue}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* The Offer - ENDORPHIN + SEROTONIN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border-2 border-[#c8ff00] rounded-2xl p-8 mb-8"
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[#c8ff00]/20">
                <Zap className="w-8 h-8 text-[#c8ff00] flex-shrink-0" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1 mb-3">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 font-bold">48-HOUR TURNAROUND</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  The Google Authority Engine™
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our GMB experts will manually fix every critical error, optimize your top 10 revenue-driving keywords, 
                  and implement our proven 24-point checklist that's generated <span className="text-[#c8ff00] font-semibold">$47M in customer value</span>.
                </p>
                <p className="text-sm text-gray-500 italic">
                  ✅ Used by 8,900+ local businesses • 4.9★ average rating
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {[
                'Fix all geo-tagging errors instantly',
                'Optimize primary & secondary categories',
                'Boost keyword density to competitor level',
                'Add 15 high-authority backlinks',
                'Upload 10 geo-tagged photos',
                'Write 3 optimized GMB posts'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-gray-900/30 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-gray-500 text-sm mb-1">One-Time Investment</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#c8ff00]">$197</span>
                    <span className="text-gray-500 line-through text-xl">$497</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-full text-sm font-bold mb-2">
                    60% OFF - EXPIRES IN 14 MIN
                  </div>
                  <p className="text-gray-500 text-xs">Save $300 Today Only</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-white font-semibold">100% Money-Back Guarantee</p>
                  <p className="text-xs text-gray-500">If we don't fix all issues in 48hrs, full refund</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col gap-3"
          >
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold py-7 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.4)] hover:scale-105"
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <Clock className="mr-2 w-5 h-5" />
                  Yes! Fix My Profile in 48 Hours
                  <ArrowRight className="ml-2 w-6 h-6" />
                </>
              )}
            </Button>

            <button
              onClick={handleDecline}
              className="text-gray-500 hover:text-gray-400 text-sm py-3 transition-colors"
            >
              No thanks, I'll risk losing more customers while I figure this out myself
            </button>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center text-gray-600 text-xs mt-6"
          >
            🔒 Secure payment • 48-hour turnaround guaranteed
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}