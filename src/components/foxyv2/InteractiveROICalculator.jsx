import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';

export default function InteractiveROICalculator({ revenueData }) {
  const [investmentLevel, setInvestmentLevel] = useState(497);
  const [timeframe, setTimeframe] = useState(12);

  const calculateROI = () => {
    const baseRevenue = revenueData?.monthlyOpportunity || 10000;
    const captureRate = investmentLevel >= 997 ? 0.8 : investmentLevel >= 497 ? 0.5 : 0.3;
    
    const monthlyGain = baseRevenue * captureRate;
    const totalGain = monthlyGain * timeframe;
    const totalInvestment = investmentLevel * timeframe;
    const netProfit = totalGain - totalInvestment;
    const roi = ((netProfit / totalInvestment) * 100).toFixed(0);

    return {
      monthlyGain: Math.round(monthlyGain),
      totalGain: Math.round(totalGain),
      totalInvestment,
      netProfit: Math.round(netProfit),
      roi,
      breakEvenMonths: Math.ceil(investmentLevel / monthlyGain),
    };
  };

  const results = calculateROI();

  const investmentOptions = [
    { value: 297, label: 'DIY Tier', features: ['Audit Reports', 'Monthly Guidance', 'Email Support'] },
    { value: 497, label: 'Foxy Managed', features: ['Full Service', 'Weekly Posts', 'Citation Building', 'Review Management'] },
    { value: 997, label: 'Market Domination', features: ['Everything', 'AI Optimization', 'Content Creation', 'Priority Support', 'Guaranteed Results'] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-green-900/20 via-gray-900 to-gray-900 border-2 border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Calculator className="w-7 h-7 text-green-400" />
              ROI Calculator
            </CardTitle>
            <Badge className="bg-green-500 text-white px-4 py-2 font-bold">
              Live Projections
            </Badge>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            🦊 See your exact return based on your investment level
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Investment Level Selector */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base">Choose Your Investment Level</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {investmentOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => setInvestmentLevel(option.value)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    investmentLevel === option.value
                      ? 'bg-gradient-to-br from-[#c8ff00]/20 to-green-500/10 border-[#c8ff00] shadow-lg'
                      : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-2xl font-black text-white mb-1">
                      ${option.value}
                    </div>
                    <div className={`text-sm font-bold ${
                      investmentLevel === option.value ? 'text-[#c8ff00]' : 'text-gray-400'
                    }`}>
                      {option.label}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Timeframe Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-base">Projection Timeline</h4>
              <Badge className="bg-blue-500 text-white font-bold">
                {timeframe} months
              </Badge>
            </div>
            <Slider
              value={[timeframe]}
              onValueChange={(value) => setTimeframe(value[0])}
              min={3}
              max={24}
              step={3}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>3 mo</span>
              <span>12 mo</span>
              <span>24 mo</span>
            </div>
          </div>

          {/* Results Display */}
          <motion.div
            key={`${investmentLevel}-${timeframe}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl p-6 text-center">
              <DollarSign className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <div className="text-5xl font-black text-green-400 mb-2">
                ${results.netProfit.toLocaleString()}
              </div>
              <p className="text-gray-200 font-medium">Net Profit</p>
              <p className="text-gray-400 text-xs mt-1">Over {timeframe} months</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-2 border-blue-500/40 rounded-xl p-6 text-center">
              <TrendingUp className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <div className="text-5xl font-black text-blue-400 mb-2">
                {results.roi}%
              </div>
              <p className="text-gray-200 font-medium">ROI</p>
              <p className="text-gray-400 text-xs mt-1">Return on investment</p>
            </div>
          </motion.div>

          {/* Breakdown */}
          <div className="bg-gray-900/50 rounded-xl p-5 space-y-3">
            <h4 className="text-white font-bold text-base mb-3">Financial Breakdown</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Monthly Revenue Gain:</span>
                <span className="text-[#c8ff00] font-bold">${results.monthlyGain.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Revenue Gain:</span>
                <span className="text-green-400 font-bold">${results.totalGain.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Investment:</span>
                <span className="text-orange-400 font-bold">${results.totalInvestment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Break-Even:</span>
                <span className="text-blue-400 font-bold">{results.breakEvenMonths} months</span>
              </div>
            </div>
          </div>

          {/* Foxy Guarantee */}
          <div className="bg-gradient-to-r from-[#c8ff00]/20 to-green-500/10 border-2 border-[#c8ff00]/40 rounded-xl p-6">
            <h4 className="text-white font-black text-lg mb-3">🦊 Foxy's ROI Guarantee</h4>
            <p className="text-gray-200 text-sm leading-relaxed">
              If you don't see a <span className="text-[#c8ff00] font-bold">minimum 300% ROI</span> within 
              {results.breakEvenMonths * 2} months, we'll work for free until you do. That's how confident 
              Foxy is in plugging your revenue leaks.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}