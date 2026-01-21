import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, X, TrendingUp, Users, BarChart3, MessageSquare, Calendar, Zap, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ABTestProvider, useABTest } from '@/components/abtest/ABTestProvider';
import { toast } from 'sonner';
import MobileOptimizations from '@/components/quizv3/MobileOptimizations';
import MobileViewportFix from '@/components/utils/MobileViewportFix';

function UpsellContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackView, trackConversion } = useABTest();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('dfy');
  const [leadData, setLeadData] = useState(null);
  const [error, setError] = useState(null);
  const [pageLoadTime] = useState(Date.now());

  useEffect(() => {
    // Track page view
    base44.analytics.track({ eventName: 'upsell_page_viewed' });
    const stored = sessionStorage.getItem('quizLead');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate email and required contact fields
      if (!parsed.email || !parsed.phone || !parsed.consent) {
        setError('Required contact information missing. Please restart the quiz.');
        setTimeout(() => navigate(createPageUrl('QuizV2')), 2000);
        return;
      }
      setLeadData(parsed);
    } else {
      setError('No quiz data found. Please restart the quiz.');
      setTimeout(() => navigate(createPageUrl('QuizV2')), 2000);
    }
    
    trackView('upsell2', 'headline');

    if (searchParams.get('upsell_accepted') === 'true') {
      base44.analytics.track({ eventName: 'upsell1_payment_completed' });
    }

    // Track exit/drop-off
    const handleBeforeUnload = () => {
      const timeOnPage = (Date.now() - pageLoadTime) / 1000;
      base44.analytics.track({ 
        eventName: 'upsell_exit', 
        properties: { 
          time_on_page: Math.round(timeOnPage),
          selected_plan: selectedPlan 
        } 
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [searchParams, navigate, pageLoadTime, selectedPlan]);

  const plans = {
    monthly: {
      name: 'Monthly Local SEO',
      price: 199,
      period: '/month',
      features: [
        'Weekly GMB post creation',
        'Review monitoring & responses',
        'Monthly ranking reports',
        'Competitor tracking',
        'Q&A management',
        'Photo uploads (2 per month)'
      ]
    },
    dfy: {
      name: 'Full Service DFY',
      price: 499,
      period: '/month',
      popular: true,
      features: [
        'Everything in Monthly plan',
        'Dedicated account manager',
        'Daily GMB management',
        'Review generation campaigns',
        'Reputation management',
        'Local citation building',
        'Weekly strategy calls',
        'Priority support'
      ]
    }
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    setError(null);
    trackConversion('upsell2', 'headline', plans[selectedPlan].price);
    
    try {
      if (!leadData?.email) {
        throw new Error('Email not found. Please restart the quiz.');
      }

      const plan = plans[selectedPlan];

      base44.analytics.track({ 
        eventName: 'upsell2_accepted', 
        properties: { 
          plan: selectedPlan,
          price: plan.price,
          business_name: leadData.business_name
        } 
      });

      // Create recurring subscription order
      const order = await base44.entities.Order.create({
        lead_id: leadData.id || '',
        email: leadData.email,
        base_offer: {
          product: plan.name,
          price: plan.price
        },
        order_bumps: [],
        upsells: [{
          product: `${plan.name} - Monthly Subscription`,
          price: plan.price,
          accepted: true
        }],
        total_amount: plan.price,
        status: 'pending'
      });

      // Send subscription confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: leadData.email,
          subject: `✅ Welcome to ${plan.name} - Your Subscription Activated`,
          body: `Hi ${leadData.business_name || 'Business Owner'},\n\nThank you for upgrading to ${plan.name}!\n\nSubscription Details:\n- Plan: ${plan.name}\n- Monthly Investment: $${plan.price}\n- Billing: Automatic monthly\n\nWhat You Get:\n${plan.features.map(f => `• ${f}`).join('\n')}\n\nYour dedicated account manager will contact you within 24 hours to get started.\n\nQuestions? Reply to this email or contact support@localrank.ai\n\nBest regards,\nLocalRank.ai Team`
        });
      } catch (emailError) {
        console.warn('Email sending delayed:', emailError);
      }

      toast.success('Subscription activated! Redirecting to dashboard...');

      // Simulate processing then redirect
      setTimeout(() => {
        navigate(createPageUrl('ThankYou'));
      }, 2000);

    } catch (error) {
      console.error('Upsell error:', error);
      const errorMsg = error.message || 'Subscription setup failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    base44.analytics.track({ eventName: 'upsell2_declined' });
    navigate(createPageUrl('ThankYou'));
  };

  return (
    <>
      <MobileOptimizations />
      <MobileViewportFix />
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Background - P1 FIX: Prevent horizontal scroll */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 right-0 w-[min(600px,90vw)] h-[min(600px,90vw)] bg-[#c8ff00]/10 rounded-full blur-[80px] md:blur-[150px]" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl mx-auto w-full">
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
              No thanks, I'll do it myself
              <X className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-6"
            >
              <Zap className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-sm text-[#c8ff00] font-medium">Special One-Time Offer</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            >
              What If We <span className="text-[#c8ff00]">Maintained Your #1 Ranking</span> For You... Forever?
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-xl max-w-2xl mx-auto mb-2"
            >
              Let our team dominate your local market on autopilot while you cash the checks
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-gray-600 text-sm max-w-xl mx-auto"
            >
              🏆 Our clients average <span className="text-[#c8ff00] font-semibold">247% more profile views</span> and <span className="text-[#c8ff00] font-semibold">3.2x higher rankings</span> in just 90 days
            </motion.p>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {Object.entries(plans).map(([key, plan], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => {
                  base44.analytics.track({ 
                    eventName: 'upsell_plan_selected', 
                    properties: { plan: key, price: plan.price } 
                  });
                  setSelectedPlan(key);
                }}
                className={`relative cursor-pointer border-2 rounded-3xl p-8 transition-all min-h-[380px] touch-manipulation ${
                  selectedPlan === key
                    ? 'border-[#c8ff00] bg-[#c8ff00]/5 scale-105'
                    : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#c8ff00] to-[#9aff00] text-black text-xs font-bold px-4 py-1.5 rounded-full">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Radio Button */}
                <div className="absolute top-6 right-6">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === key ? 'border-[#c8ff00] bg-[#c8ff00]' : 'border-gray-600'
                  }`}>
                    {selectedPlan === key && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold text-[#c8ff00]">${plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedPlan === key ? 'bg-[#c8ff00]/20' : 'bg-gray-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          selectedPlan === key ? 'bg-[#c8ff00]' : 'bg-gray-600'
                        }`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: TrendingUp, label: 'Avg. Ranking Increase', value: '3.2x' },
              { icon: Users, label: 'Profile Views', value: '+247%' },
              { icon: MessageSquare, label: 'Review Growth', value: '+18/mo' },
              { icon: Calendar, label: 'Time Saved', value: '12hrs/mo' }
            ].map((stat, i) => (
              <div key={i} className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-4 text-center">
                <stat.icon className="w-6 h-6 text-[#c8ff00] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Button
              onClick={handleAccept}
              disabled={isProcessing || !leadData}
              className="bg-gradient-to-r from-[#c8ff00] to-green-400 hover:from-[#d4ff33] hover:to-green-300 text-black font-bold px-12 py-7 text-xl rounded-full transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,255,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 min-h-[56px] touch-manipulation"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Subscription...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Yes! Add {plans[selectedPlan].name}
                  <ArrowRight className="w-6 h-6" />
                </span>
              )}
            </Button>

            <p className="text-gray-500 text-sm mt-4">
              Cancel anytime • First month satisfaction guaranteed
            </p>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

export default function UpsellPage() {
  return (
    <ABTestProvider>
      <UpsellContent />
    </ABTestProvider>
  );
}