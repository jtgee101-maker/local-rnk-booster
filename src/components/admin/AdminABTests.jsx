import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminABTests() {
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['admin-abtests'],
    queryFn: () => base44.entities.ABTest.list('-created_date', 50),
    staleTime: 30000,
    gcTime: 300000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-abtests-events'],
    queryFn: () => base44.entities.ABTestEvent.list('-created_date', 10000),
    staleTime: 30000,
    gcTime: 300000,
  });

  const [stats, setStats] = useState({});

  useEffect(() => {
    const statsMap = {};
    tests.forEach(test => {
      const testEvents = events.filter(e => e.test_id === test.id);
      const variantStats = {};
      
      test.variants?.forEach(variant => {
        const variantEvents = testEvents.filter(e => e.variant_id === variant.id);
        const views = variantEvents.filter(e => e.event_type === 'view').length;
        const conversions = variantEvents.filter(e => e.event_type === 'conversion').length;
        const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(2) : 0;

        variantStats[variant.id] = { views, conversions, conversionRate };
      });

      statsMap[test.id] = variantStats;
    });
    setStats(statsMap);
  }, [tests, events]);

  if (isLoading) {
    return <div className="text-gray-400">Loading A/B tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Active Tests</h2>
        <Button className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black gap-2">
          <Plus className="w-4 h-4" />
          Create Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No A/B tests created yet</p>
          </CardContent>
        </Card>
      ) : (
        tests.map((test, idx) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white mb-2">{test.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[#c8ff00]">{test.page}</Badge>
                      <Badge variant="outline">{test.element}</Badge>
                      <Badge className={test.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p>Total Events: {events.filter(e => e.test_id === test.id).length}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {test.variants?.map(variant => {
                    const data = stats[test.id]?.[variant.id] || { views: 0, conversions: 0, conversionRate: 0 };
                    return (
                      <div key={variant.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <h4 className="font-medium text-white mb-3">{variant.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Views
                            </span>
                            <span className="text-white font-medium">{data.views}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Conversions
                            </span>
                            <span className="text-white font-medium">{data.conversions}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-700">
                            <span className="text-gray-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Conv. Rate
                            </span>
                            <span className="text-[#c8ff00] font-bold">{data.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}