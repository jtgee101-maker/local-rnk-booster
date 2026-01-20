import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Shield, Star, Zap, TrendingUp, MapPin, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';

const plans = [
  {
    id: '1_month',
    duration: '1 Month',
    originalPrice: 4.35,
    dailyPrice: 0.13,
    totalPrice: 3.90,
    discount: 10,
    stripePriceId: 'price_1month'
  },
  {
    id: '3_month',
    duration: '3 Month',
    originalPrice: 12.60,
    dailyPrice: 0.14,
    totalPrice: 12.60,
    discount: 70,
    mostPopular: true,
    stripePriceId: 'price_3month'
  },
  {
    id: '12_month',
    duration: '12 Month',
    originalPrice: 39.60,
    dailyPrice: 0.11,
    totalPrice: 39.60,
    discount: 82,
    bestOffer: true,
    stripePriceId: 'price_12month'
  }
];

const testimonials = [
  {
    text: "This app nailed it! The audit showed me exactly what was killing my rankings. My calls doubled in 3 weeks!",
    author: "Alex Johnson",
    location: "NYC",
    avatar: "👨‍💼"
  },
  {
    text: "I never imagined finding the exact reason I wasn't ranking. Fixed 3 errors in 10 minutes, now I'm in Top 3!",
    author: "Emily Brown",
    location: "LA",
    avatar: "👩‍💼"
  },
  {
    text: "I wanted something unique for my business, and this app gave me a strategy that truly works. It's one-of-a-kind!",
    author: "Sarah Smith",
    location: "Chicago",
    avatar: "🏪"
  },
  {
    text: "The customization options blew me away. It's exactly what I envisioned from the start!",
    author: "Kevin Miller",
    location: "Miami",
    avatar: "🔧"
  }
];

const features = [
  {
    icon: Zap,
    title: "Audit in Minutes",
    description: "Get instant AI analysis of your GMB profile with actionable fixes"
  },
  {
    icon: MapPin,
    title: "Personalize Your Plan",
    description: "Custom local SEO strategy based on your specific business needs"
  },
  {
    icon: TrendingUp,
    title: "Visualize Your Growth",
    description: "See exactly how you'll rank in the Map Pack before you commit"
  }
];

