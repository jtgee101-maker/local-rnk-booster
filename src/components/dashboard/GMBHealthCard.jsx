import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react';

export default function GMBHealthCard({ lead, latestSnapshot }) {
  if (!lead) return null;

  const healthScore = lead.health_score || 0;
  const rating = lead.gmb_rating || 0;
  const reviewCount = lead.gmb_reviews_count || 0;

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Needs Work';
  };

  return (
    <Card className="bg-[#1a1a2e] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>GMB Health Score</span>
          <Badge className={`${getHealthColor(healthScore)} bg-gray-800 border-gray-700`}>
            {getHealthLabel(healthScore)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getHealthColor(healthScore)} mb-2`}>
            {healthScore}
          </div>
          <p className="text-gray-400 text-sm">out of 100</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Rating</span>
            </div>
            <p className="text-xl font-bold text-white">{rating.toFixed(1)}</p>
          </div>

          <div className="bg-gray-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Reviews</span>
            </div>
            <p className="text-xl font-bold text-white">{reviewCount}</p>
          </div>
        </div>

        {latestSnapshot && latestSnapshot.improvements.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-xs text-green-400 font-semibold mb-2">Recent Improvements</p>
            <ul className="space-y-1">
              {latestSnapshot.improvements.slice(0, 2).map((imp, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lead.critical_issues && lead.critical_issues.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Critical Issues
            </p>
            <ul className="space-y-1">
              {lead.critical_issues.slice(0, 2).map((issue, i) => (
                <li key={i} className="text-xs text-gray-300">• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}