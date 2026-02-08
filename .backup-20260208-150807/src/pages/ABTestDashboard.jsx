import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, CheckCircle, BarChart3, Plus, Pause, Play, Trash2 } from 'lucide-react';
import ABTestCreator from '@/components/abtest/ABTestCreator';

export default function ABTestDashboard() {
  const [tests, setTests] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [showCreator, setShowCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, eventsData] = await Promise.all([
        base44.entities.ABTest.list('-created_date', 100),
        base44.entities.ABTestEvent.list('-created_date', 10000)
      ]);

      setTests(testsData);
      setEvents(eventsData);
      calculateStats(testsData, eventsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const calculateStats = (testsData, eventsData) => {
    const statsMap = {};

    testsData.forEach(test => {
      const testEvents = eventsData.filter(e => e.test_id === test.id);
      
      const variantStats = {};
      test.variants.forEach(variant => {
        const variantEvents = testEvents.filter(e => e.variant_id === variant.id);
        const views = variantEvents.filter(e => e.event_type === 'view').length;
        const conversions = variantEvents.filter(e => e.event_type === 'conversion').length;
        const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(2) : 0;
        const totalValue = variantEvents
          .filter(e => e.event_type === 'conversion')
          .reduce((sum, e) => sum + (e.conversion_value || 0), 0);

        variantStats[variant.id] = {
          views,
          conversions,
          conversionRate: parseFloat(conversionRate),
          totalValue,
          avgValue: conversions > 0 ? (totalValue / conversions).toFixed(2) : 0
        };
      });

      statsMap[test.id] = variantStats;
    });

    setStats(statsMap);
  };

  const toggleTestStatus = async (test) => {
    const newStatus = test.status === 'active' ? 'paused' : 'active';
    await base44.entities.ABTest.update(test.id, { status: newStatus });
    loadData();
  };

  const deleteTest = async (testId) => {
    if (!confirm('Delete this test? This will also delete all associated events.')) return;
    
    await base44.entities.ABTest.delete(testId);
    loadData();
  };

  const getWinningVariant = (testId) => {
    const testStats = stats[testId];
    if (!testStats) return null;

    let winner = null;
    let highestRate = -1;

    Object.entries(testStats).forEach(([variantId, data]) => {
      if (data.conversionRate > highestRate && data.views >= 30) {
        highestRate = data.conversionRate;
        winner = variantId;
      }
    });

    return winner;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">A/B Test Dashboard</h1>
            <p className="text-gray-400">Monitor and optimize your conversion funnel</p>
          </div>
          <Button
            onClick={() => setShowCreator(true)}
            className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>

        {/* Tests List */}
        <div className="space-y-6">
          {tests.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No A/B tests yet</p>
                <Button
                  onClick={() => setShowCreator(true)}
                  className="bg-[#c8ff00] hover:bg-[#d4ff33] text-black"
                >
                  Create Your First Test
                </Button>
              </CardContent>
            </Card>
          ) : (
            tests.map(test => {
              const testStats = stats[test.id] || {};
              const winningVariantId = getWinningVariant(test.id);

              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white mb-2">{test.name}</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[#c8ff00] border-[#c8ff00]">
                              {test.page}
                            </Badge>
                            <Badge variant="outline">{test.element}</Badge>
                            <Badge 
                              className={
                                test.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              }
                            >
                              {test.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleTestStatus(test)}
                            className="text-gray-400 hover:text-white"
                          >
                            {test.status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTest(test.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {test.variants.map(variant => {
                          const variantData = testStats[variant.id] || {
                            views: 0,
                            conversions: 0,
                            conversionRate: 0,
                            totalValue: 0
                          };
                          const isWinner = variant.id === winningVariantId;

                          return (
                            <div
                              key={variant.id}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                isWinner
                                  ? 'border-[#c8ff00] bg-[#c8ff00]/5'
                                  : 'border-gray-700 bg-gray-900/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-white">{variant.name}</h4>
                                {isWinner && (
                                  <Badge className="bg-[#c8ff00] text-black">Winner</Badge>
                                )}
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Views
                                  </span>
                                  <span className="text-white font-semibold">
                                    {variantData.views}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Conversions
                                  </span>
                                  <span className="text-white font-semibold">
                                    {variantData.conversions}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Conv. Rate
                                  </span>
                                  <span className={`font-bold ${
                                    isWinner ? 'text-[#c8ff00]' : 'text-white'
                                  }`}>
                                    {variantData.conversionRate}%
                                  </span>
                                </div>
                                {variantData.totalValue > 0 && (
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                                    <span className="text-gray-400">Revenue</span>
                                    <span className="text-green-400 font-semibold">
                                      ${variantData.totalValue.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Creator Modal */}
      {showCreator && (
        <ABTestCreator
          onClose={() => setShowCreator(false)}
          onCreated={() => {
            setShowCreator(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}