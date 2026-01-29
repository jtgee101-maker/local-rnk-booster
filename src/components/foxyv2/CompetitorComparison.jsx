import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, Crown } from 'lucide-react';

export default function CompetitorComparison({ competitorData, businessName }) {
  if (!competitorData || !competitorData.competitors) return null;

  const { yourBusiness, competitors } = competitorData;

  const getComparisonIcon = (yours, theirs) => {
    if (yours > theirs) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (yours < theirs) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  };

  const metrics = [
    { key: 'rating', label: 'Rating', format: (v) => typeof v === 'number' ? v.toFixed(1) : 'N/A' },
    { key: 'reviewCount', label: 'Reviews', format: (v) => v || 0 },
    { key: 'photoCount', label: 'Photos', format: (v) => v || 0 },
    { key: 'postFrequency', label: 'Posts/Mo', format: (v) => v || 0 },
    { key: 'responseRate', label: 'Response', format: (v) => `${v || 0}%` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-indigo-900/20 via-gray-900 to-gray-900 border-2 border-indigo-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Crown className="w-7 h-7 text-yellow-400" />
              Competitive Battle Card
            </CardTitle>
            <Badge className="bg-indigo-500 text-white px-4 py-2">
              Market Position
            </Badge>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            🦊 How you stack up against your top 3 local competitors
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-300 font-bold py-3 px-2">Metric</th>
                  <th className="text-center text-[#c8ff00] font-bold py-3 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-4 h-4" />
                      You
                    </div>
                  </th>
                  {competitors.slice(0, 3).map((comp, idx) => (
                    <th key={idx} className="text-center text-gray-400 font-medium py-3 px-2">
                      {comp.name || `Competitor ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <motion.tr
                    key={metric.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="text-gray-200 font-medium py-4 px-2">{metric.label}</td>
                    <td className="text-center py-4 px-2">
                      <div className="text-[#c8ff00] font-black text-lg">
                        {metric.format(yourBusiness[metric.key])}
                      </div>
                    </td>
                    {competitors.slice(0, 3).map((comp, compIdx) => (
                      <td key={compIdx} className="text-center py-4 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-300 font-semibold">
                            {metric.format(comp[metric.key])}
                          </span>
                          {getComparisonIcon(yourBusiness[metric.key], comp[metric.key])}
                        </div>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Competitive Advantages */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Your Advantages
              </h4>
              <ul className="space-y-2">
                {yourBusiness.advantages?.map((adv, idx) => (
                  <li key={idx} className="text-gray-200 text-sm flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    {adv}
                  </li>
                )) || (
                  <li className="text-gray-400 text-sm">No clear advantages detected</li>
                )}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Critical Gaps
              </h4>
              <ul className="space-y-2">
                {yourBusiness.gaps?.map((gap, idx) => (
                  <li key={idx} className="text-gray-200 text-sm flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0">✗</span>
                    {gap}
                  </li>
                )) || (
                  <li className="text-gray-400 text-sm">No critical gaps detected</li>
                )}
              </ul>
            </div>
          </div>

          {/* Market Position Alert */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border-2 border-indigo-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Crown className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-black text-lg mb-3">🦊 Foxy's Competitive Intelligence</h4>
                <p className="text-gray-200 text-base leading-relaxed mb-4">
                  You're currently ranked <span className="text-[#c8ff00] font-bold">#{yourBusiness.marketRank || 'N/A'}</span> in 
                  your local market. Competitors are outperforming you in <span className="text-red-400 font-bold">
                  {yourBusiness.gaps?.length || 0} key areas</span>, but you have <span className="text-green-400 font-bold">
                  {yourBusiness.advantages?.length || 0} unique advantages</span> to leverage.
                </p>
                <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg p-4">
                  <div className="text-sm text-[#c8ff00] font-bold mb-2">Strategic Move:</div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Focus on closing the review velocity and visual freshness gaps within 30 days 
                    to jump <span className="text-[#c8ff00] font-bold">2-3 positions</span> in rankings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}