export default function CheckoutV2() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(plans[1].id);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutes in seconds
  const [leadData, setLeadData] = useState(null);

  useEffect(() => {
    const storedLead = sessionStorage.getItem('quizLead');
    if (storedLead) {
      setLeadData(JSON.parse(storedLead));
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsLoading(true);
    base44.analytics.track({ 
      eventName: 'checkout_v2_continue_clicked', 
      properties: { plan_id: plan.id, version: 'V2_BETA' } 
    });

    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        planData: {
          product: `LocalRank ${plan.duration} Plan`,
          price: plan.totalPrice
        },
        orderBumpAccepted: false,
        leadData: {
          id: leadData?.id,
          business_name: leadData?.business_name,
          email: leadData?.email
        },
        checkoutVersion: 'V2_BETA'
      });

      // Send upsell email to customer
      if (leadData?.email) {
        base44.functions.invoke('sendUpsellEmail', {
          email: leadData.email,
          businessName: leadData.business_name,
          selectedPlan: plan.duration,
          amount: plan.totalPrice
        }).catch(err => {
          console.error('Failed to send upsell email:', err);
        });
      }

      // Send admin notification
      if (leadData?.email) {
        base44.functions.invoke('sendAdminUpsellNotification', {
          orderData: {
            email: leadData.email,
            lead_id: leadData.id,
            base_offer: {
              product: `LocalRank ${plan.duration} Plan`,
              price: plan.totalPrice
            },
            total_amount: plan.totalPrice
          }
        }).catch(err => {
          console.error('Failed to send admin notification:', err);
        });
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      if (errorMsg.includes('Stripe not configured')) {
        alert('Payment system is being configured. Please contact support or try again in a few minutes.');
      } else {
        alert('Payment setup failed: ' + errorMsg);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Countdown Timer - P0 FIX: Prevent overflow capture on mobile */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm touch-none">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="text-sm flex-shrink min-w-0">
            <span className="text-gray-600 text-xs sm:text-sm">Up to 82% discount reserved for:</span>
            <div className="font-bold text-base sm:text-lg">{formatTime(timeLeft)}</div>
          </div>
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-2 rounded-lg min-h-[44px] flex-shrink-0"
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold">LocalRank.ai</div>
        </div>

        {/* Discount Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 mb-8 text-white text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Get your personal plan with</span>
          </div>
          <div className="text-2xl font-bold">70%-82% discount</div>
        </motion.div>

        {/* Choose Plan */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Choose your plan</h2>
          
          <div className="space-y-3">
            {plans.map((plan) => (
              <motion.button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full border-2 rounded-2xl p-4 text-left transition-all relative min-h-[88px] touch-manipulation ${
                  selectedPlan === plan.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.mostPopular && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                    selectedPlan === plan.id ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    MOST POPULAR
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id ? 'border-white' : 'border-gray-400'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-semibold text-lg">{plan.duration}</span>
                  </div>
                  
                  <div className="text-right">
                    {plan.discount > 0 && (
                      <div className={`text-xs font-semibold mb-1 ${
                        selectedPlan === plan.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        SAVE {plan.discount}%
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm line-through ${
                        selectedPlan === plan.id ? 'text-gray-300' : 'text-red-500'
                      }`}>
                        ${plan.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-3xl font-bold">${Math.floor(plan.dailyPrice)}</span>
                      <span className="text-2xl font-bold">{(plan.dailyPrice % 1).toFixed(2).slice(1)}</span>
                    </div>
                    <div className={`text-xs ${
                      selectedPlan === plan.id ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      per day
                    </div>
                  </div>
                </div>

                {plan.bestOffer && (
                  <div className="absolute -top-3 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    BEST OFFER
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Continue Button - P0 FIX: iOS safe tap target */}
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-900 active:bg-gray-800 text-white py-6 text-lg font-semibold rounded-xl mb-3 min-h-[56px] touch-manipulation"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>

        {/* Payment Security */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Pay safe & secure</span>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-2xl">💳</span>
            <span className="text-xs text-gray-500">Visa • Mastercard • Discover • PayPal • Amex</span>
          </div>
        </div>

        {/* Value Propositions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-center mb-6">
            Get Your Perfect<br />GMB Audit in Minutes
          </h3>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social Proof Badge */}
        <div className="text-center mb-8 py-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="text-2xl">🏆</div>
            <div className="text-2xl">🏆</div>
          </div>
          <div className="text-2xl font-bold mb-1">+7 million</div>
          <div className="text-gray-600 text-sm">businesses have started improving<br />their local rankings with us.</div>
        </div>

        {/* App Store Ratings */}
        <div className="bg-gray-50 rounded-2xl p-6 text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <div className="text-3xl font-bold mb-1">4.9 <span className="text-gray-500 text-lg">out of 5</span></div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🍎</div>
              <div className="text-xs text-gray-600">App Store</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs text-gray-600">Google Play</div>
            </div>
          </div>
        </div>

        {/* Trusted By */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-2xl">🏆</div>
            <div className="text-2xl">🏆</div>
          </div>
          <div className="font-bold">Trusted by</div>
          <div className="text-lg font-bold">70 Million+ Users</div>
        </div>

        {/* Customer Reviews */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-center mb-6">Customer reviews</h3>
          
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-3">{testimonial.text}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span>{testimonial.avatar}</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Community */}
        <div className="text-center py-8 mb-8 bg-gray-50 rounded-2xl">
          <div className="text-sm text-gray-600 mb-2">Become a member of our global community of</div>
          <div className="text-2xl font-bold">7 million businesses</div>
        </div>

        {/* Final CTA */}
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-900 text-white py-6 text-lg font-semibold rounded-xl mb-4"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>

        <div className="flex items-center justify-center gap-2 text-green-600 mb-8">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Pay safe & secure</span>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}