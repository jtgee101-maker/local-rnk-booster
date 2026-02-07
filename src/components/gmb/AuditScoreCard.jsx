import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  Award,
  MapPin,
  Star,
  Camera,
  FileText,
  Phone,
  Globe,
  Clock4,
  BarChart3,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

/**
 * AuditScoreCard Component
 * Displays comprehensive GMB audit results with visual breakdowns
 * 
 * Features:
 * - Overall score 0-100 with color coding
 * - Category breakdowns with visual bars
 * - Priority fix list sorted by impact
 * - Estimated ranking improvement prediction
 */

export default function AuditScoreCard({ 
  auditData, 
  businessData,
  onRefresh,
  onDownloadReport,
  isLoading = false 
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [animatedScores, setAnimatedScores] = useState({});
  const [showPrediction, setShowPrediction] = useState(false);

  // Animate scores on mount
  useEffect(() => {
    if (auditData) {
      const scores = {
        overall: 0,
        relevance: 0,
        distance: 0,
        prominence: 0,
        engagement: 0,
        completeness: 0,
        napConsistency: 0,
        sentiment: 0,
        photoQuality: 0
      };
      
      setAnimatedScores(scores);
      
      // Animate to actual values
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedScores({
          overall: Math.round((auditData.overallScore || 0) * easeOut),
          relevance: Math.round((auditData.breakdown?.relevance?.score || 0) * easeOut),
          distance: Math.round((auditData.breakdown?.distance?.score || 0) * easeOut),
          prominence: Math.round((auditData.breakdown?.prominence?.score || 0) * easeOut),
          engagement: Math.round((auditData.breakdown?.engagement?.score || 0) * easeOut),
          completeness: Math.round((auditData.breakdown?.completeness?.score || 0) * easeOut),
          napConsistency: Math.round((auditData.napConsistency?.score || 0) * easeOut),
          sentiment: Math.round((auditData.sentimentAnalysis?.overallHealth || 0) * easeOut),
          photoQuality: Math.round((auditData.photoOptimization?.overallScore || 0) * easeOut)
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      
      // Show prediction after scores animate
      setTimeout(() => setShowPrediction(true), 1600);
    }
  }, [auditData]);

  if (!auditData && !isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Audit Data Available</h3>
          <p className="text-gray-400 mb-4">Run a comprehensive audit to see your scores</p>
          <Button onClick={onRefresh} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Run Audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-600';
  };

  const getScoreGlow = (score) => {
    if (score >= 80) return 'shadow-green-500/30';
    if (score >= 60) return 'shadow-yellow-500/30';
    if (score >= 40) return 'shadow-orange-500/30';
    return 'shadow-red-500/30';
  };

  const getGradeBadge = (score) => {
    if (score >= 90) return { label: 'A+', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 85) return { label: 'A', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 80) return { label: 'A-', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 75) return { label: 'B+', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (score >= 70) return { label: 'B', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (score >= 65) return { label: 'B-', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (score >= 60) return { label: 'C+', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 55) return { label: 'C', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 50) return { label: 'C-', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (score >= 40) return { label: 'D', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: 'F', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const scoreCategories = [
    { 
      key: 'relevance', 
      label: 'Relevance', 
      icon: Target, 
      weight: '25%',
      score: auditData?.breakdown?.relevance?.score || 0,
      description: 'How well your profile matches search queries'
    },
    { 
      key: 'distance', 
      label: 'Distance', 
      icon: MapPin, 
      weight: '20%',
      score: auditData?.breakdown?.distance?.score || 0,
      description: 'Proximity optimization to searchers'
    },
    { 
      key: 'prominence', 
      label: 'Prominence', 
      icon: Award, 
      weight: '30%',
      score: auditData?.breakdown?.prominence?.score || 0,
      description: 'Reviews, citations, and backlinks'
    },
    { 
      key: 'engagement', 
      label: 'Engagement', 
      icon: Star, 
      weight: '15%',
      score: auditData?.breakdown?.engagement?.score || 0,
      description: 'CTR, calls, and direction requests'
    },
    { 
      key: 'completeness', 
      label: 'Completeness', 
      icon: FileText, 
      weight: '10%',
      score: auditData?.breakdown?.completeness?.score || 0,
      description: 'Profile fill rate and information'
    }
  ];

  const additionalFactors = [
    {
      key: 'napConsistency',
      label: 'NAP Consistency',
      icon: Phone,
      score: auditData?.napConsistency?.score || 0,
      description: 'Name, Address, Phone consistency across directories'
    },
    {
      key: 'sentiment',
      label: 'Review Sentiment',
      icon: Star,
      score: auditData?.sentimentAnalysis?.overallHealth || 0,
      description: 'Customer sentiment analysis from reviews'
    },
    {
      key: 'photoQuality',
      label: 'Photo Quality',
      icon: Camera,
      score: auditData?.photoOptimization?.overallScore || 0,
      description: 'Photo quantity, variety, and quality'
    }
  ];

  const grade = getGradeBadge(auditData?.overallScore || 0);
  const priorityFixes = auditData?.priorityFixes || [];
  const prediction = auditData?.rankingPrediction;

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Score Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div 
                className={`w-40 h-40 rounded-full bg-gradient-to-br ${getScoreColor(animatedScores.overall)} 
                  flex items-center justify-center shadow-2xl ${getScoreGlow(animatedScores.overall)}`}
              >
                <div className="text-center">
                  <div className="text-5xl font-black text-white">
                    {animatedScores.overall}
                  </div>
                  <div className="text-white/80 text-sm font-medium">/ 100</div>
                </div>
              </div>
              <Badge className={`absolute -top-2 -right-2 ${grade.color} border font-bold text-lg px-3 py-1`}>
                {grade.label}
              </Badge>
            </motion.div>

            {/* Score Info */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">
                GMB Health Score
              </h2>
              <p className="text-gray-400 mb-4">
                Comprehensive audit of your Google Business Profile
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <Badge variant="outline" className="bg-gray-800/50 text-gray-300 border-gray-700">
                  {auditData?.auditDepth === 'comprehensive' ? 'Deep Audit' : 'Standard Audit'}
                </Badge>
                <Badge variant="outline" className="bg-gray-800/50 text-gray-300 border-gray-700">
                  {new Date(auditData?.timestamp).toLocaleDateString()}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={animatedScores.overall >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                    animatedScores.overall >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 
                    'bg-red-500/10 text-red-400 border-red-500/30'}
                >
                  {auditData?.grade?.label || 'Needs Improvement'}
                </Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onRefresh}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Audit
              </Button>
              <Button 
                onClick={onDownloadReport}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ranking Prediction */}
      <AnimatePresence>
        {showPrediction && prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-purple-900/30 border border-purple-500/20 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Ranking Improvement Prediction</h3>
                <p className="text-gray-400 text-sm">Based on implementing priority fixes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Current Score</p>
                <p className="text-2xl font-bold text-white">{prediction.currentScore}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Projected Score</p>
                <p className="text-2xl font-bold text-green-400">{prediction.projectedScore}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Improvement</p>
                <p className="text-2xl font-bold text-purple-400">+{prediction.scoreImprovement}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Timeline</p>
                <p className="text-2xl font-bold text-blue-400">{prediction.timeline?.criticalFixes || '30-45 days'}</p>
              </div>
            </div>

            {prediction.estimatedImpact && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">+{prediction.estimatedImpact.additionalMonthlyClicks} monthly clicks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">${prediction.estimatedImpact.monthlyRevenueIncrease?.toLocaleString()}/month revenue increase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">{prediction.estimatedImpact.roi} ROI</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Ranking Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Factors */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Core Ranking Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreCategories.map((category, idx) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getScoreColor(category.score)} 
                      flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <category.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{category.label}</p>
                      <p className="text-gray-500 text-xs">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      category.score >= 80 ? 'text-green-400' : 
                      category.score >= 60 ? 'text-yellow-400' : 
                      category.score >= 40 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {animatedScores[category.key]}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/100</span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedScores[category.key]}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 + 0.5 }}
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getScoreColor(category.score)}`}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Weight: {category.weight}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Factors */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Additional Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {additionalFactors.map((factor, idx) => (
              <motion.div
                key={factor.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === factor.key ? null : factor.key)}
              >
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 
                  hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getScoreColor(factor.score)} 
                      flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <factor.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{factor.label}</p>
                      <p className="text-gray-500 text-xs">{factor.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${
                      factor.score >= 80 ? 'text-green-400' : 
                      factor.score >= 60 ? 'text-yellow-400' : 
                      factor.score >= 40 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {animatedScores[factor.key]}
                    </span>
                    {expandedSection === factor.key ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSection === factor.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-2 bg-gray-800/30 rounded-b-xl">
                        {renderFactorDetails(factor.key, auditData)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Priority Fix List */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Priority Fix List
            <Badge className="ml-auto bg-purple-500/20 text-purple-400 border-purple-500/30">
              {priorityFixes.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priorityFixes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium">Great job!</p>
              <p className="text-gray-400">No critical fixes needed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {priorityFixes.slice(0, 10).map((fix, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 
                    transition-colors cursor-pointer group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                    ${getPriorityColor(fix.priority)}`}>
                    {fix.priority === 'critical' ? <AlertCircle className="w-5 h-5" /> :
                     fix.priority === 'high' ? <Zap className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${getPriorityColor(fix.priority)}`}>
                        {fix.priority.toUpperCase()}
                      </Badge>
                      <span className="text-gray-400 text-xs">{fix.category}</span>
                    </div>
                    <p className="text-white font-medium group-hover:text-purple-400 transition-colors">
                      {fix.issue}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">{fix.action}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-green-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{fix.impact}% impact
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock4 className="w-3 h-3" />
                        {fix.timeline}
                      </span>
                      <span className={`flex items-center gap-1 ${
                        fix.effort === 'low' ? 'text-green-400' :
                        fix.effort === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        <Zap className="w-3 h-3" />
                        {fix.effort} effort
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 
                    group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Render detailed factor information
function renderFactorDetails(factorKey, auditData) {
  switch (factorKey) {
    case 'napConsistency':
      const napData = auditData?.napConsistency;
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Consistent Listings:</span>
            <span className="text-white">{napData?.consistentListings || 0} / {napData?.totalDirectories || 20}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Inconsistencies Found:</span>
            <span className={napData?.inconsistencies?.length > 0 ? 'text-red-400' : 'text-green-400'}>
              {napData?.inconsistencies?.length || 0}
            </span>
          </div>
          {napData?.inconsistencies?.map((inc, i) => (
            <div key={i} className="text-red-400 text-xs mt-1">
              ⚠ {inc.issue}
            </div>
          ))}
        </div>
      );
    
    case 'sentiment':
      const sentiment = auditData?.sentimentAnalysis;
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Reviews:</span>
            <span className="text-white">{sentiment?.totalReviews || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Response Rate:</span>
            <span className={sentiment?.responseRate >= 50 ? 'text-green-400' : 'text-yellow-400'}>
              {sentiment?.responseRate || 0}%
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-green-500/20 rounded p-2 text-center">
              <div className="text-green-400 font-bold">{sentiment?.sentimentBreakdown?.positive || 0}%</div>
              <div className="text-gray-500 text-xs">Positive</div>
            </div>
            <div className="flex-1 bg-gray-500/20 rounded p-2 text-center">
              <div className="text-gray-400 font-bold">{sentiment?.sentimentBreakdown?.neutral || 0}%</div>
              <div className="text-gray-500 text-xs">Neutral</div>
            </div>
            <div className="flex-1 bg-red-500/20 rounded p-2 text-center">
              <div className="text-red-400 font-bold">{sentiment?.sentimentBreakdown?.negative || 0}%</div>
              <div className="text-gray-500 text-xs">Negative</div>
            </div>
          </div>
        </div>
      );
    
    case 'photoQuality':
      const photoData = auditData?.photoOptimization;
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Photos:</span>
            <span className={photoData?.totalPhotos >= 15 ? 'text-green-400' : 'text-yellow-400'}>
              {photoData?.totalPhotos || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Category Balance:</span>
            <span className="text-white">{photoData?.categoryBalance || 0}%</span>
          </div>
          {photoData?.qualityIssues?.length > 0 && (
            <div className="text-yellow-400 text-xs mt-2">
              ⚠ {photoData.qualityIssues[0]}
            </div>
          )}
        </div>
      );
    
    default:
      return null;
  }
}
