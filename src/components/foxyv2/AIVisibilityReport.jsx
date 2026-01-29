import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function AIVisibilityReport({ aiData }) {
  if (!aiData) return null;

  const { 
    overallScore = 0, 
    platforms = {}, 
    summary = { foundIn: 0, totalPlatforms: 6, averageRank: 'N/A', trustScore: 0 },
    recommendations = []
  } = aiData;

  // Convert platforms object to array
  const platformsArray = Object.values(platforms).filter(p => p && p.platform);

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
            <div className="bg-gradient-to-br from-[#c8ff00]/20 to-green-500/10 border border-[#c8ff00]/30 rounded-xl p-4 text-center">
              <div className="text-4xl font-black text-[#c8ff00]">{summary.foundIn}/{summary.totalPlatforms}</div>
              <p className="text-gray-200 text-sm font-medium mt-2">AI Platforms</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
              <div className="text-4xl font-black text-blue-400">
                {summary.averageRank ? `#${summary.averageRank}` : 'N/A'}
              </div>
              <p className="text-gray-200 text-sm font-medium mt-2">Avg AI Rank</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
              <div className="text-4xl font-black text-purple-400">{summary.trustScore}%</div>
              <p className="text-gray-200 text-sm font-medium mt-2">Trust Score</p>
            </div>
          </div>

          {/* Platform Results */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-lg flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              AI Platform Breakdown
            </h4>
            {Object.values(platforms).map((platform, idx) => (
              <motion.div
                key={platform.platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`border-2 rounded-xl p-5 ${
                  platform.found
                    ? 'bg-gradient-to-r from-green-500/20 to-green-500/5 border-green-500/40'
                    : 'bg-gradient-to-r from-red-500/20 to-red-500/5 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{platformIcons[platform.platform]}</div>
                    <div>
                      <h5 className="text-white font-bold text-lg">{platform.platform}</h5>
                      <p className={`text-sm font-medium ${platform.found ? 'text-green-300' : 'text-red-300'}`}>
                        {platform.found ? '✓ Found in results' : '✗ Not found'}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${
                    platform.score >= 70 ? 'bg-green-500' : 
                    platform.score >= 40 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  } text-white text-base px-4 py-1.5 font-bold`}>
                    {platform.score}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`bg-gray-900/50 rounded-lg p-3 ${platform.rank ? 'border border-green-500/30' : 'border border-red-500/30'}`}>
                    {platform.rank ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mb-1" />
                    )}
                    <div className="text-gray-200 font-medium text-sm">
                      {platform.rank ? `Rank #${platform.rank}` : 'Not ranked'}
                    </div>
                  </div>
                  <div className={`bg-gray-900/50 rounded-lg p-3 ${platform.contextProvided ? 'border border-green-500/30' : 'border border-red-500/30'}`}>
                    {platform.contextProvided ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mb-1" />
                    )}
                    <div className="text-gray-200 font-medium text-sm">
                      {platform.contextProvided ? 'Rich Context' : 'Limited Context'}
                    </div>
                  </div>
                  <div className={`bg-gray-900/50 rounded-lg p-3 ${platform.mentioned ? 'border border-green-500/30' : 'border border-red-500/30'}`}>
                    {platform.mentioned ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mb-1" />
                    )}
                    <div className="text-gray-200 font-medium text-sm">
                      {platform.mentioned ? 'Mentioned' : 'Not Mentioned'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-blue-500/30">
                    <div className="text-blue-400 text-xs mb-1">Data Accuracy</div>
                    <div className="text-gray-200 font-bold">
                      {platform.dataAccuracy || 'N/A'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                AI Optimization Actions
              </h4>
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gradient-to-r from-orange-500/20 to-orange-500/5 border-2 border-orange-500/40 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${
                      rec.priority === 'critical' ? 'bg-red-500' : 
                      rec.priority === 'high' ? 'bg-orange-500' : 
                      'bg-yellow-500'
                    } text-white text-sm px-3 py-1.5 font-bold`}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <Badge className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm">
                      {rec.impact} Impact
                    </Badge>
                  </div>
                  <h5 className="text-white font-bold text-base mb-2">{rec.issue}</h5>
                  <p className="text-gray-200 text-sm leading-relaxed">{rec.suggestion}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* AEO Metrics (NEW) */}
          {aiData.entityDensity && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-2 border-purple-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                🧬 Entity Density Score
              </h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">{aiData.entityDensity.message}</p>
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-green-500/30">
                  <div className="text-green-300 text-xs font-medium mb-1">Found on:</div>
                  <div className="text-green-400 font-bold">{aiData.entityDensity.foundOn?.join(', ') || 'None'}</div>
                </div>
                {aiData.entityDensity.missingFrom?.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-red-500/30">
                    <div className="text-red-300 text-xs font-medium mb-1">Missing from:</div>
                    <div className="text-red-400 font-bold">{aiData.entityDensity.missingFrom.slice(0, 2).join(', ')}</div>
                  </div>
                )}
              </div>
              <Badge className={`mt-4 text-base px-4 py-1.5 ${aiData.entityDensity.score >= 80 ? 'bg-green-500' : 'bg-red-500'} text-white font-bold`}>
                {Math.round(aiData.entityDensity.score)}% Entity Confidence
              </Badge>
            </div>
          )}

          {aiData.answerReadiness && (
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                💬 Answer-First Extraction
              </h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">{aiData.answerReadiness.message}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-gray-900/50 rounded-lg p-3 border ${aiData.answerReadiness.hasQA ? 'border-green-500/40' : 'border-red-500/40'}`}>
                  {aiData.answerReadiness.hasQA ? <CheckCircle className="w-5 h-5 text-green-400 mb-1" /> : <XCircle className="w-5 h-5 text-red-400 mb-1" />}
                  <div className="text-gray-200 font-medium text-sm">Q&A Section</div>
                </div>
                <div className={`bg-gray-900/50 rounded-lg p-3 border ${aiData.answerReadiness.hasConciseDesc ? 'border-green-500/40' : 'border-red-500/40'}`}>
                  {aiData.answerReadiness.hasConciseDesc ? <CheckCircle className="w-5 h-5 text-green-400 mb-1" /> : <XCircle className="w-5 h-5 text-red-400 mb-1" />}
                  <div className="text-gray-200 font-medium text-sm">Concise Descriptions</div>
                </div>
              </div>
            </div>
          )}

          {aiData.expertCitations && (
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-2 border-orange-500/40 rounded-xl p-5">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                🏆 Expert Citation Opportunities
              </h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">{aiData.expertCitations.message}</p>
              <div className="space-y-2">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-green-500/30">
                  <div className="text-green-300 text-xs font-medium mb-1">Found in:</div>
                  <div className="text-green-400 font-bold">{aiData.expertCitations.foundIn?.join(', ') || 'None'}</div>
                </div>
                {aiData.expertCitations.missingFrom?.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-red-500/30">
                    <div className="text-red-300 text-xs font-medium mb-1">Missing from:</div>
                    <div className="text-red-400 font-bold">{aiData.expertCitations.missingFrom.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Foxy AI Insight */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-2 border-blue-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Brain className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-black text-lg mb-3">🦊 Answer Engine Optimization (AEO)</h4>
                <p className="text-gray-200 text-base leading-relaxed mb-4">
                  In 2026, AI assistants like ChatGPT and Gemini recommend just <span className="text-[#c8ff00] font-black">1.2%</span> of 
                  local businesses. You're currently <span className={`font-bold ${summary.foundIn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.foundIn > 0 ? 'visible' : 'invisible'}</span> in AI search results.
                </p>
                <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
                  <div className="text-sm text-[#c8ff00] font-bold mb-3">Your AEO Status:</div>
                  <ul className="text-sm text-gray-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#c8ff00] flex-shrink-0">✓</span>
                      <span><span className="font-bold">Entity Density:</span> Present on {aiData.entityDensity?.foundOn?.length || 0} platforms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c8ff00] flex-shrink-0">✓</span>
                      <span><span className="font-bold">Answer-Ready:</span> {aiData.answerReadiness?.score || 0}% extraction readiness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c8ff00] flex-shrink-0">✓</span>
                      <span><span className="font-bold">Expert Citations:</span> Found in {aiData.expertCitations?.foundIn?.length || 0} sources</span>
                    </li>
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