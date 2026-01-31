import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingDown, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FunnelDropoffAnalysis() {
  const { data: dropoffData, isLoading } = useQuery({
    queryKey: ['funnel-dropoff'],
    queryFn: async () => {
      // Fetch events to analyze drop-off points
      const events = await base44.entities.ConversionEvent.list('-created_date', 500);
      
      // Count events by step
      const steps = {
        quiz_started: 0,
        quiz_step_2: 0,
        quiz_step_5: 0,
        quiz_completed: 0,
        pricing_viewed: 0,
        checkout_started: 0,
        payment_completed: 0
      };

      events.forEach(e => {
        if (steps.hasOwnProperty(e.event_name)) {
          steps[e.event_name]++;
        }
      });

      // Calculate funnel data
      const funnelSteps = [
        { name: 'Quiz Started', count: steps.quiz_started, percentage: 100 },
        { name: 'Mid-Quiz', count: steps.quiz_step_5, percentage: steps.quiz_started ? (steps.quiz_step_5 / steps.quiz_started * 100) : 0 },
        { name: 'Completed', count: steps.quiz_completed, percentage: steps.quiz_started ? (steps.quiz_completed / steps.quiz_started * 100) : 0 },
        { name: 'Pricing', count: steps.pricing_viewed, percentage: steps.quiz_completed ? (steps.pricing_viewed / steps.quiz_completed * 100) : 0 },
        { name: 'Checkout', count: steps.checkout_started, percentage: steps.pricing_viewed ? (steps.checkout_started / steps.pricing_viewed * 100) : 0 },
        { name: 'Paid', count: steps.payment_completed, percentage: steps.checkout_started ? (steps.payment_completed / steps.checkout_started * 100) : 0 }
      ];

      // Find biggest drop-offs
      const dropoffs = [];
      for (let i = 0; i < funnelSteps.length - 1; i++) {
        const dropRate = funnelSteps[i].percentage - funnelSteps[i + 1].percentage;
        if (dropRate > 20) {
          dropoffs.push({
            from: funnelSteps[i].name,
            to: funnelSteps[i + 1].name,
            dropRate: dropRate.toFixed(1)
          });
        }
      }

      return { funnelSteps, dropoffs };
    }
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center text-gray-400">
          Analyzing funnel...
        </CardContent>
      </Card>
    );
  }

  const getBarColor = (percentage) => {
    if (percentage >= 80) return '#c8ff00';
    if (percentage >= 60) return '#00bfff';
    if (percentage >= 40) return '#ffa500';
    return '#ff6b6b';
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-400" />
            Funnel Drop-off Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dropoffData?.funnelSteps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value, name) => [
                  name === 'count' ? `${value} users` : `${value.toFixed(1)}%`,
                  name === 'count' ? 'Users' : 'Conversion'
                ]}
              />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                {dropoffData?.funnelSteps.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {dropoffData?.funnelSteps.map((step, i) => (
              <div key={i} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">{step.name}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-white">{step.count}</div>
                  <div className="text-xs text-gray-500">({step.percentage.toFixed(0)}%)</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {dropoffData?.dropoffs.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Critical Drop-off Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dropoffData.dropoffs.map((dropoff, i) => (
                <div key={i} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-red-400" />
                      <div>
                        <div className="text-white font-medium">
                          {dropoff.from} → {dropoff.to}
                        </div>
                        <div className="text-xs text-gray-400">
                          High abandonment detected
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 font-bold">
                      -{dropoff.dropRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}