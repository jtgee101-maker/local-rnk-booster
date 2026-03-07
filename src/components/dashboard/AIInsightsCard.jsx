import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { 
  Sparkles, TrendingUp, AlertTriangle, TrendingDown,
  BarChart3, RefreshCw, ChevronRight, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIInsightsCard({ leadId }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (leadId) loadLatestInsight();
  }, [leadId]);

  const loadLatestInsight = async () => {
    try {
      setLoading(true);
      const insights = await base44.entities.AIInsight.filter(
        { lead_id: leadId },
        '-created_date',
        1
      );
      if (insights.length > 0) {
        setInsight(insights[0]);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setGenerating(true);
      toast.info('AI is analyzing your performance data...');
      
      const response = await base44.functions.invoke('ai/generateAIInsights', { 
        lead_id: leadId,
        report_type: 'weekly'
      });

      if (response.data?.error) {
        toast.error(response.data.message || response.data.error);
        return;
      }
      
      toast.success('AI insights generated!');
      loadLatestInsight();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Need at least 2 metric snapshots to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#1a1a2e] border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8ff00] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Performance Insights
          </CardTitle>
          <CardDescription className="text-gray-400">
            Get AI-powered analysis of your GMB performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">
            No insights generated yet. Click below to get your first AI-powered performance report.
          </p>
          <Button 
            onClick={handleGenerateInsights}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate AI Insights'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Performance Insights
            </CardTitle>
            <CardDescription className="text-gray-400 flex items-center gap-2 mt-2">
              <Calendar className="w-3 h-3" />
              {new Date(insight.period_start).toLocaleDateString()} - {new Date(insight.period_end).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateInsights}
            disabled={generating}
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Narrative Summary */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {insight.narrative_summary}
          </p>
        </div>

        {/* Key Metrics Changes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Health Score</span>
              <Badge className={insight.key_metrics.health_score_change >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                {insight.key_metrics.health_score_change >= 0 ? '+' : ''}{insight.key_metrics.health_score_change.toFixed(1)}
              </Badge>
            </div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Reviews</span>
              <Badge className={insight.key_metrics.reviews_gained >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                {insight.key_metrics.reviews_gained >= 0 ? '+' : ''}{insight.key_metrics.reviews_gained}
              </Badge>
            </div>
          </div>
        </div>

        {/* Highlights */}
        {insight.highlights && insight.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Highlights
            </h4>
            <ul className="space-y-2">
              {insight.highlights.slice(0, 3).map((highlight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alerts */}
        {insight.alerts && insight.alerts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Needs Attention
            </h4>
            <ul className="space-y-2">
              {insight.alerts.slice(0, 3).map((alert, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <ChevronRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Anomalies */}
        {insight.anomalies && insight.anomalies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Detected Anomalies
            </h4>
            <div className="space-y-2">
              {insight.anomalies.slice(0, 2).map((anomaly, i) => (
                <div key={i} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-white">{anomaly.metric}</span>
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{anomaly.description}</p>
                  <p className="text-xs text-purple-300 italic">{anomaly.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecasts */}
        {insight.forecasts && insight.forecasts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              90-Day Forecast
            </h4>
            <div className="space-y-2">
              {insight.forecasts.slice(0, 3).map((forecast, i) => (
                <div key={i} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{forecast.metric}</span>
                    <Badge className={getConfidenceColor(forecast.confidence)}>
                      {forecast.confidence} confidence
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Current: {forecast.current_value}</span>
                    <span>→</span>
                    <span className="text-[#c8ff00]">90d: {forecast.predicted_value_90d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}