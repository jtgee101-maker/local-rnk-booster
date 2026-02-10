import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Target, TrendingUp, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ActionPlanViewer({ leadId, onRefresh }) {
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    if (leadId) loadActionPlan();
  }, [leadId]);

  const loadActionPlan = async () => {
    try {
      setLoading(true);
      const plans = await base44.entities.ActionPlan.filter({ lead_id: leadId }, '-created_date', 1);
      if (plans.length > 0) {
        setActionPlan(plans[0]);
      }
    } catch (error) {
      console.error('Error loading action plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setGenerating(true);
      toast.info('Generating AI action plan...');
      
      await base44.functions.invoke('ai/generateActionPlan', { lead_id: leadId });
      
      toast.success('Action plan generated successfully!');
      loadActionPlan();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error generating action plan:', error);
      toast.error('Failed to generate action plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!actionPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No action plan generated yet</p>
            <Button onClick={generateNewPlan} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Action Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedActions = actionPlan.recommended_actions.filter(a => a.status === 'completed').length;
  const totalActions = actionPlan.recommended_actions.length;
  const completionRate = Math.round((completedActions / totalActions) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              AI Action Plan
            </CardTitle>
            <CardDescription className="mt-1">
              {actionPlan.business_name} • Health Score: {actionPlan.health_score}/100
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={generateNewPlan} disabled={generating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <Badge className={
              actionPlan.ai_analysis.priority_level === 'urgent' ? 'bg-red-500' :
              actionPlan.ai_analysis.priority_level === 'high' ? 'bg-orange-500' :
              actionPlan.ai_analysis.priority_level === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }>
              {actionPlan.ai_analysis.priority_level.toUpperCase()}
            </Badge>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">{actionPlan.ai_analysis.summary}</p>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Estimated Impact:</strong> {actionPlan.ai_analysis.estimated_impact}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Action Plan Progress</span>
            <span className="text-blue-600 font-semibold">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {completedActions} of {totalActions} actions completed
          </p>
        </div>

        {/* Top Priority Actions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Top Priority Actions</h4>
          <div className="space-y-3">
            {actionPlan.recommended_actions
              .sort((a, b) => a.priority - b.priority)
              .slice(0, 5)
              .map((action, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg border ${
                    action.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {action.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {action.category}
                        </Badge>
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          P{action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{action.action}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>⏱️ {action.estimated_effort}</span>
                        <span>•</span>
                        <span>📈 {action.expected_impact} impact</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 90-Day Roadmap */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">90-Day Roadmap</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="font-semibold text-yellow-900 text-sm mb-2">Week 1-4</h5>
              <ul className="space-y-1 text-xs text-yellow-800">
                {actionPlan.roadmap.week_1_4.slice(0, 3).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="font-semibold text-blue-900 text-sm mb-2">Week 5-8</h5>
              <ul className="space-y-1 text-xs text-blue-800">
                {actionPlan.roadmap.week_5_8.slice(0, 3).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="font-semibold text-green-900 text-sm mb-2">Week 9-12</h5>
              <ul className="space-y-1 text-xs text-green-800">
                {actionPlan.roadmap.week_9_12.slice(0, 3).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}