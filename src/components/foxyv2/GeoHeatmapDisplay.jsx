import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function GeoHeatmapDisplay({ heatmapData }) {
  if (!heatmapData) return null;

  const { gridSize, visibilityScore, averageRank, strongZones, weakZones, recommendations } = heatmapData;

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
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{strongZones}</div>
              <p className="text-gray-400 text-xs mt-1">Strong Zones</p>
              <p className="text-gray-500 text-xs">Rank 1-3</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {gridSize - strongZones - weakZones}
              </div>
              <p className="text-gray-400 text-xs mt-1">At Risk</p>
              <p className="text-gray-500 text-xs">Rank 4-10</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{weakZones}</div>
              <p className="text-gray-400 text-xs mt-1">Weak Zones</p>
              <p className="text-gray-500 text-xs">Rank 11+</p>
            </div>
          </div>

          {/* Average Rank */}
          <div className="bg-gray-900/50 rounded-xl p-4 text-center">
            <div className="text-gray-400 text-sm mb-1">Average Ranking Position</div>
            <div className="text-4xl font-black text-white">
              #{averageRank}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Across all tested locations in your service area
            </p>
          </div>

          {/* Weak Zone Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Geographic Leaks Found
              </h4>
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
                >
                  <Badge className={`${
                    rec.priority === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  } text-white mb-2`}>
                    {rec.priority.toUpperCase()}
                  </Badge>
                  <h5 className="text-white font-medium mb-2">{rec.issue}</h5>
                  <p className="text-gray-400 text-sm">{rec.suggestion}</p>
                  {rec.weakZoneCount && (
                    <p className="text-red-400 text-xs mt-2">
                      📍 Affecting {rec.weakZoneCount} locations
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Proximity Leaks & Competitor Analysis */}
          {heatmapData.proximityLeaks && heatmapData.proximityLeaks.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                🚨 Proximity Leaks Detected
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                You're ranking poorly within 1 mile of your location—competitors have better prominence signals
              </p>
              <div className="space-y-1">
                {heatmapData.proximityLeaks.slice(0, 3).map((leak, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">📍 {leak.distance} miles away</span>
                    <Badge variant="destructive">Rank #{leak.rank}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {heatmapData.competitorGaps && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2">🎯 Competitor Service Gaps</h4>
              <p className="text-gray-400 text-sm mb-2">
                Competitors are listing {heatmapData.competitorGaps.totalServices} service types
              </p>
              {heatmapData.competitorGaps.serviceGaps && (
                <div className="flex flex-wrap gap-1">
                  {heatmapData.competitorGaps.serviceGaps.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {heatmapData.engagementAnalysis && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2">💬 Engagement Signal Analysis</h4>
              <p className="text-gray-400 text-sm">
                {heatmapData.engagementAnalysis.message}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-green-400 font-bold">{heatmapData.engagementAnalysis.highEngagementZones}</div>
                  <div className="text-gray-500 text-xs">High Activity</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-blue-400 font-bold">{heatmapData.engagementAnalysis.lowEngagementZones}</div>
                  <div className="text-gray-500 text-xs">Opportunity</div>
                </div>
              </div>
            </div>
          )}

          {/* Foxy Insight */}
          <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-bold mb-1">🦊 The Neighborhood Sniffer</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your business ranks well near your physical location, but visibility drops 
                  significantly in {weakZones} neighboring areas. Even with a hidden address, 
                  Google bases your rank on your physical verification point. Foxy identified 
                  specific blocks where the proximity hard-cap is hurting you.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}