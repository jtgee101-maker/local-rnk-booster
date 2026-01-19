import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Shield, Clock, Award, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

import OrderBump from '@/components/checkout/OrderBump';
import PricingSummary from '@/components/checkout/PricingSummary';
import CountdownTimer from '@/components/shared/CountdownTimer';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  // Get lead and plan data from session storage
  const [leadData, setLeadData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const storedLead = sessionStorage.getItem('quizLead');
    const storedPlan = sessionStorage.getItem('selectedPlan');
    
    if (storedLead) {
      const lead = JSON.parse(storedLead);
      setLeadData(lead);
      setFormData(prev => ({
        ...prev,
        email: lead.email || '',
        full_name: lead.business_name || ''
      }));
    }
    
    if (storedPlan) {
      setSelectedPlan(JSON.parse(storedPlan));
    }
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const planData = selectedPlan || { product: 'GMB Optimization & Audit', price: 99 };
      const totalAmount = orderBumpSelected ? planData.price + 49 : planData.price;

      base44.analytics.track({ 
        eventName: 'checkout_initiated', 
        properties: { 
          total_amount: totalAmount,
          order_bump_accepted: orderBumpSelected,
          plan_name: planData.product
        } 
      });

      // Create Stripe checkout session
      const response = await base44.functions.invoke('createStripeCheckout', {
        planData,
        orderBumpAccepted: orderBumpSelected,
        leadData
      });

      if (response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      base44.analytics.track({ 
        eventName: 'checkout_error', 
        properties: { error: error.message } 
      });
      
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      if (errorMsg.includes('Stripe not configured')) {
        alert('Payment system is being configured. Please contact support or try again in a few minutes.');
      } else {
        alert('Payment setup failed: ' + errorMsg);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[#c8ff00]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      
      <div className="relative z-10 min-h-screen py-8 md:py-12 px-3 md:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <CountdownTimer minutes={14} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
            >
              <Clock className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-xs font-semibold text-[#c8ff00]">LIMITED TIME OFFER</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              Secure Your <span className="text-[#c8ff00]">Map Pack</span> Ranking
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto"
            >
              Join 7,000+ businesses dominating their local market with AI-powered GMB optimization
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Form & Order Bump */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 md:p-8 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#c8ff00]/10">
                    <Shield className="w-5 h-5 text-[#c8ff00]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
                    <p className="text-xs text-gray-500">256-bit SSL encrypted</p>
                  </div>
                </div>
                
                <form onSubmit={handleCheckout} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name *</label>
                    <Input
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="bg-gray-950/60 border-gray-700/50 text-white py-6 focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20 transition-all"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address *</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-gray-950/60 border-gray-700/50 text-white py-6 focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20 transition-all"
                      placeholder="john@business.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Phone Number *</label>
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-gray-950/60 border-gray-700/50 text-white py-6 focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="pt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Your information is secure and will never be shared</span>
                  </div>
                </form>
              </motion.div>

              {/* Order Bump */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <OrderBump
                  type="photos"
                  selected={orderBumpSelected}
                  onToggle={() => setOrderBumpSelected(!orderBumpSelected)}
                />
              </motion.div>

              {/* Enhanced Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              >
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50 backdrop-blur">
                  <Shield className="w-6 h-6 text-[#c8ff00]" />
                  <span className="text-xs font-medium text-gray-300 text-center">30-Day Money Back</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50 backdrop-blur">
                  <Award className="w-6 h-6 text-[#c8ff00]" />
                  <span className="text-xs font-medium text-gray-300 text-center">7,000+ Clients</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50 backdrop-blur">
                  <Clock className="w-6 h-6 text-[#c8ff00]" />
                  <span className="text-xs font-medium text-gray-300 text-center">Results in 30 Days</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50 backdrop-blur">
                  <Shield className="w-6 h-6 text-[#c8ff00]" />
                  <span className="text-xs font-medium text-gray-300 text-center">SSL Secured</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <PricingSummary
                basePrice={selectedPlan ? parseFloat(selectedPlan.totalPrice) : 99}
                orderBumpPrice={49}
                includeOrderBump={orderBumpSelected}
              />

              {selectedPlan && (
                <div className="mb-4 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                  <div className="text-sm text-gray-400 mb-1">Selected Plan</div>
                  <div className="text-lg font-bold text-white">{selectedPlan.name}</div>
                  <div className="text-sm text-[#c8ff00]">${selectedPlan.dailyPrice}/day</div>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#c8ff00] to-[#d4ff33] hover:from-[#d4ff33] hover:to-[#c8ff00] text-black font-bold py-7 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(200,255,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Secure Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Complete Secure Checkout
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-2 pt-2">
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600">Powered by Stripe • PCI DSS Compliant</span>
              </div>

              {/* What's Included */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-900/60 to-gray-900/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-[#c8ff00]/10">
                    <Award className="w-4 h-4 text-[#c8ff00]" />
                  </div>
                  <h3 className="font-bold text-white">Premium Package Includes:</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Complete GMB Profile Optimization</div>
                      <div className="text-xs text-gray-500">AI-powered profile enhancement</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Local Keyword Research</div>
                      <div className="text-xs text-gray-500">Target high-intent searches</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Category Optimization</div>
                      <div className="text-xs text-gray-500">Maximize search visibility</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Custom Audit Report</div>
                      <div className="text-xs text-gray-500">Detailed action plan</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">30-Day Expert Support</div>
                      <div className="text-xs text-gray-500">Direct access to specialists</div>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-[#c8ff00]" />
                    <span className="text-gray-400">100% Money-Back Guarantee</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}