import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function AIVisibilityReport({ aiData }) {
  if (!aiData) return null;

  const { overallScore, platforms, summary, recommendations } = aiData;

  const platformIcons = {
    Gemini: '💎',
    ChatGPT: '🤖',
    Perplexity: '🔮'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-900 border-2 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FoxyMascot expression="thinking" size="md" />
              <CardTitle className="text-white text-2xl">AI Search Visibility</CardTitle>
            </div>
            <Badge className={`${
              overallScore >= 70 ? 'bg-green-500' : 
              overallScore >= 40 ? 'bg-yellow-500' : 
              'bg-red-500'
            } text-white px-4 py-2 text-lg`}>
              {overallScore}/100
            </Badge>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            🦊 How AI assistants see your business in 2026
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#c8ff00]">{summary.foundIn}/{summary.totalPlatforms}</div>
              <p className="text-gray-400 text-xs mt-1">Platforms</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {summary.averageRank ? `#${summary.averageRank}` : 'N/A'}
              </div>
              <p className="text-gray-400 text-xs mt-1">Avg AI Rank</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{summary.trustScore}%</div>
              <p className="text-gray-400 text-xs mt-1">Trust Score</p>
            </div>
          </div>

          {/* Platform Results */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              AI Platform Breakdown
            </h4>
            {Object.values(platforms).map((platform, idx) => (
              <motion.div
                key={platform.platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`border-2 rounded-xl p-4 ${
                  platform.found
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platformIcons[platform.platform]}</span>
                    <div>
                      <h5 className="text-white font-semibold">{platform.platform}</h5>
                      <p className="text-gray-400 text-xs">
                        {platform.found ? 'Found in results' : 'Not found'}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${
                    platform.score >= 70 ? 'bg-green-500' : 
                    platform.score >= 40 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  } text-white`}>
                    {platform.score}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {platform.rank ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-gray-400">
                      Rank: {platform.rank ? `#${platform.rank}` : 'Not ranked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {platform.contextProvided ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-gray-400">
                      Context: {platform.contextProvided ? 'Rich' : 'Limited'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {platform.mentioned ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-gray-400">
                      Mentioned: {platform.mentioned ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {platform.dataAccuracy || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                AI Optimization Needed
              </h4>
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${
                      rec.priority === 'critical' ? 'bg-red-500' : 
                      rec.priority === 'high' ? 'bg-orange-500' : 
                      'bg-yellow-500'
                    } text-white`}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.impact} impact
                    </Badge>
                  </div>
                  <h5 className="text-white font-medium mb-2">{rec.issue}</h5>
                  <p className="text-gray-400 text-sm">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* AEO Metrics (NEW) */}
          {aiData.entityDensity && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                🧬 Entity Density Check
              </h4>
              <p className="text-gray-400 text-sm mb-3">{aiData.entityDensity.message}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Found on:</span>
                  <span className="text-green-400">{aiData.entityDensity.foundOn?.join(', ') || 'None'}</span>
                </div>
                {aiData.entityDensity.missingFrom?.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Missing from:</span>
                    <span className="text-red-400">{aiData.entityDensity.missingFrom.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
              <Badge className="mt-2" variant={aiData.entityDensity.score >= 80 ? 'default' : 'destructive'}>
                {Math.round(aiData.entityDensity.score)}% Entity Confidence
              </Badge>
            </div>
          )}

          {aiData.answerReadiness && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                💬 Answer-First Extraction
              </h4>
              <p className="text-gray-400 text-sm mb-2">{aiData.answerReadiness.message}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${aiData.answerReadiness.hasQA ? 'text-green-400' : 'text-red-400'}`}>
                  {aiData.answerReadiness.hasQA ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Q&A Section
                </div>
                <div className={`flex items-center gap-1 ${aiData.answerReadiness.hasConciseDesc ? 'text-green-400' : 'text-red-400'}`}>
                  {aiData.answerReadiness.hasConciseDesc ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Concise Descriptions
                </div>
              </div>
            </div>
          )}

          {aiData.expertCitations && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                🏆 Expert Citation Opportunities
              </h4>
              <p className="text-gray-400 text-sm mb-3">{aiData.expertCitations.message}</p>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Found in: {aiData.expertCitations.foundIn?.join(', ') || 'None'}</div>
                {aiData.expertCitations.missingFrom?.length > 0 && (
                  <div className="text-xs text-red-400">Missing: {aiData.expertCitations.missingFrom.join(', ')}</div>
                )}
              </div>
            </div>
          )}

          {/* Foxy AI Insight */}
          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-bold mb-1">🦊 Answer Engine Optimization (AEO)</h4>
                <p className="text-gray-300 text-sm leading-relaxed mb-2">
                  In 2026, AI assistants like ChatGPT and Gemini recommend just <span className="text-[#c8ff00] font-bold">1.2%</span> of 
                  local businesses. You're currently {summary.foundIn > 0 ? 'visible' : 'invisible'} in AI 
                  search results.
                </p>
                <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
                  <div className="text-xs text-gray-400 mb-1">AEO Priority:</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>✓ Entity Density: Strong presence across {aiData.entityDensity?.foundOn?.length || 0} platforms</li>
                    <li>✓ Answer-Ready: {aiData.answerReadiness?.score || 0}% extraction readiness</li>
                    <li>✓ Expert Citations: Found in {aiData.expertCitations?.foundIn?.length || 0} citation sources</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}