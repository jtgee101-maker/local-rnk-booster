import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FlaskConical, TrendingUp, Users, Play, Pause, Trophy, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestManager() {
  const { data: tests = [], refetch, isLoading } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const result = await base44.entities.ABTest.list();
      return result;
    },
    initialData: []
  });

  const mockTests = tests.length === 0 ? [
    {
      id: 1,
      name: 'Quiz Headline Variation',
      page: 'quiz',
      status: 'active',
      variants: [
        { id: 'A', name: 'Original', views: 245, conversions: 42, rate: 17.1 },
        { id: 'B', name: 'Benefit-Focused', views: 238, conversions: 58, rate: 24.4 }
      ],
      confidence: 95,
      winner: 'B'
    },
    {
      id: 2,
      name: 'Pricing Page CTA Color',
      page: 'pricing',
      status: 'active',
      variants: [
        { id: 'A', name: 'Green CTA', views: 189, conversions: 31, rate: 16.4 },
        { id: 'B', name: 'Yellow CTA', views: 195, conversions: 34, rate: 17.4 }
      ],
      confidence: 67,
      winner: null
    },
    {
      id: 3,
      name: 'Email Subject Line Test',
      page: 'email',
      status: 'completed',
      variants: [
        { id: 'A', name: 'Question Format', views: 500, conversions: 95, rate: 19.0 },
        { id: 'B', name: 'Urgency Format', views: 500, conversions: 122, rate: 24.4 }
      ],
      confidence: 99,
      winner: 'B'
    }
  ] : tests;

  const handlePause = async (test) => {
    toast.info(`Pausing test: ${test.name}`);
  };

  const handleDeclareWinner = async (test, variant) => {
    toast.success(`Declared ${variant.name} as winner for ${test.name}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 95) return 'text-green-400';
    if (confidence >= 80) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">A/B Test Manager</h3>
          <p className="text-sm text-gray-400">Active experiments and test results</p>
        </div>
        <Button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black">
          <FlaskConical className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {isLoading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">Loading tests...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockTests.map((test) => (
            <Card key={test.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FlaskConical className="w-5 h-5 text-[#c8ff00]" />
                      <h4 className="text-white font-semibold">{test.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Page: {test.page}
                      </Badge>
                      {test.confidence && (
                        <Badge variant="outline" className={getConfidenceColor(test.confidence)}>
                          {test.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {test.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePause(test)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {test.variants.map((variant) => (
                    <div key={variant.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {test.winner === variant.id && (
                            <Trophy className="w-5 h-5 text-yellow-400" />
                          )}
                          <div>
                            <div className="text-white font-medium">
                              Variant {variant.id}: {variant.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {variant.views} views • {variant.conversions} conversions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#c8ff00]">
                            {variant.rate}%
                          </div>
                          <div className="text-xs text-gray-400">conversion rate</div>
                        </div>
                      </div>
                      
                      <Progress value={variant.rate * 3} className="h-2" />
                      
                      {test.status === 'active' && test.confidence >= 95 && test.winner === variant.id && (
                        <Button
                          size="sm"
                          className="mt-3 w-full bg-green-500 hover:bg-green-600"
                          onClick={() => handleDeclareWinner(test, variant)}
                        >
                          <Trophy className="w-3 h-3 mr-2" />
                          Declare Winner
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {test.status === 'active' && test.confidence < 95 && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-xs text-blue-400">
                      ℹ️ This test needs more data to reach statistical significance. Continue running to reach 95% confidence.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}