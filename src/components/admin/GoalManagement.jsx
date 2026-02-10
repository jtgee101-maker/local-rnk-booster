import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Target, Plus, TrendingUp, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalManagement({ leadId, onUpdate }) {
  const [goals, setGoals] = useState([]);
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'phone_calls',
    title: '',
    description: '',
    baseline_value: 0,
    target_value: 0,
    unit: '',
    target_date: ''
  });

  useEffect(() => {
    if (leadId) loadGoals();
  }, [leadId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.ClientGoal.filter({ lead_id: leadId }, '-created_date');
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestGoals = async () => {
    try {
      setSuggesting(true);
      toast.info('AI is analyzing performance and suggesting goals...');
      
      const response = await base44.functions.invoke('goals/suggestGoals', { lead_id: leadId });
      setSuggestedGoals(response.data.suggested_goals);
      toast.success(`${response.data.suggested_goals.length} goals suggested!`);
    } catch (error) {
      console.error('Error suggesting goals:', error);
      toast.error('Failed to generate goal suggestions');
    } finally {
      setSuggesting(false);
    }
  };

  const handleCreateGoal = async (goalData) => {
    try {
      const lead = await base44.entities.Lead.filter({ id: leadId }).then(r => r[0]);
      
      await base44.entities.ClientGoal.create({
        lead_id: leadId,
        business_name: lead?.business_name || '',
        ...goalData,
        start_date: new Date().toISOString(),
        current_value: goalData.baseline_value,
        progress_percentage: 0
      });

      toast.success('Goal created successfully!');
      loadGoals();
      setShowForm(false);
      setNewGoal({
        goal_type: 'phone_calls',
        title: '',
        description: '',
        baseline_value: 0,
        target_value: 0,
        unit: '',
        target_date: ''
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await base44.entities.ClientGoal.delete(goalId);
      toast.success('Goal deleted');
      loadGoals();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const getGoalTypeColor = (type) => {
    const colors = {
      phone_calls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      reviews: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      profile_views: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      direction_requests: 'bg-green-500/20 text-green-300 border-green-500/30',
      ranking: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      health_score: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      custom: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[type] || colors.custom;
  };

  return (
    <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c8ff00]" />
            SMART Goals
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSuggestGoals}
              disabled={suggesting}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Suggest
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-[#c8ff00] text-black hover:bg-[#a8dd00]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Goal Form */}
        {showForm && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
            <Select
              value={newGoal.goal_type}
              onValueChange={(v) => setNewGoal({...newGoal, goal_type: v})}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone_calls">Phone Calls</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
                <SelectItem value="profile_views">Profile Views</SelectItem>
                <SelectItem value="direction_requests">Direction Requests</SelectItem>
                <SelectItem value="ranking">Ranking</SelectItem>
                <SelectItem value="health_score">Health Score</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Goal Title (e.g., Increase phone calls by 20%)"
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              className="bg-gray-900/50 border-gray-700 text-white"
            />

            <Textarea
              placeholder="SMART Description: Specific, Measurable, Achievable, Relevant, Time-bound"
              value={newGoal.description}
              onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
              className="bg-gray-900/50 border-gray-700 text-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Baseline"
                value={newGoal.baseline_value}
                onChange={(e) => setNewGoal({...newGoal, baseline_value: parseFloat(e.target.value)})}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <Input
                type="number"
                placeholder="Target"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({...newGoal, target_value: parseFloat(e.target.value)})}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Unit (%, calls, reviews)"
                value={newGoal.unit}
                onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <Input
                type="date"
                value={newGoal.target_date ? newGoal.target_date.split('T')[0] : ''}
                onChange={(e) => setNewGoal({...newGoal, target_date: new Date(e.target.value).toISOString()})}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleCreateGoal(newGoal)} className="flex-1 bg-[#c8ff00] text-black">
                Create Goal
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="border-gray-700">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* AI Suggested Goals */}
        {suggestedGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Suggested Goals
            </h4>
            {suggestedGoals.map((goal, i) => (
              <div key={i} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-white mb-1">{goal.title}</h5>
                    <p className="text-xs text-gray-400 mb-2">{goal.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>Baseline: {goal.baseline_value} {goal.unit}</span>
                      <span>→</span>
                      <span>Target: {goal.target_value} {goal.unit}</span>
                    </div>
                    <p className="text-xs text-purple-300 mt-2 italic">{goal.rationale}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const targetDate = new Date();
                      targetDate.setDate(targetDate.getDate() + 90);
                      handleCreateGoal({
                        ...goal,
                        target_date: targetDate.toISOString(),
                        ai_suggested: true
                      });
                      setSuggestedGoals(suggestedGoals.filter((_, idx) => idx !== i));
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Goals */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-4">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No goals set yet. Click "Add Goal" or "AI Suggest" to get started.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getGoalTypeColor(goal.goal_type)}>
                        {goal.goal_type.replace('_', ' ')}
                      </Badge>
                      {goal.ai_suggested && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <h5 className="font-semibold text-white mb-1">{goal.title}</h5>
                    <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{goal.baseline_value} {goal.unit} → {goal.target_value} {goal.unit}</span>
                    <span className="text-[#c8ff00]">{Math.round(goal.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#c8ff00] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                    <span>{goal.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}