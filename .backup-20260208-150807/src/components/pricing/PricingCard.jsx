import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown } from 'lucide-react';

export default function PricingCard({ 
  plan, 
  isPopular, 
  isBestValue,
  onSelect,
  index 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative border-2 rounded-3xl p-6 transition-all ${
        isPopular 
          ? 'border-[#c8ff00] bg-[#c8ff00]/5 shadow-[0_0_40px_rgba(200,255,0,0.2)] scale-105'
          : 'border-gray-800 bg-gray-900/50'
      }`}
    >
      {/* Badge */}
      {(isPopular || isBestValue) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold ${
            isBestValue 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
              : 'bg-[#c8ff00] text-black'
          }`}>
            {isBestValue ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {isBestValue ? 'BEST OFFER' : 'MOST POPULAR'}
          </div>
        </div>
      )}

      {/* Discount Badge */}
      <div className="mb-4">
        <span className="inline-block bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-semibold">
          SAVE {plan.discount}%
        </span>
      </div>

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
      <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-5xl font-bold text-[#c8ff00]">
            ${plan.dailyPrice}
          </span>
          <span className="text-gray-400 text-lg">/ day</span>
        </div>
        <p className="text-gray-500 text-sm">
          ${plan.totalPrice} billed {plan.billingPeriod}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          <span className="line-through">${plan.originalPrice}</span> regular price
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#c8ff00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-[#c8ff00]" strokeWidth={3} />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(plan)}
        className={`w-full py-6 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 min-h-[56px] touch-manipulation ${
          isPopular
            ? 'bg-[#c8ff00] hover:bg-[#d4ff33] text-black hover:shadow-[0_0_40px_rgba(200,255,0,0.4)]'
            : 'bg-gray-800 hover:bg-gray-700 text-white'
        }`}
      >
        {isPopular ? 'Claim Ranking Power' : 'Get Started'}
      </Button>
    </motion.div>
  );
}