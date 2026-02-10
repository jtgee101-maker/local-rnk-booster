import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, CheckCircle2, Clock, Target, ArrowRight,
  Calendar, Users, BookOpen, Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [lead, setLead] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Fetch lead by email
      const leads = await base44.entities.Lead.filter({ email: currentUser.email });
      if (leads.length > 0) {
        const leadData = leads[0];
        setLead(leadData);

        // Fetch action plan
        const plans = await base44.entities.ActionPlan.filter({ lead_id: leadData.id });
        if (plans.length > 0) setActionPlan(plans[0]);

        // Fetch onboarding
        const onboardings = await base44.entities.ClientOnboarding.filter({ lead_id: leadData.id });
        if (onboardings.length > 0) setOnboarding(onboardings[0]);

        // Fetch metrics history
        const history = await base44.entities.GMBMetricsHistory.filter(
          { lead_id: leadData.id },
          '-snapshot_date',
          30
        );
        setMetricsHistory(history.reverse());
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboardingStep = async (stepIndex) => {
    try {
      const updatedSteps = [...onboarding.steps];
      updatedSteps[stepIndex].status = 'completed';
      updatedSteps[stepIndex].completed_date = new Date().toISOString();

      const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
      const percentage = (completedCount / updatedSteps.length) * 100;

      await base44.entities.ClientOnboarding.update(onboarding.id, {
        steps: updatedSteps,
        completion_percentage: percentage,
        status: percentage === 100 ? 'completed' : 'in_progress'
      });

      loadClientData();
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8ff00]" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
        <Card className="max-w-2xl mx-auto bg-[#1a1a2e] border-gray-800">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to GeeNius Pathway</h2>
            <p className="text-gray-400 mb-6">
              We're setting up your account. Please check back soon or contact your account manager.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = metricsHistory.map(snapshot => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    health: snapshot.metrics.health_score,
    rating: snapshot.metrics.gmb_rating * 20, // Scale to 0-100
    reviews: snapshot.metrics.reviews_count
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c8ff00]">{lead.business_name}</h1>
            <p className="text-gray-400">Your GeeNius Pathway Dashboard</p>
          </div>
          <Badge className="bg-[#c8ff00] text-black text-lg px-4 py-2">
            Health Score: {lead.health_score}/100
          </Badge>
        </div>

        {/* Onboarding Progress */}
        {onboarding && onboarding.status !== 'completed' && (
          <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#c8ff00]/30">
            <CardHeader>
              <CardTitle className="text-[#c8ff00] flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Onboarding Progress
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete these steps to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-[#c8ff00] font-semibold">{Math.round(onboarding.completion_percentage)}%</span>
                </div>
                <Progress value={onboarding.completion_percentage} className="h-2" />
              </div>
              
              <div className="grid gap-3">
                {onboarding.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      step.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-gray-800/50 border-gray-700 hover:border-[#c8ff00]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">{step.step_name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                        </div>
                      </div>
                      {step.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => completeOnboardingStep(index)}
                          className="bg-[#c8ff00] text-black hover:bg-[#a8dd00]"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics Chart */}
        {chartData.length > 0 && (
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
                Performance Tracking
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your GMB metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="health" stroke="#c8ff00" strokeWidth={2} name="Health Score" />
                  <Line type="monotone" dataKey="rating" stroke="#a855f7" strokeWidth={2} name="Rating (scaled)" />
                  <Line type="monotone" dataKey="reviews" stroke="#10b981" strokeWidth={2} name="Reviews" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Action Plan */}
        {actionPlan && (
          <Card className="bg-[#1a1a2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#c8ff00]" />
                Your 90-Day Action Plan
              </CardTitle>
              <CardDescription className="text-gray-400">
                {actionPlan.ai_analysis.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Roadmap Phases */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-[#c8ff00] mb-3">Week 1-4: Foundation</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {actionPlan.roadmap.week_1_4.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-[#c8ff00] mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-purple-400 mb-3">Week 5-8: Growth</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {actionPlan.roadmap.week_5_8.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-green-400 mb-3">Week 9-12: Optimization</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {actionPlan.roadmap.week_9_12.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Priority Actions */}
              <div>
                <h4 className="font-semibold text-white mb-4">Recommended Actions</h4>
                <div className="space-y-3">
                  {actionPlan.recommended_actions.slice(0, 5).map((action, i) => (
                    <div key={i} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {action.category}
                        </Badge>
                        <Badge 
                          className={
                            action.priority <= 2 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }
                        >
                          Priority {action.priority}
                        </Badge>
                      </div>
                      <p className="text-white font-medium mb-2">{action.action}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Effort: {action.estimated_effort}</span>
                        <span>•</span>
                        <span>Impact: {action.expected_impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-[#1a1a2e] border-gray-800 hover:border-[#c8ff00]/50 transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <Calendar className="w-10 h-10 text-[#c8ff00] mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Schedule Call</h3>
              <p className="text-sm text-gray-400 mb-4">Book time with your account manager</p>
              <Button className="w-full bg-[#c8ff00] text-black hover:bg-[#a8dd00]">
                Schedule Now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Contact Support</h3>
              <p className="text-sm text-gray-400 mb-4">Get help from your team</p>
              <Button className="w-full bg-purple-500 text-white hover:bg-purple-600">
                Open Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a2e] border-gray-800 hover:border-green-500/50 transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Training Library</h3>
              <p className="text-sm text-gray-400 mb-4">Access guides and resources</p>
              <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}