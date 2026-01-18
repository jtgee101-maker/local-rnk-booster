import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Shield, Clock, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

import OrderBump from '@/components/checkout/OrderBump';
import PricingSummary from '@/components/checkout/PricingSummary';

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

    const orderData = {
      email: formData.email,
      base_offer: {
        product: 'GMB Optimization & Audit',
        price: 99
      },
      order_bumps: orderBumpSelected ? [{
        product: '5 Geo-Tagged Photos',
        price: 49,
        selected: true
      }] : [],
      total_amount: 99 + (orderBumpSelected ? 49 : 0) - (orderBumpSelected ? 10 : 0),
      status: 'checkout'
    };

    try {
      await base44.entities.Order.create(orderData);
      
      // Navigate to first upsell
      navigate(createPageUrl('Upsell1'));
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" />
      
      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
            >
              <Clock className="w-4 h-4 text-[#c8ff00]" />
              <span className="text-sm text-[#c8ff00] font-medium">Limited Time Offer</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Claim Your GMB Optimization Package
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg"
            >
              Get your business ranking in the Map Pack within 30 days
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form & Order Bump */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Your Information</h2>
                
                <form onSubmit={handleCheckout} className="space-y-5">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
                    <Input
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="bg-gray-900/50 border-gray-700 text-white py-6"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Email Address</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-gray-900/50 border-gray-700 text-white py-6"
                      placeholder="john@business.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Phone Number</label>
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-gray-900/50 border-gray-700 text-white py-6"
                      placeholder="(555) 123-4567"
                    />
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

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-6 justify-center pt-4"
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-5 h-5 text-[#c8ff00]" />
                  <span className="text-sm">30-Day Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Award className="w-5 h-5 text-[#c8ff00]" />
                  <span className="text-sm">2,400+ Businesses</span>
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
                className="w-full bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold py-7 text-lg rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(200,255,0,0.3)]"
              >
                {isProcessing ? 'Processing...' : 'Complete Order'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              {/* What's Included */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-2xl p-6"
              >
                <h3 className="font-semibold text-white mb-4">What's Included:</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    Complete GMB profile optimization
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    Keyword research & implementation
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    Category & attribute optimization
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    Custom audit report & action plan
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    30-day implementation support
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}