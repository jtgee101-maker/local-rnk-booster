import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Zap } from 'lucide-react';

export default function OnboardingProgressCard({ onboarding, onCompleteStep }) {
  if (!onboarding || onboarding.status === 'completed') return null;

  const nextPendingStep = onboarding.steps.find(s => s.status === 'pending');
  const nextPendingIndex = onboarding.steps.findIndex(s => s.status === 'pending');

  return (
    <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#c8ff00]/30">
      <CardHeader>
        <CardTitle className="text-[#c8ff00] flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Complete Your Onboarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-[#c8ff00] font-semibold">
              {Math.round(onboarding.completion_percentage)}%
            </span>
          </div>
          <Progress value={onboarding.completion_percentage} className="h-2" />
        </div>

        {nextPendingStep && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#c8ff00] mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Next Step</h4>
                <p className="text-sm text-gray-300 mb-2">{nextPendingStep.step_name}</p>
                <p className="text-xs text-gray-400 mb-3">{nextPendingStep.description}</p>
                <Button
                  size="sm"
                  onClick={() => onCompleteStep(nextPendingIndex)}
                  className="bg-[#c8ff00] text-black hover:bg-[#a8dd00]"
                >
                  Mark Complete
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          {onboarding.steps.filter(s => s.status === 'completed').length} of {onboarding.steps.length} steps completed
        </div>
      </CardContent>
    </Card>
  );
}