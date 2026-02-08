import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, AlertTriangle, Zap, Target, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRecommendationEngine() {
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      // In production, this would call an AI analysis function
      return [
        {
          id: 1,
          type: 'optimization',
          priority: 'high',
          title: 'Optimize Quiz Step 3 - 34% Drop-off',
          description: 'Step 3 shows the highest abandonment rate. Consider simplifying the question or adding progress indicators.',
          impact: 'Could recover ~23 leads/month',
          action: 'Review Quiz Step',
          icon: TrendingUp
        },
        {
          id: 2,
          type: 'nurture',
          priority: 'medium',
          title: 'Re-engage 89 Dormant Leads',
          description: 'You have 89 leads that haven\'t been contacted in 30+ days with health scores above 60.',
          impact: 'Est. 12-15 conversions',
          action: 'Create Campaign',
          icon: Mail
        },
        {
          id: 3,
          type: 'segmentation',
          priority: 'high',
          title: 'High-Value Segment Identified',
          description: 'Medical professionals with 10+ reviews show 3x conversion rate. Create targeted campaign.',
          impact: 'Potential $8,500 ARR',
          action: 'Build Segment',
          icon: Target
        },
        {
          id: 4,
          type: 'pricing',
          priority: 'medium',
          title: 'Test $79 Price Point',
          description: 'Similar businesses see 18% better conversion at $79 vs $99. Consider A/B test.',
          impact: '+$2,100/mo revenue',
          action: 'Create A/B Test',
          icon: Zap
        },
        {
          id: 5,
          type: 'alert',
          priority: 'low',
          title: 'Email Engagement Declining',
          description: 'Open rates dropped 8% in last 2 weeks. Review subject lines and send times.',
          impact: 'Prevent further decline',
          action: 'View Analytics',
          icon: AlertTriangle
        }
      ];
    }
  });

  const handleAction = (rec) => {
    toast.info(`Action: ${rec.action} - Coming soon!`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Analyzing data...
        </CardContent>
      </Card>
    );
  }

  const highPriority = recommendations?.filter(r => r.priority === 'high').length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#c8ff00]" />
            AI Recommendations
          </h3>
          <p className="text-sm text-gray-400">Automated insights & action items</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh Insights
        </Button>
      </div>

      {highPriority > 0 && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-white font-semibold">
                  {highPriority} High Priority {highPriority === 1 ? 'Action' : 'Actions'} Required
                </div>
                <div className="text-xs text-gray-400">Review these recommendations immediately</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {recommendations?.map((rec) => {
          const Icon = rec.icon;
          return (
            <Card key={rec.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    <Icon className="w-5 h-5 text-[#c8ff00]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {rec.type}
                      </Badge>
                    </div>
                    
                    <h4 className="text-white font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 font-semibold">{rec.impact}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAction(rec)}
                        className="text-[#c8ff00] border-[#c8ff00]/30 hover:bg-[#c8ff00]/10"
                      >
                        {rec.action}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}