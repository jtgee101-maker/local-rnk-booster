import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function RevenueLeakCalculator({ revenueData }) {
  if (!revenueData) return null;

  const monthlyOpportunity = revenueData.monthlyOpportunity || 0;
  const annualOpportunity = revenueData.annualOpportunity || 0;
  const currentRank = revenueData.currentRank || 10;
  const targetRank = revenueData.targetRank || 1;
  const currentCTR = revenueData.currentCTR || '0';
  const targetCTR = revenueData.targetCTR || '0';
  const rankBreakdown = revenueData.rankBreakdown || [];

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
              <p className="text-gray-200 font-medium text-base">Lost per Month</p>
              <p className="text-gray-400 text-sm mt-2">
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
              <p className="text-gray-200 font-medium text-base">Lost per Year</p>
              <p className="text-gray-400 text-sm mt-2">
                Compounds over time as competitors strengthen
              </p>
            </motion.div>
          </div>

          {/* Current vs Target */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700/50 rounded-xl p-6">
            <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-[#c8ff00]" />
              The Visibility Gap
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center items-center">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="text-gray-300 text-xs font-medium mb-2">Where You Are</div>
                <div className="text-5xl font-black text-red-400 mb-2">#{currentRank}</div>
                <div className="text-gray-400 text-sm font-medium">
                  {revenueData.currentCTR}% CTR
                </div>
                <div className="text-red-400 text-xs mt-2">🚫 Invisible to customers</div>
              </div>
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[#c8ff00] text-4xl font-black"
                >
                  →
                </motion.div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="text-gray-300 text-xs font-medium mb-2">Where You Should Be</div>
                <div className="text-5xl font-black text-green-400 mb-2">#1</div>
                <div className="text-gray-400 text-sm font-medium">
                  {revenueData.targetCTR}% CTR
                </div>
                <div className="text-green-400 text-xs mt-2">✅ Maximum visibility</div>
              </div>
            </div>
          </div>

          {/* Rank Improvement Breakdown */}
          {revenueData.rankBreakdown && revenueData.rankBreakdown.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                📈 Revenue Growth Potential
              </h4>
              {revenueData.rankBreakdown.slice(0, 5).map((rank, idx) => (
                <motion.div
                  key={rank.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gradient-to-r from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-[#c8ff00]/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-[#c8ff00]/20 to-green-500/20 border border-[#c8ff00]/30 rounded-lg px-3 py-2">
                        <div className="text-[#c8ff00] font-black text-xl">#{rank.rank}</div>
                      </div>
                      <div>
                        <div className="text-gray-200 font-medium text-sm">Move to Rank #{rank.rank}</div>
                        <div className="text-gray-400 text-xs">{rank.ctr}% click-through rate</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#c8ff00] font-black text-xl">
                        +${rank.monthlyRevenue.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ${rank.annualRevenue.toLocaleString()}/year
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Loss Breakdown (NEW) */}
          {revenueData.lossBreakdown && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700/50 rounded-xl p-6 space-y-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                📊 Where Your Revenue is Bleeding
              </h4>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-300 font-semibold text-sm mb-1">Ranking Position Loss</div>
                      <div className="text-gray-400 text-xs">Not appearing in top 3 map pack results</div>
                    </div>
                    <div className="text-red-400 font-black text-2xl">
                      ${revenueData.lossBreakdown.rankingLoss.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-orange-300 font-semibold text-sm mb-1">AI Visibility Loss</div>
                      <div className="text-gray-400 text-xs">Missing from ChatGPT, Gemini recommendations</div>
                    </div>
                    <div className="text-orange-400 font-black text-2xl">
                      ${revenueData.lossBreakdown.aiVisibilityLoss.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-300 leading-relaxed">
                    ⚠️ <span className="text-[#c8ff00] font-bold">{revenueData.lossBreakdown.aiOverviewRate}</span> of searches 
                    now show AI Overviews that capture clicks <span className="text-red-400 font-bold">before</span> organic results ever appear
                  </div>
                </div>
              </div>
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
                <h4 className="text-white font-bold mb-1">🦊 Foxy's Unified Economic Loss Model</h4>
                <p className="text-gray-300 text-sm leading-relaxed mb-2">
                  {revenueData.foxyInsight || `Every hour you stay at rank #${currentRank}, you're losing approximately $${Math.round(monthlyLoss / 30 / 24)} to competitors.`}
                </p>
                <div className="bg-gray-900/50 rounded-lg p-3 mt-3">
                  <div className="text-gray-400 text-xs mb-1">Hourly Revenue Leak:</div>
                  <div className="text-[#c8ff00] text-2xl font-bold">
                    ${Math.round(monthlyLoss / 30 / 24)}/hour
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    That's ${Math.round(monthlyLoss / 30)}/day • ${monthlyLoss.toLocaleString()}/month
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}