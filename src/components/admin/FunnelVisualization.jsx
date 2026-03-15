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
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 1000
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
      {/* Key Insights */}
      {(biggestDropoff || slowestStage) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {biggestDropoff && biggestDropoff.dropoff_rate > 30 && (
            <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 to-gray-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Critical Dropoff Alert</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      High abandonment rate detected
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-red-400">{biggestDropoff.dropoff_rate}%</span> of users drop off at{' '}
                    <span className="text-white font-medium">{biggestDropoff.stage}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {biggestDropoff.dropoff_from_previous?.toLocaleString()} users lost at this stage
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {slowestStage && slowestStage.avg_time_seconds > 60 && (
            <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-gray-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Slow Stage Detected</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Users spending significant time here
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    Average time at <span className="text-white font-medium">{slowestStage.stage}</span>:{' '}
                    <span className="font-semibold text-yellow-400">{Math.round(slowestStage.avg_time_seconds)}s</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Consider simplifying or adding progress indicators
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Main Funnel Card */}
      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    Conversion Funnel Analysis
                    <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/30">
                      {stages.length} stages
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Overall Conversion: <span className="text-[#c8ff00] font-bold">{data?.overall_conversion_rate}%</span>
                    {comparisonData && (
                      <span className="ml-2 text-xs">
                        {data.overall_conversion_rate > comparisonData.overall_conversion_rate ? (
                          <span className="text-green-400">
                            ↑ {(data.overall_conversion_rate - comparisonData.overall_conversion_rate).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-red-400">
                            ↓ {(comparisonData.overall_conversion_rate - data.overall_conversion_rate).toFixed(1)}%
                          </span>
                        )}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setCompareMode(!compareMode)}
                variant="outline"
                size="sm"
                className={`gap-2 border-gray-700 ${compareMode ? 'bg-[#c8ff00]/10 border-[#c8ff00]/30 text-[#c8ff00]' : 'hover:border-[#c8ff00] hover:text-[#c8ff00]'}`}
              >
                <TrendingUp className="w-4 h-4" />
                {compareMode ? 'Comparing' : 'Compare'}
              </Button>
              <Select value={funnelVersion} onValueChange={setFunnelVersion}>
                <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v3">Quiz V3</SelectItem>
                  <SelectItem value="v2">Quiz V2</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => refetch()}
                variant="ghost"
                size="sm"
                disabled={isRefetching}
                className="gap-2 text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="gap-2 border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Funnel Visualization */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {stages.map((stage, idx) => {
                const widthPercent = (stage.count / maxCount) * 100;
                const isExpanded = expandedStages[idx];
                const prevStage = comparisonData?.stages?.[idx];
                const countChange = prevStage ? stage.count - prevStage.count : null;
                const rateChange = prevStage ? stage.conversion_rate - prevStage.conversion_rate : null;
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gray-700/50 text-gray-200 border-gray-600">
                          Step {idx + 1}
                        </Badge>
                        <span className="text-sm font-semibold text-white">{stage.stage}</span>
                        {stage.dropoff_rate > 50 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            High Dropoff
                          </Badge>
                        )}
                        {stage.avg_time_seconds > 60 && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
                            <Clock className="w-3 h-3" />
                            Slow
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="text-gray-300 font-medium">{stage.count.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">users</div>
                            {countChange !== null && (
                              <div className={`text-xs ${countChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {countChange > 0 ? '↑' : '↓'} {Math.abs(countChange).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[#c8ff00] font-bold">{stage.conversion_rate}%</div>
                            <div className="text-xs text-gray-500">conversion</div>
                            {rateChange !== null && (
                              <div className={`text-xs ${rateChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {rateChange > 0 ? '↑' : '↓'} {Math.abs(rateChange).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStageExpanded(idx)}
                          className="text-gray-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Funnel Bar with Gradient */}
                    <motion.div 
                      className="h-14 rounded-xl flex items-center px-5 relative overflow-hidden shadow-lg cursor-pointer"
                      style={{
                        width: `${Math.max(widthPercent, 10)}%`,
                        background: stage.dropoff_rate > 50 
                          ? `linear-gradient(90deg, #ef4444 0%, #f97316 100%)`
                          : `linear-gradient(90deg, #c8ff00 0%, #84cc16 ${widthPercent}%, #65a30d 100%)`,
                        opacity: 1 - (idx * 0.12)
                      }}
                      whileHover={{ scale: 1.02, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      onClick={() => toggleStageExpanded(idx)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-black font-bold">
                          {stage.count.toLocaleString()}
                        </span>
                        <span className="text-black/70 font-semibold text-sm">
                          {stage.conversion_rate}%
                        </span>
                      </div>
                      
                      {/* Animated shimmer effect */}
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 3s infinite'
                        }}
                      />
                    </motion.div>

                    {/* Dropoff Info */}
                    {stage.dropoff_from_previous > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-red-500/10 rounded">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-red-400 font-medium">
                                  {stage.dropoff_from_previous.toLocaleString()} users dropped off
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {stage.dropoff_rate}% abandonment rate at this stage
                                </p>
                              </div>
                              {stage.avg_time_seconds > 0 && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs font-medium">
                                      {Math.round(stage.avg_time_seconds)}s avg
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-3"
                        >
                          {/* Stage Metrics */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-gray-400">Entry</span>
                              </div>
                              <p className="text-lg font-bold text-white">{stage.count.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-3 h-3 text-[#c8ff00]" />
                                <span className="text-xs text-gray-400">Rate</span>
                              </div>
                              <p className="text-lg font-bold text-[#c8ff00]">{stage.conversion_rate}%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-gray-400">Time</span>
                              </div>
                              <p className="text-lg font-bold text-white">{Math.round(stage.avg_time_seconds || 0)}s</p>
                            </div>
                          </div>

                          {/* Exit Reasons */}
                          {stage.exit_reasons && stage.exit_reasons.length > 0 && (
                            <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-semibold text-white">Top Exit Reasons</span>
                              </div>
                              <div className="space-y-2">
                                {stage.exit_reasons.slice(0, 5).map((reason, ridx) => (
                                  <div key={ridx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                      <span className="text-sm text-gray-300">{reason.reason}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                                        {reason.percentage}%
                                      </Badge>
                                      {reason.count && (
                                        <span className="text-xs text-gray-500">
                                          ({reason.count.toLocaleString()})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Enhanced Summary Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-700"
          >
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-gray-800/50 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${data?.total_revenue?.toLocaleString() || '0'}
              </div>
              {comparisonData && (
                <div className={`text-xs mt-1 ${data.total_revenue > comparisonData.total_revenue ? 'text-green-400' : 'text-red-400'}`}>
                  {data.total_revenue > comparisonData.total_revenue ? '↑' : '↓'} $
                  {Math.abs(data.total_revenue - comparisonData.total_revenue).toLocaleString()}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-[#c8ff00]/10 to-gray-800/50 border border-[#c8ff00]/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#c8ff00]" />
                <span className="text-xs text-gray-400">Overall Conversion</span>
              </div>
              <div className="text-2xl font-bold text-[#c8ff00]">
                {data?.overall_conversion_rate || 0}%
              </div>
              {comparisonData && (
                <div className={`text-xs mt-1 ${data.overall_conversion_rate > comparisonData.overall_conversion_rate ? 'text-green-400' : 'text-red-400'}`}>
                  {data.overall_conversion_rate > comparisonData.overall_conversion_rate ? '↑' : '↓'} 
                  {Math.abs(data.overall_conversion_rate - comparisonData.overall_conversion_rate).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-gray-800/50 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Revenue/Visitor</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${data?.revenue_per_visitor?.toFixed(2) || '0.00'}
              </div>
              {comparisonData && (
                <div className={`text-xs mt-1 ${data.revenue_per_visitor > comparisonData.revenue_per_visitor ? 'text-green-400' : 'text-red-400'}`}>
                  {data.revenue_per_visitor > comparisonData.revenue_per_visitor ? '↑' : '↓'} $
                  {Math.abs(data.revenue_per_visitor - comparisonData.revenue_per_visitor).toFixed(2)}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-gray-800/50 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Total Visitors</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {stages[0]?.count?.toLocaleString() || '0'}
              </div>
              {comparisonData?.stages?.[0] && (
                <div className={`text-xs mt-1 ${stages[0].count > comparisonData.stages[0].count ? 'text-green-400' : 'text-red-400'}`}>
                  {stages[0].count > comparisonData.stages[0].count ? '↑' : '↓'} 
                  {Math.abs(stages[0].count - comparisonData.stages[0].count).toLocaleString()}
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance Recommendations */}
          {(biggestDropoff?.dropoff_rate > 40 || slowestStage?.avg_time_seconds > 90) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Optimization Recommendations</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {biggestDropoff?.dropoff_rate > 40 && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          Focus on improving <span className="text-white font-medium">{biggestDropoff.stage}</span> - 
                          {biggestDropoff.dropoff_rate}% dropoff indicates friction. Consider A/B testing or simplifying the step.
                        </span>
                      </li>
                    )}
                    {slowestStage?.avg_time_seconds > 90 && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          Reduce time on <span className="text-white font-medium">{slowestStage.stage}</span> - 
                          Users spending {Math.round(slowestStage.avg_time_seconds)}s may indicate confusion or complexity.
                        </span>
                      </li>
                    )}
                    {data?.overall_conversion_rate < 10 && (
                      <li className="flex items-start gap-2">
                        <span className="text-[#c8ff00] mt-0.5">•</span>
                        <span>
                          Overall conversion is below 10% - Review value proposition and urgency signals throughout the funnel.
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}