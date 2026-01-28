import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function RevenueLeakCalculator({ revenueData }) {
  if (!revenueData) return null;

  const monthlyLoss = revenueData.monthlyOpportunity || 0;
  const annualLoss = revenueData.annualOpportunity || 0;
  const currentRank = revenueData.currentRank || 9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-red-900/20 via-gray-900 to-gray-900 border-2 border-red-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FoxyMascot expression="alert" size="md" />
              <CardTitle className="text-white text-2xl">Revenue You're Missing</CardTitle>
            </div>
            <Badge className="bg-red-500 text-white animate-pulse px-4 py-2">
              URGENT
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Loss Display */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center"
            >
              <DollarSign className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <div className="text-5xl font-black text-red-400 mb-1">
                ${monthlyLoss.toLocaleString()}
              </div>
              <p className="text-gray-400 text-sm">Lost per Month</p>
              <p className="text-gray-500 text-xs mt-2">
                Based on {revenueData.monthlySearchVolume?.toLocaleString()} monthly searches
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-6 text-center"
            >
              <TrendingUp className="w-10 h-10 text-orange-400 mx-auto mb-2" />
              <div className="text-5xl font-black text-orange-400 mb-1">
                ${annualLoss.toLocaleString()}
              </div>
              <p className="text-gray-400 text-sm">Lost per Year</p>
              <p className="text-gray-500 text-xs mt-2">
                Compounds over time as competitors strengthen
              </p>
            </motion.div>
          </div>

          {/* Current vs Target */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#c8ff00]" />
              The Invisibility Gap
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-xs mb-1">Current Rank</div>
                <div className="text-3xl font-bold text-red-400">#{currentRank}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {revenueData.currentCTR}% CTR
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-[#c8ff00] text-2xl">→</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Target Rank</div>
                <div className="text-3xl font-bold text-green-400">#1</div>
                <div className="text-gray-500 text-xs mt-1">
                  {revenueData.targetCTR}% CTR
                </div>
              </div>
            </div>
          </div>

          {/* Rank Improvement Breakdown */}
          {revenueData.rankBreakdown && revenueData.rankBreakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-semibold text-sm">Revenue by Rank Improvement</h4>
              {revenueData.rankBreakdown.slice(0, 5).map((rank) => (
                <div
                  key={rank.rank}
                  className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">Rank #{rank.rank}</Badge>
                    <span className="text-gray-400 text-sm">{rank.ctr}% CTR</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#c8ff00] font-bold">
                      +${rank.monthlyRevenue.toLocaleString()}/mo
                    </div>
                    <div className="text-gray-500 text-xs">
                      ${rank.annualRevenue.toLocaleString()}/yr
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Foxy Alert */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-[#c8ff00] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-bold mb-1">🦊 Foxy's Analysis</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Every hour you stay at rank #{currentRank}, you're losing approximately{' '}
                  <span className="text-[#c8ff00] font-bold">
                    ${Math.round(monthlyLoss / 30 / 24)}
                  </span>{' '}
                  to competitors. In 2026, AI is 30x more selective—if you're not in the top 3, 
                  you're invisible to ChatGPT, Gemini, and voice search.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}