import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { LeadScoringEngine } from '@/components/analytics/LeadScoringEngine';

export default function LeadScoringDashboard() {
  const [leads, setLeads] = useState([]);
  const [scoredLeads, setScoredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const allLeads = await base44.entities.Lead.list('-created_date', 50);
      setLeads(allLeads);
      await scoreAllLeads(allLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const scoreAllLeads = async (leadsToScore) => {
    setScoring(true);
    try {
      const scored = await Promise.all(
        leadsToScore.map(async (lead) => {
          const scoreData = await LeadScoringEngine.calculateScore(lead.id);
          return { ...lead, ...scoreData };
        })
      );
      setScoredLeads(scored.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Scoring error:', error);
    } finally {
      setScoring(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'B': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'C': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c8ff00]" />
            Lead Scoring Dashboard
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered lead quality scoring (0-100)
          </p>
        </div>
        <Button
          onClick={() => scoreAllLeads(leads)}
          disabled={scoring}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${scoring ? 'animate-spin' : ''}`} />
          {scoring ? 'Scoring...' : 'Refresh Scores'}
        </Button>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['A', 'B', 'C', 'D'].map(grade => {
          const count = scoredLeads.filter(l => l.grade === grade).length;
          return (
            <Card key={grade} className={`bg-gray-800/50 border-gray-700 ${getGradeColor(grade)}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Grade {grade}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{count}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {grade === 'A' && 'Hot leads'}
                  {grade === 'B' && 'Warm leads'}
                  {grade === 'C' && 'Cold leads'}
                  {grade === 'D' && 'Low priority'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Leads */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Scored Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scoredLeads.slice(0, 10).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full font-bold text-sm border ${getGradeColor(lead.grade)}`}>
                      {lead.grade}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{lead.business_name || lead.email}</div>
                      <div className="text-sm text-gray-400">{lead.email}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {lead.recommendation}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#c8ff00]">{lead.score}</div>
                  <div className="text-xs text-gray-400">/ 100</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Factors (for top lead) */}
      {scoredLeads.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Scoring Factors - {scoredLeads[0].business_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scoredLeads[0].factors?.map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-[#c8ff00] rounded-full" />
                  <span className="text-gray-300">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}