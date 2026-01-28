import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import FoxyMascot from './FoxyMascot';

export default function FoxyHealthScore({ scoreData, onRevealComplete }) {
  const [revealed, setRevealed] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true);
      animateScore();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const animateScore = () => {
    let current = 0;
    const target = scoreData.overallScore || 0;
    const increment = target / 50;
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(interval);
        setTimeout(() => onRevealComplete && onRevealComplete(), 1500);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 30);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return { text: 'Healthy', icon: CheckCircle, color: 'green' };
    if (score >= 60) return { text: 'At Risk', icon: AlertTriangle, color: 'yellow' };
    return { text: 'Critical Leaks', icon: XCircle, color: 'red' };
  };

  const status = getScoreStatus(animatedScore);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-[#c8ff00]/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,255,0,0.1),transparent)]" />
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <FoxyMascot expression="detective" size="lg" />
            <Badge className={`bg-${status.color}-500/20 text-${status.color}-400 border-${status.color}-500/50 text-lg px-4 py-2`}>
              <StatusIcon className="w-5 h-5 mr-2" />
              {status.text}
            </Badge>
          </div>
          <CardTitle className="text-white text-3xl flex items-center gap-3">
            Foxy Health Index
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            🦊 Sniffing out revenue leaks and competitor advantages...
          </p>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Main Score Display */}
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: revealed ? 1 : 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative inline-block"
            >
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: animatedScore / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeDasharray="553"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c8ff00" />
                    <stop offset="100%" stopColor="#00ff88" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-6xl font-black ${getScoreColor(animatedScore)}`}>
                  {animatedScore}
                </div>
                <div className="text-gray-400 text-sm">/ 100</div>
              </div>
            </motion.div>
          </div>

          {/* Score Breakdown */}
          {revealed && scoreData.scoreBreakdown && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {Object.entries(scoreData.scoreBreakdown).map(([key, data], idx) => (
                <div key={key} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={data.status === 'pass' ? 'default' : 'destructive'} className="text-xs">
                        {data.status === 'pass' ? '✓' : '✗'} {data.value}
                      </Badge>
                      <span className="text-gray-400 text-sm">{data.score}/{data.weight}</span>
                    </div>
                  </div>
                  <Progress value={(data.score / data.weight) * 100} className="h-2" />
                  <p className="text-gray-500 text-xs mt-1">{data.message}</p>
                  {data.opennessBonus !== undefined && (
                    <p className="text-[#c8ff00] text-xs mt-1 flex items-center gap-1">
                      🕐 {data.opennessBonus ? 'Open now = Higher rank' : 'Currently closed'}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Velocity Metrics (NEW) */}
          {revealed && scoreData.velocityMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-white font-bold flex items-center gap-2">
                ⚡ 2026 Velocity Signals
              </h4>
              
              {scoreData.velocityMetrics.reviewVelocity && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">Review Velocity</span>
                    <Badge className={`${
                      scoreData.velocityMetrics.reviewVelocity.status === 'excellent' ? 'bg-green-500' :
                      scoreData.velocityMetrics.reviewVelocity.status === 'good' ? 'bg-yellow-500' :
                      'bg-red-500'
                    } text-white text-xs`}>
                      {scoreData.velocityMetrics.reviewVelocity.status}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs">{scoreData.velocityMetrics.reviewVelocity.message}</p>
                </div>
              )}

              {scoreData.velocityMetrics.visualFreshness && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">Visual Freshness</span>
                    <Badge className={`${
                      scoreData.velocityMetrics.visualFreshness.status === 'excellent' ? 'bg-green-500' :
                      scoreData.velocityMetrics.visualFreshness.status === 'good' ? 'bg-yellow-500' :
                      'bg-red-500'
                    } text-white text-xs`}>
                      {scoreData.velocityMetrics.visualFreshness.photoCount} photos
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs">{scoreData.velocityMetrics.visualFreshness.message}</p>
                </div>
              )}

              {scoreData.velocityMetrics.napSync && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">NAP Sync (Entity Trust)</span>
                    <Badge className={`${
                      scoreData.velocityMetrics.napSync.score === 100 ? 'bg-green-500' :
                      scoreData.velocityMetrics.napSync.score >= 66 ? 'bg-yellow-500' :
                      'bg-red-500'
                    } text-white text-xs`}>
                      {Math.round(scoreData.velocityMetrics.napSync.score)}%
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs">{scoreData.velocityMetrics.napSync.message}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Revenue Impact Alert */}
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center"
            >
              <TrendingDown className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-xl mb-2">
                🚨 Revenue Leak Detected
              </h3>
              <p className="text-gray-400 text-sm">
                Foxy found critical issues costing you money every hour
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}