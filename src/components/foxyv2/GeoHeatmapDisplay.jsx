import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function GeoHeatmapDisplay({ heatmapData }) {
  if (!heatmapData) return null;

  const { 
    gridSize = 0, 
    visibilityScore = 0, 
    averageRank = 0, 
    strongZones = 0, 
    weakZones = 0, 
    recommendations = [],
    proximityLeaks,
    competitorGaps,
    engagementAnalysis
  } = heatmapData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FoxyMascot expression="detective" size="md" />
              <CardTitle className="text-white text-2xl">Neighborhood Visibility Map</CardTitle>
            </div>
            <Badge className={`${
              visibilityScore >= 70 ? 'bg-green-500' : 
              visibilityScore >= 40 ? 'bg-yellow-500' : 
              'bg-red-500'
            } text-white px-4 py-2`}>
              {visibilityScore}% Visible
            </Badge>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            🦊 Foxy checked {gridSize} locations across your service area
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl p-5 text-center">
              <div className="text-5xl font-black text-green-400 mb-2">{strongZones}</div>
              <p className="text-gray-200 text-sm font-bold">Strong Zones</p>
              <p className="text-gray-400 text-xs mt-1">Rank 1-3</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-2 border-yellow-500/40 rounded-xl p-5 text-center">
              <div className="text-5xl font-black text-yellow-400 mb-2">
                {gridSize - strongZones - weakZones}
              </div>
              <p className="text-gray-200 text-sm font-bold">At Risk</p>
              <p className="text-gray-400 text-xs mt-1">Rank 4-10</p>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500/40 rounded-xl p-5 text-center">
              <div className="text-5xl font-black text-red-400 mb-2">{weakZones}</div>
              <p className="text-gray-200 text-sm font-bold">Weak Zones</p>
              <p className="text-gray-400 text-xs mt-1">Rank 11+</p>
            </div>
          </div>

          {/* Average Rank */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700/50 rounded-xl p-6 text-center">
            <div className="text-gray-200 font-medium mb-3">Average Ranking Position</div>
            <div className="text-6xl font-black text-white mb-3">
              #{averageRank}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Across all tested locations in your service area
            </p>
          </div>

          {/* Weak Zone Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                Geographic Leaks Found
              </h4>
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gradient-to-r from-orange-500/20 to-orange-500/5 border-2 border-orange-500/40 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${
                      rec.priority === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                    } text-white text-sm px-3 py-1.5 font-bold`}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    {rec.weakZoneCount && (
                      <span className="text-red-400 text-sm font-bold">
                        📍 {rec.weakZoneCount} locations affected
                      </span>
                    )}
                  </div>
                  <h5 className="text-white font-bold text-base mb-2">{rec.issue}</h5>
                  <p className="text-gray-200 text-sm leading-relaxed">{rec.suggestion}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Proximity Leaks & Competitor Analysis */}
          {proximityLeaks && proximityLeaks.length > 0 && (
            <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                🚨 Proximity Leaks Detected
              </h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">
                You're ranking poorly within 1 mile of your location—competitors have better prominence signals
              </p>
              <div className="space-y-2">
                {proximityLeaks.slice(0, 3).map((leak, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between border border-red-500/30">
                    <span className="text-gray-200 font-medium">📍 {leak.distance} miles away</span>
                    <Badge className="bg-red-500 text-white font-bold">Rank #{leak.rank}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {competitorGaps && (
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-2 border-blue-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3">🎯 Competitor Service Gaps</h4>
              <p className="text-gray-200 text-sm mb-3 leading-relaxed">
                Competitors are listing {competitorGaps.totalServices} service types
              </p>
              {competitorGaps.serviceGaps && (
                <div className="flex flex-wrap gap-2">
                  {competitorGaps.serviceGaps.map((service, idx) => (
                    <Badge key={idx} className="bg-blue-500/20 border border-blue-500/40 text-blue-200 text-sm">
                      {service}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {engagementAnalysis && (
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-2 border-yellow-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3">💬 Engagement Signal Analysis</h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">
                {engagementAnalysis.message}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/70 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-green-400 font-black text-3xl mb-1">{engagementAnalysis.highEngagementZones}</div>
                  <div className="text-gray-300 text-sm font-medium">High Activity</div>
                </div>
                <div className="bg-gray-900/70 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-blue-400 font-black text-3xl mb-1">{engagementAnalysis.lowEngagementZones}</div>
                  <div className="text-gray-300 text-sm font-medium">Opportunity</div>
                </div>
              </div>
            </div>
          )}

          {/* Foxy Insight */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/10 border-2 border-purple-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-black text-lg mb-3">🦊 The Neighborhood Sniffer</h4>
                <p className="text-gray-200 text-base leading-relaxed">
                  Your business ranks well near your physical location, but visibility drops 
                  significantly in <span className="text-red-400 font-bold">{weakZones} neighboring areas</span>. 
                  Even with a hidden address, Google bases your rank on your physical verification point. 
                  Foxy identified specific blocks where the <span className="text-[#c8ff00] font-bold">proximity hard-cap</span> is 
                  hurting you the most.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}