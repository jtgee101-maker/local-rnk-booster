import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function CohortTable() {
  const [cohortType, setCohortType] = React.useState('monthly');

  const { data, isLoading } = useQuery({
    queryKey: ['cohort-analysis', cohortType],
    queryFn: async () => {
      const response = await base44.functions.invoke('analytics/cohortAnalysis', {
        cohort_type: cohortType,
        months: 6
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  if (isLoading) {
    return <div className="text-center text-gray-400 py-8">Loading cohort data...</div>;
  }

  const cohorts = data?.cohorts || [];

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Cohort Analysis</CardTitle>
            <Select value={cohortType} onValueChange={setCohortType}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">By Month</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="source">By Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">
                    {cohortType === 'monthly' ? 'Month' : cohortType === 'category' ? 'Category' : 'Source'}
                  </TableHead>
                  <TableHead className="text-gray-400 text-right">Leads</TableHead>
                  <TableHead className="text-gray-400 text-right">Converted</TableHead>
                  <TableHead className="text-gray-400 text-right">Conv Rate</TableHead>
                  <TableHead className="text-gray-400 text-right">Revenue</TableHead>
                  <TableHead className="text-gray-400 text-right">Avg LTV</TableHead>
                  <TableHead className="text-gray-400 text-right">Avg Score</TableHead>
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
                    <TableRow key={idx} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="text-white font-medium">
                        {cohort.cohort || cohort.category || cohort.source}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {cohort.total_leads.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {cohort.converted_leads.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-white font-semibold">
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
                      <TableCell className="text-right text-gray-300">
                        ${cohort.avg_ltv.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded ${
                          cohort.avg_health_score >= 70 ? 'bg-green-500/20 text-green-400' :
                          cohort.avg_health_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {cohort.avg_health_score}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

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