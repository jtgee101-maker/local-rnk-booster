import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar } from 'lucide-react';

export default function CohortAnalysis() {
  const [metric, setMetric] = useState('conversion');
  const [period, setPeriod] = useState('weekly');

  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis', metric, period],
    queryFn: async () => {
      // In production, call backend cohort analysis function
      return {
        cohorts: [
          {
            cohort: 'Jan Week 1',
            size: 45,
            week0: 100,
            week1: 42,
            week2: 31,
            week3: 24,
            week4: 18
          },
          {
            cohort: 'Jan Week 2',
            size: 52,
            week0: 100,
            week1: 48,
            week2: 35,
            week3: 27,
            week4: null
          },
          {
            cohort: 'Jan Week 3',
            size: 38,
            week0: 100,
            week1: 45,
            week2: 32,
            week3: null,
            week4: null
          },
          {
            cohort: 'Jan Week 4',
            size: 61,
            week0: 100,
            week1: 51,
            week2: null,
            week3: null,
            week4: null
          }
        ],
        insights: [
          {
            title: 'Strong Early Retention',
            value: '48%',
            description: 'Week 1 retention is above industry average'
          },
          {
            title: 'Conversion Opportunity',
            value: '32%',
            description: 'Week 2 shows high drop-off potential for nurture'
          }
        ]
      };
    }
  });

  const getColorIntensity = (value) => {
    if (!value) return 'bg-gray-800';
    if (value >= 80) return 'bg-green-500/80';
    if (value >= 60) return 'bg-green-500/60';
    if (value >= 40) return 'bg-yellow-500/60';
    if (value >= 20) return 'bg-orange-500/60';
    return 'bg-red-500/60';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading cohort analysis...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Cohort Analysis</h3>
          <p className="text-sm text-gray-400">Track user behavior and retention over time</p>
        </div>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversion">Conversion Rate</SelectItem>
              <SelectItem value="retention">Retention Rate</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cohortData.insights.map((insight, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">{insight.title}</div>
                  <div className="text-2xl font-bold text-white mb-1">{insight.value}</div>
                  <div className="text-xs text-gray-500">{insight.description}</div>
                </div>
                <TrendingUp className="w-5 h-5 text-[#c8ff00]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-400">
            Cohort Retention Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Cohort</TableHead>
                <TableHead className="text-gray-400 text-center">Size</TableHead>
                <TableHead className="text-gray-400 text-center">Week 0</TableHead>
                <TableHead className="text-gray-400 text-center">Week 1</TableHead>
                <TableHead className="text-gray-400 text-center">Week 2</TableHead>
                <TableHead className="text-gray-400 text-center">Week 3</TableHead>
                <TableHead className="text-gray-400 text-center">Week 4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData.cohorts.map((cohort, i) => (
                <TableRow key={i} className="border-gray-700">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {cohort.cohort}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{cohort.size}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`${getColorIntensity(cohort.week0)} px-3 py-1 rounded text-white font-semibold`}>
                      {cohort.week0}%
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {cohort.week1 !== null ? (
                      <div className={`${getColorIntensity(cohort.week1)} px-3 py-1 rounded text-white font-semibold`}>
                        {cohort.week1}%
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cohort.week2 !== null ? (
                      <div className={`${getColorIntensity(cohort.week2)} px-3 py-1 rounded text-white font-semibold`}>
                        {cohort.week2}%
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cohort.week3 !== null ? (
                      <div className={`${getColorIntensity(cohort.week3)} px-3 py-1 rounded text-white font-semibold`}>
                        {cohort.week3}%
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cohort.week4 !== null ? (
                      <div className={`${getColorIntensity(cohort.week4)} px-3 py-1 rounded text-white font-semibold`}>
                        {cohort.week4}%
                      </div>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="text-gray-400">Color Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500/80 rounded"></div>
              <span className="text-gray-400">80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500/60 rounded"></div>
              <span className="text-gray-400">60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500/60 rounded"></div>
              <span className="text-gray-400">40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500/60 rounded"></div>
              <span className="text-gray-400">20-39%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500/60 rounded"></div>
              <span className="text-gray-400">&lt;20%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}