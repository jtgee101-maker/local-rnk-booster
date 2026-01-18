import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PricingSummary({ basePrice, orderBumpPrice, includeOrderBump }) {
  const subtotal = basePrice + (includeOrderBump ? orderBumpPrice : 0);
  const savings = includeOrderBump ? Math.round(orderBumpPrice * 0.2) : 0;
  const total = subtotal - savings;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6"
    >
      <h3 className="font-semibold text-white text-lg mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-4 pb-4 border-b border-gray-800">
        <div className="flex justify-between text-gray-300">
          <span>GMB Optimization & Audit</span>
          <span>${basePrice}</span>
        </div>
        
        {includeOrderBump && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-between text-gray-300"
          >
            <span>5 Geo-Tagged Photos</span>
            <span>${orderBumpPrice}</span>
          </motion.div>
        )}
      </div>

      {includeOrderBump && savings > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-4 p-3 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c8ff00]" />
            <span className="text-[#c8ff00] font-medium text-sm">Bundle Discount</span>
          </div>
          <span className="text-[#c8ff00] font-semibold">-${savings}</span>
        </motion.div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-800">
        <span className="text-white font-semibold text-xl">Total Today</span>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#c8ff00]">${total}</div>
          {subtotal !== total && (
            <div className="text-xs text-gray-500 line-through">${subtotal}</div>
          )}
        </div>
      </div>

      <p className="text-gray-500 text-xs text-center mt-4">
        🔒 Secure payment • 30-day money-back guarantee
      </p>
    </motion.div>
  );
}