import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, TrendingDown, Download, RefreshCw, Loader2,
  TrendingUp, Users, DollarSign, Clock, Target, BarChart3,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

export default function FunnelVisualization({ dateRange }) {
  const [funnelVersion, setFunnelVersion] = React.useState('v3');
  const [expandedStages, setExpandedStages] = React.useState({});
  const [compareMode, setCompareMode] = React.useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['funnel-analysis', funnelVersion, dateRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/funnelAnalysis', {
        funnel_version: funnelVersion,
        date_range: dateRange
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Comparison data for previous period
  const { data: comparisonData } = useQuery({
    queryKey: ['funnel-comparison', funnelVersion, dateRange],
    queryFn: async () => {
      if (!dateRange?.start || !compareMode) return null;
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const duration = end - start;
      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = new Date(end.getTime() - duration);
      
      const response = await base44.functions.invoke('analytics/funnelAnalysis', {
        funnel_version: funnelVersion,
        date_range: {
          start: prevStart.toISOString(),
          end: prevEnd.toISOString()
        }
      });
      return response.data;
    },
    enabled: compareMode && !!dateRange,
    staleTime: 5 * 60 * 1000
  });

  const toggleStageExpanded = (stageIndex) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageIndex]: !prev[stageIndex]
    }));
  };

  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Stage', 'Users', 'Conversion Rate', 'Dropoff Rate', 'Avg Time (s)'].join(','),
      ...data.stages.map(s => [
        s.stage,
        s.count,
        s.conversion_rate,
        s.dropoff_rate || 0,
        Math.round(s.avg_time_seconds || 0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-${funnelVersion}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (isLoading) {
    return (
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Analyzing funnel performance...</p>
            <p className="text-xs text-gray-500 mt-1">Processing conversion stages</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-gray-900/50">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Failed to load funnel data</p>
            <p className="text-xs text-gray-400 mt-1">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stages = data?.stages || [];
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  
  // Calculate insights
  const biggestDropoff = stages.reduce((max, stage) => 
    stage.dropoff_rate > (max?.dropoff_rate || 0) ? stage : max, null
  );
  
  const slowestStage = stages.reduce((max, stage) => 
    stage.avg_time_seconds > (max?.avg_time_seconds || 0) ? stage : max, null
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Conversion Funnel Analysis</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Overall Conversion: <span className="text-[#c8ff00] font-bold">{data?.overall_conversion_rate}%</span>
              </p>
            </div>
            <Select value={funnelVersion} onValueChange={setFunnelVersion}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v3">Quiz V3</SelectItem>
                <SelectItem value="v2">Quiz V2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Funnel Visualization */}
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const widthPercent = (stage.count / maxCount) * 100;
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{stage.stage}</span>
                      {stage.dropoff_rate > 50 && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{stage.count.toLocaleString()} users</span>
                      <span className="text-[#c8ff00] font-semibold">{stage.conversion_rate}%</span>
                    </div>
                  </div>
                  
                  {/* Funnel bar */}
                  <div 
                    className="h-12 rounded-lg flex items-center px-4 relative"
                    style={{
                      width: `${widthPercent}%`,
                      background: `linear-gradient(90deg, #c8ff00 0%, #a3e635 100%)`,
                      opacity: 1 - (idx * 0.15)
                    }}
                  >
                    <span className="text-black font-bold text-sm">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>

                  {/* Drop-off info */}
                  {stage.dropoff_from_previous > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                      <TrendingDown className="w-3 h-3" />
                      <span>
                        {stage.dropoff_from_previous.toLocaleString()} dropped off ({stage.dropoff_rate}%)
                      </span>
                      {stage.avg_time_seconds > 0 && (
                        <span className="text-gray-500 ml-2">
                          • Avg time: {Math.round(stage.avg_time_seconds)}s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Exit reasons */}
                  {stage.exit_reasons && stage.exit_reasons.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      <div className="text-xs text-gray-500 font-semibold">Top exit reasons:</div>
                      {stage.exit_reasons.slice(0, 3).map((reason, ridx) => (
                        <div key={ridx} className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {reason.reason}: {reason.percentage}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{data?.total_revenue?.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#c8ff00]">{data?.overall_conversion_rate}%</div>
              <div className="text-sm text-gray-400">Overall Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${data?.revenue_per_visitor?.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Revenue/Visitor</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}