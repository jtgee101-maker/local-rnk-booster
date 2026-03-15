import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Download, RefreshCw, 
  Loader2, AlertTriangle, Users, BarChart3 
} from 'lucide-react';

export default function CohortTable() {
  const [cohortType, setCohortType] = React.useState('monthly');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['cohort-analysis', cohortType],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/cohortAnalysis', {
        cohort_type: cohortType,
        months: 6
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Cohort Analysis Report'],
      ['Type', cohortType],
      ['Generated', new Date().toISOString()],
      '',
      ['Cohort', 'Leads', 'Converted', 'Conv Rate', 'Revenue', 'Avg LTV', 'Avg Score'].join(','),
      ...(data.cohorts || []).map(c => [
        c.cohort || c.category || c.source,
        c.total_leads,
        c.converted_leads,
        (c.conversion_rate * 100).toFixed(2) + '%',
        c.total_revenue,
        c.avg_ltv.toFixed(2),
        c.avg_health_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-analysis-${cohortType}-${new Date().toISOString().split('T')[0]}.csv`;
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
            <p className="text-sm font-medium text-white">Analyzing cohort data...</p>
            <p className="text-xs text-gray-500 mt-1">Processing user cohorts</p>
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
            <p className="text-sm font-medium text-white">Failed to load cohort data</p>
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

  const cohorts = data?.cohorts || [];
  
  // Calculate insights
  const bestCohort = cohorts.reduce((best, c) => 
    c.conversion_rate > (best?.conversion_rate || 0) ? c : best, null
  );
  const worstCohort = cohorts.reduce((worst, c) => 
    c.conversion_rate < (worst?.conversion_rate || 1) ? c : worst, null
  );

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      {bestCohort && worstCohort && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-gray-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Best Performing Cohort</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Highest conversion rate
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  <span className="text-white font-medium">
                    {bestCohort.cohort || bestCohort.category || bestCohort.source}
                  </span>
                  {' '}with{' '}
                  <span className="font-semibold text-green-400">
                    {(bestCohort.conversion_rate * 100).toFixed(1)}%
                  </span> conversion
                </p>
                <p className="text-xs text-gray-500">
                  {bestCohort.converted_leads}/{bestCohort.total_leads} converted • ${bestCohort.total_revenue.toLocaleString()} revenue
                </p>
              </div>
            </CardContent>
          </Card>
          
          {worstCohort.conversion_rate < 0.1 && (
            <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-gray-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Underperforming Cohort</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Needs optimization
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="text-white font-medium">
                      {worstCohort.cohort || worstCohort.category || worstCohort.source}
                    </span>
                    {' '}only{' '}
                    <span className="font-semibold text-yellow-400">
                      {(worstCohort.conversion_rate * 100).toFixed(1)}%
                    </span> conversion
                  </p>
                  <p className="text-xs text-gray-500">
                    Review messaging and targeting for this segment
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      <Card className="border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#c8ff00]/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[#c8ff00]" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Cohort Analysis
                  <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/30">
                    {cohorts.length} cohorts
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Performance breakdown by {cohortType === 'monthly' ? 'month' : cohortType}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={cohortType} onValueChange={setCohortType}>
                <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">By Month</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="source">By Source</SelectItem>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">
                    {cohortType === 'monthly' ? 'Month' : cohortType === 'category' ? 'Category' : 'Source'}
                  </TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Leads</TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Converted</TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Conv Rate</TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Revenue</TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Avg LTV</TableHead>
                  <TableHead className="text-gray-400 text-right font-semibold">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((cohort, idx) => {
                  const convRate = cohort.conversion_rate * 100;
                  const prevCohort = idx > 0 ? cohorts[idx - 1] : null;
                  const convTrend = prevCohort 
                    ? convRate - (prevCohort.conversion_rate * 100)
                    : 0;

                  return (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center gap-2">
                          {cohort.cohort || cohort.category || cohort.source}
                          {cohort === bestCohort && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Best
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          {cohort.total_leads.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {cohort.converted_leads.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-semibold ${
                            convRate >= 15 ? 'text-green-400' :
                            convRate >= 10 ? 'text-[#c8ff00]' :
                            'text-yellow-400'
                          }`}>
                            {convRate.toFixed(1)}%
                          </span>
                          {cohortType === 'monthly' && prevCohort && (
                            <>
                              {convTrend > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                              {convTrend < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                              {convTrend === 0 && <Minus className="w-4 h-4 text-gray-500" />}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[#c8ff00] font-semibold">
                        ${cohort.total_revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-300 font-medium">
                        ${cohort.avg_ltv.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${
                          cohort.avg_health_score >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          cohort.avg_health_score >= 50 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {cohort.avg_health_score}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>

          {/* Retention Data for Monthly Cohorts */}
          {cohortType === 'monthly' && cohorts[0]?.retention && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h4 className="text-white font-semibold mb-4">Cohort Retention</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Month</TableHead>
                      <TableHead className="text-gray-400 text-center">Month 1</TableHead>
                      <TableHead className="text-gray-400 text-center">Month 2</TableHead>
                      <TableHead className="text-gray-400 text-center">Month 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohorts.map((cohort, idx) => (
                      <TableRow key={idx} className="border-gray-800">
                        <TableCell className="text-white font-medium">
                          {cohort.cohort}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-gray-300">
                            {cohort.retention?.month_1 
                              ? `${(cohort.retention.month_1.retention_rate * 100).toFixed(1)}%`
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-gray-300">
                            {cohort.retention?.month_2 
                              ? `${(cohort.retention.month_2.retention_rate * 100).toFixed(1)}%`
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-gray-300">
                            {cohort.retention?.month_3 
                              ? `${(cohort.retention.month_3.retention_rate * 100).toFixed(1)}%`
                              : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}