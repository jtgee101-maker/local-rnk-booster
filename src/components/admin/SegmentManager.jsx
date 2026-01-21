import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, TrendingUp, Mail, Clock, Target, RefreshCw, 
  Zap, AlertCircle, Send, Lightbulb 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SegmentManager() {
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState(null);

  const { data: segments, isLoading, refetch } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await base44.entities.Segment.list('-member_count', 50);
      return response;
    },
    initialData: []
  });

  const { data: testSuggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['ab-test-suggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('segments/suggestABTests', {});
      return response.data;
    },
    staleTime: 30 * 60 * 1000
  });

  const refreshSegmentsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('segments/createSegments', {
        action: 'refresh_all'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    }
  });

  const optimizeSendTimesMutation = useMutation({
    mutationFn: async (segmentId) => {
      const response = await base44.functions.invoke('segments/optimizeSendTimes', {
        segment_id: segmentId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    }
  });

  const activeSegments = segments.filter(s => s.is_active);
  const totalMembers = activeSegments.reduce((sum, s) => sum + (s.member_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            Segmentation & Personalization Engine
          </h2>
          <p className="text-gray-400 mt-1">AI-powered audience targeting</p>
        </div>
        <Button 
          onClick={() => refreshSegmentsMutation.mutate()}
          disabled={refreshSegmentsMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshSegmentsMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Segments
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-700/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-300">Active Segments</div>
                <div className="text-3xl font-bold text-white">{activeSegments.length}</div>
              </div>
              <Target className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-700/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-300">Total Members</div>
                <div className="text-3xl font-bold text-white">{totalMembers}</div>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-green-700/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300">Avg Conv Rate</div>
                <div className="text-3xl font-bold text-white">
                  {Math.round(activeSegments.reduce((sum, s) => sum + (s.conversion_rate || 0), 0) / activeSegments.length) || 0}%
                </div>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-700/10 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-300">Test Ideas</div>
                <div className="text-3xl font-bold text-white">{testSuggestions?.suggestions?.length || 0}</div>
              </div>
              <Lightbulb className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="segments">Segments ({activeSegments.length})</TabsTrigger>
          <TabsTrigger value="suggestions">Test Suggestions ({testSuggestions?.suggestions?.length || 0})</TabsTrigger>
          <TabsTrigger value="send-times">Send Time Optimization</TabsTrigger>
        </TabsList>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSegments.map((segment) => (
              <Card key={segment.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">{segment.name}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">{segment.description}</p>
                    </div>
                    <Badge className="bg-purple-500">{segment.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-400">Members</div>
                        <div className="text-xl font-bold text-white">{segment.member_count}</div>
                      </div>
                      <div className="bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-400">Conv Rate</div>
                        <div className="text-xl font-bold text-green-400">{segment.conversion_rate || 0}%</div>
                      </div>
                      <div className="bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-400">Avg LTV</div>
                        <div className="text-xl font-bold text-[#c8ff00]">${segment.avg_ltv || 0}</div>
                      </div>
                    </div>

                    {/* Personalization Info */}
                    {segment.email_personalization && (
                      <div className="bg-gray-800 rounded p-3">
                        <div className="text-xs text-gray-400 mb-2">Email Personalization</div>
                        <div className="text-sm text-white space-y-1">
                          {segment.email_personalization.focus && (
                            <div>• Focus: {segment.email_personalization.focus}</div>
                          )}
                          {segment.email_personalization.cta_urgency && (
                            <div>• Urgency: {segment.email_personalization.cta_urgency}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Optimal Send Times */}
                    {segment.optimal_send_times?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400">Best times:</span>
                        <span className="text-white">{segment.optimal_send_times.join(', ')}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => optimizeSendTimesMutation.mutate(segment.id)}
                        disabled={optimizeSendTimesMutation.isPending}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Optimize Times
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-3 h-3 mr-1" />
                        Send Campaign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Test Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          {testSuggestions?.current_metrics && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Current Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Conversion Rate</div>
                    <div className="text-2xl font-bold text-white">
                      {testSuggestions.current_metrics.conversion_rate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Avg Order Value</div>
                    <div className="text-2xl font-bold text-white">
                      ${testSuggestions.current_metrics.avg_order_value}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email Open Rate</div>
                    <div className="text-2xl font-bold text-white">
                      {testSuggestions.current_metrics.email_open_rate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Active Tests</div>
                    <div className="text-2xl font-bold text-white">
                      {testSuggestions.current_metrics.active_tests}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {testSuggestions?.suggestions?.map((suggestion, idx) => (
              <Card key={idx} className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-semibold text-lg">{suggestion.test_name}</h3>
                          <Badge className={
                            suggestion.priority === 'high' ? 'bg-red-500' :
                            suggestion.priority === 'medium' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }>
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{suggestion.hypothesis}</p>
                      </div>
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>

                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-400 mb-2">Expected Impact</div>
                      <div className="text-green-400 font-semibold">{suggestion.expected_impact}</div>
                    </div>

                    {suggestion.variants && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Proposed Variants:</div>
                        <div className="space-y-2">
                          {suggestion.variants.map((variant, vidx) => (
                            <div key={vidx} className="bg-gray-800 rounded p-3 text-sm">
                              <div className="text-white font-medium">{variant.name}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                {JSON.stringify(variant.content, null, 2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full">
                      <Target className="w-4 h-4 mr-2" />
                      Create This Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Send Times Tab */}
        <TabsContent value="send-times" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Optimal Send Times by Segment</CardTitle>
              <p className="text-sm text-gray-400">ML-predicted best times for maximum engagement</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSegments.filter(s => s.optimal_send_times?.length > 0).map((segment) => (
                  <div key={segment.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{segment.name}</div>
                      <div className="text-sm text-gray-400">{segment.member_count} members</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {segment.optimal_send_times.map((time, idx) => (
                          <Badge key={idx} className="bg-blue-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => optimizeSendTimesMutation.mutate(segment.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recalculate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}