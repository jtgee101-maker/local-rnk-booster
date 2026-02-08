import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function GMBHealthCard({ lead }) {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Healthy';
    if (score >= 50) return 'Needs Work';
    return 'Critical';
  };

  const scorePercentage = (lead.health_score / 100) * 100;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">GMB Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(lead.health_score)}`}>
              {lead.health_score}
              <span className="text-gray-400 text-lg">/100</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">{getScoreLabel(lead.health_score)}</div>
          </div>
          {lead.health_score >= 70 ? (
            <TrendingUp className="w-8 h-8 text-green-500" />
          ) : lead.health_score >= 50 ? (
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-500" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              lead.health_score >= 70 ? 'bg-green-500' :
              lead.health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>

        {/* GMB Stats */}
        {lead.gmb_rating !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rating</span>
              <span className="font-semibold text-gray-900">{lead.gmb_rating.toFixed(1)} ★</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reviews</span>
              <span className="font-semibold text-gray-900">{lead.gmb_reviews_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Photos</span>
              <span className="font-semibold text-gray-900">{lead.gmb_photos_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hours Set</span>
              <span className={`font-semibold ${lead.gmb_has_hours ? 'text-green-600' : 'text-red-600'}`}>
                {lead.gmb_has_hours ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}