import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ABTestProvider, useABTest } from '@/components/abtest/ABTestProvider';

import CountdownTimer from '@/components/pricing/CountdownTimer';
import PricingCard from '@/components/pricing/PricingCard';
import FeaturesSection from '@/components/pricing/FeaturesSection';
import TrustSection from '@/components/pricing/TrustSection';
import LiveActivityIndicator from '@/components/cro/LiveActivityIndicator';
import ViewersCounter from '@/components/cro/ViewersCounter';
import StickyConversionBar from '@/components/cro/StickyConversionBar';

const pricingPlans = [
  {
    id: '1_month',
    name: 'The Starter Scan',
    description: 'Perfect for testing the waters',
    dailyPrice: '0.13',
    totalPrice: '3.90',
    originalPrice: '21.67',
    billingPeriod: 'monthly',
    discount: 82,
    features: [
      'Complete GMB Health Blueprint',
      'Competitor Sabotage Report',
      'Keyword Gap Analysis',
      '20-Page Custom Audit PDF',
      'Email Support'
    ]
  },
  {
    id: '3_month',
    name: 'The Dominance Protocol',
    description: 'Most chosen by serious business owners',
    dailyPrice: '0.14',
    totalPrice: '12.60',
    originalPrice: '42.00',
    billingPeriod: 'quarterly',
    discount: 70,
    popular: true,
    features: [
      'Everything in Starter Scan',
      'Monthly Ranking Reports',
      'Review Strategy Playbook',
      'Photo Optimization Guide',
      'Priority Email Support',
      '90-Day Action Plan'
    ]
  },
  {
    id: '12_month',
    name: 'The Annual Fortress',
    description: 'Maximum savings, maximum results',
    dailyPrice: '0.11',
    totalPrice: '40.15',
    originalPrice: '223.08',
    billingPeriod: 'annually',
    discount: 82,
    bestValue: true,
    features: [
      'Everything in Dominance Protocol',
      'Quarterly Strategy Calls',
      'Citation Building Guide',
      'Schema Markup Optimization',
      'Local Link Building Roadmap',
      'Unlimited Audit Updates',
      'VIP Support Channel'
    ]
  }
];

function PricingContent() {
  const navigate = useNavigate();
  const { trackView, trackConversion } = useABTest();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [pageLoadTime] = useState(Date.now());

  useEffect(() => {
    // Track page view
    base44.analytics.track({ eventName: 'pricing_page_viewed' });
    
    const storedLead = sessionStorage.getItem('quizLead');
    if (storedLead) {
      setLeadData(JSON.parse(storedLead));
    } else {
      base44.analytics.track({ eventName: 'pricing_no_lead_data' });
    }
    
    trackView('pricing', 'headline');

    // Track exit/drop-off
    const handleBeforeUnload = () => {
      const timeOnPage = (Date.now() - pageLoadTime) / 1000;
      base44.analytics.track({ 
        eventName: 'pricing_exit', 
        properties: { time_on_page: Math.round(timeOnPage) } 
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pageLoadTime]);

  const handleSelectPlan = (plan) => {
    base44.analytics.track({ 
      eventName: 'pricing_plan_selected', 
      properties: { 
        plan_id: plan.id, 
        plan_name: plan.name,
        price: parseFloat(plan.totalPrice),
        duration: plan.billingPeriod
      } 
    });
    
    setSelectedPlan(plan);
    trackConversion('pricing', 'headline', parseFloat(plan.totalPrice));
    
    sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
    navigate(createPageUrl('Checkout'));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
      {/* Background - P1 FIX: Prevent horizontal scroll */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(1000px,100vw)] h-[1000px] bg-[#c8ff00]/5 rounded-full blur-[150px]" />

      {/* Countdown Timer */}
      <CountdownTimer minutes={15} />

      {/* CRO Elements */}
      <LiveActivityIndicator />
      <StickyConversionBar 
        onCTA={() => {
          const topPlan = pricingPlans.find(p => p.popular) || pricingPlans[0];
          handleSelectPlan(topPlan);
        }}
        price="0.14"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-16 pb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2">
                <span className="text-red-400 font-semibold text-sm animate-pulse">
                  ⚡ LIMITED TIME: 82% OFF
                </span>
              </div>
              <ViewersCounter baseCount={63} />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Unlock Your Business's <span className="text-[#c8ff00]">Hidden Ranking Power</span>
            </h1>
            
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              For less than a cup of coffee, discover why your competitors are stealing 80% of your local leads
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={plan.popular}
                isBestValue={plan.bestValue}
                onSelect={handleSelectPlan}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Features Section */}
        <FeaturesSection />

        {/* Trust Section */}
        <TrustSection />

        {/* Bottom CTA */}
        <div className="py-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Dominate Your Local Market?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join 7+ million businesses who've discovered their ranking power
            </p>
            
            {/* Repeat Plans for Scroll Conversion */}
            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectPlan(plan)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-105 ${
                    plan.popular
                      ? 'border-[#c8ff00] bg-[#c8ff00]/5'
                      : 'border-gray-800 bg-gray-900/50'
                  }`}
                >
                  <div className="text-sm text-gray-400 mb-1">{plan.name}</div>
                  <div className="text-3xl font-bold text-[#c8ff00] mb-1">
                    ${plan.dailyPrice}/day
                  </div>
                  <div className="text-xs text-gray-500">
                    ${plan.totalPrice} {plan.billingPeriod}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer Trust Badges */}
        <div className="border-t border-gray-800 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div>🔒 Secure Payment</div>
            <div>✓ Money-Back Guarantee</div>
            <div>⚡ Instant Access</div>
            <div>🏆 7M+ Audits Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <ABTestProvider>
      <PricingContent />
    </ABTestProvider>
  );
}