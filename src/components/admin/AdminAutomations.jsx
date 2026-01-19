import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Play, Pause, RefreshCw } from 'lucide-react';

export default function AdminAutomations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      // This would normally fetch from an API
      const mockAutomations = [
        {
          id: 1,
          name: 'Process Lead Nurture Emails',
          type: 'scheduled',
          status: 'active',
          frequency: 'Every 6 hours',
          lastRun: '2 hours ago',
          nextRun: '4 hours from now',
          successRate: '100%'
        },
        {
          id: 2,
          name: 'Send Abandoned Cart Emails',
          type: 'scheduled',
          status: 'active',
          frequency: 'Daily at 3 PM EST',
          lastRun: '1 hour ago',
          nextRun: 'Tomorrow 3 PM',
          successRate: '98%'
        },
        {
          id: 3,
          name: 'Start Nurture for New Leads',
          type: 'entity',
          status: 'active',
          frequency: 'On Lead Creation',
          lastRun: '5 minutes ago',
          nextRun: 'Real-time',
          successRate: '99%'
        },
        {
          id: 4,
          name: 'Post-Conversion Nurture',
          type: 'scheduled',
          status: 'active',
          frequency: 'Every 6 hours',
          lastRun: '30 minutes ago',
          nextRun: '5.5 hours from now',
          successRate: '97%'
        }
      ];

      setAutomations(mockAutomations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading automations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading automations...</div>;
  }

  return (
    <div className="space-y-4">
      {automations.map((automation) => (
        <Card key={automation.id} className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[#c8ff00]" />
                  <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[#c8ff00]">{automation.type}</Badge>
                  <Badge className={
                    automation.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }>
                    {automation.status}
                  </Badge>
                  <Badge variant="outline">{automation.successRate} success</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  {automation.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Frequency</p>
                <p className="text-white font-medium">{automation.frequency}</p>
              </div>
              <div>
                <p className="text-gray-400">Last Run</p>
                <p className="text-white font-medium">{automation.lastRun}</p>
              </div>
              <div>
                <p className="text-gray-400">Next Run</p>
                <p className="text-white font-medium">{automation.nextRun}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}