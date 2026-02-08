import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, Target,
  RefreshCw, Search, Sparkles,
  Mail, Phone, Award, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadScoringDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-with-scores'],
    queryFn: async () => {
      const allLeads = await base44.entities.Lead.list('-created_date', 100);
      return allLeads.map(lead => ({
        ...lead,
        lead_score: lead.lead_score || null,
        lead_grade: lead.lead_grade || null
      }));
    }
  });

  const scoreMutation = useMutation({
    mutationFn: async (leadId) => {
      const result = await base44.functions.invoke('scoring/calculateLeadScore', { lead_id: leadId });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-with-scores'] });
      toast.success('Lead scored successfully!');
    },
    onError: (error) => {
      toast.error(`Scoring failed: ${error.message}`);
    }
  });

  const scoreAllMutation = useMutation({
    mutationFn: async () => {
      const unscoredLeadIds = leads.filter(l => !l.lead_score).map(l => l.id);
      const result = await base44.functions.invoke('scoring/bulkScoreLeads', { 
        lead_ids: unscoredLeadIds.slice(0, 50)
      });
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads-with-scores'] });
      toast.success(`Scored ${data.processed} leads successfully!`);
    },
    onError: (error) => {
      toast.error(`Bulk scoring failed: ${error.message}`);
    }
  });

  const scoresCache = React.useMemo(() => {
    const cache = {};
    leads.forEach(lead => {
      if (lead.lead_score !== null && lead.lead_score !== undefined) {
        cache[lead.id] = {
          score: lead.lead_score,
          grade: lead.lead_grade || 'N/A'
        };
      }
    });
    return cache;
  }, [leads]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const scoreData = scoresCache[lead.id];
    const matchesGrade = filterGrade === 'all' || 
      (scoreData && scoreData.grade?.startsWith(filterGrade));
    
    return matchesSearch && matchesGrade;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const scoreA = scoresCache[a.id]?.score || 0;
    const scoreB = scoresCache[b.id]?.score || 0;
    
    if (sortBy === 'score_desc') return scoreB - scoreA;
    if (sortBy === 'score_asc') return scoreA - scoreB;
    if (sortBy === 'recent') return new Date(b.created_date) - new Date(a.created_date);
    return 0;
  });

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-500';
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const stats = {
    total: leads.length,
    scored: Object.keys(scoresCache).length,
    avgScore: Object.values(scoresCache).reduce((sum, s) => sum + (s.score || 0), 0) / 
              Math.max(1, Object.keys(scoresCache).length),
    hotLeads: Object.values(scoresCache).filter(s => (s.score || 0) >= 80).length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scored</p>
                <p className="text-2xl font-bold">{stats.scored}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgScore)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hot Leads</p>
                <p className="text-2xl font-bold">{stats.hotLeads}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
                <option value="F">Grade F</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="score_desc">Score: High to Low</option>
                <option value="score_asc">Score: Low to High</option>
                <option value="recent">Most Recent</option>
              </select>

              <Button
                onClick={() => scoreAllMutation.mutate()}
                disabled={scoreAllMutation.isPending}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {scoreAllMutation.isPending ? 'Scoring...' : 'Score All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-3">
        {sortedLeads.map(lead => {
          const scoreData = scoresCache[lead.id];
          
          return (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{lead.business_name || 'Unknown Business'}</h3>
                      {scoreData && (
                        <Badge className={`${getGradeColor(scoreData.grade)} text-white`}>
                          {scoreData.grade}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm text-gray-600">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </div>
                      )}
                    </div>

                    {scoreData && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Score:</span>
                          <Progress value={scoreData.score} className="flex-1 max-w-xs" />
                          <span className="text-lg font-bold">{scoreData.score}/100</span>
                        </div>

                        {scoreData.recommendation && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="font-semibold text-blue-900">
                                  Recommended: {scoreData.recommendation.name}
                                </p>
                                <p className="text-sm text-blue-700">
                                  {scoreData.recommendation.reason}
                                </p>
                                <Badge className="mt-1 bg-blue-200 text-blue-800">
                                  {scoreData.recommendation.confidence} confidence
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {scoreData.breakdown && (
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-semibold">{scoreData.breakdown.health_score}</div>
                              <div className="text-gray-500">Health</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{scoreData.breakdown.engagement}</div>
                              <div className="text-gray-500">Engage</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{scoreData.breakdown.completion}</div>
                              <div className="text-gray-500">Complete</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{scoreData.breakdown.business_quality}</div>
                              <div className="text-gray-500">Quality</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{scoreData.breakdown.traffic_quality}</div>
                              <div className="text-gray-500">Traffic</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!scoreData && (
                      <Button
                        onClick={() => scoreMutation.mutate(lead.id)}
                        disabled={scoreMutation.isPending}
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Score
                      </Button>
                    )}
                    {scoreData && (
                      <Button
                        onClick={() => scoreMutation.mutate(lead.id)}
                        disabled={scoreMutation.isPending}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Rescore
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedLeads.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No leads found matching your filters
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}