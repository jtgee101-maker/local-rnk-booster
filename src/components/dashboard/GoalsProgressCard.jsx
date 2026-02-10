import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, Sparkles } from 'lucide-react';

export default function GoalsProgressCard({ goals }) {
  if (!goals || goals.length === 0) return null;

  const activeGoals = goals.filter(g => g.status === 'active');
  const avgProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress_percentage, 0) / activeGoals.length)
    : 0;

  return (
    <Card className="bg-[#1a1a2e] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#c8ff00]" />
          Your Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-2xl font-bold text-[#c8ff00]">{avgProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-[#c8ff00] h-3 rounded-full transition-all"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2">
          {activeGoals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-semibold text-white">{goal.title}</h5>
                    {goal.ai_suggested && (
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>{goal.baseline_value} → {goal.target_value} {goal.unit}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#c8ff00]">
                  {Math.round(goal.progress_percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-[#c8ff00] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Calendar className="w-3 h-3" />
                <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}