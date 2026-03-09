import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, BarChart3, TrendingUp, Users, ArrowUpDown, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

const TIME_RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d',  hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
];

const SORT_OPTIONS = [
  { key: 'views',           label: 'Most Views' },
  { key: 'leads',          label: 'Most Leads' },
  { key: 'conversion_rate', label: 'Best Conversion' },
];

export default function ProgrammaticAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [sortBy, setSortBy]     = useState('views');

  const cutoff = useMemo(() => {
    const hours = TIME_RANGES.find(r => r.label === timeRange)?.hours || 168;
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  }, [timeRange]);

  // Pull all relevant ConversionEvents in one batch (last 30d cap keeps it fast)
  const { data: events = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['programmatic-events', timeRange],
    queryFn: () => base44.entities.ConversionEvent.filter(
      { funnel_version: 'geenius' },
      '-created_date',
      2000
    ),
    staleTime: 3 * 60 * 1000,
  });

  // Filter by cutoff then aggregate
  const rows = useMemo(() => {
    const filtered = events.filter(e => e.created_date >= cutoff);

    const map = {}; // key = slug

    filtered.forEach(e => {
      const props = e.properties || {};
      const name  = e.event_name;

      // Determine slug
      let slug = props.landing_slug;
      if (!slug) {
        // quiz_started may carry city + industry from CityNicheLanding CTA
        if (props.city && props.industry) {
          slug = `${props.city}-${props.industry}`.toLowerCase();
        }
      }
      if (!slug) return; // ignore non-programmatic events

      const city     = props.city     || slug.split('-')[0] || '—';
      const industry = props.industry || slug.split('-').slice(1).join('-') || '—';

      if (!map[slug]) {
        map[slug] = { slug, city, industry, views: 0, quiz_starts: 0, leads: 0, bridge_clicks: 0 };
      }

      if (name === 'programmatic_landing_view') map[slug].views++;
      else if (name === 'quiz_started')         map[slug].quiz_starts++;
      else if (name === 'quiz_completed')       map[slug].leads++;
      else if (name === 'pathway_selected' || name === 'bridge_pathway_clicked') map[slug].bridge_clicks++;
    });

    return Object.values(map).map(r => ({
      ...r,
      conversion_rate: r.views > 0 ? +((r.leads / r.views) * 100).toFixed(1) : 0,
    }));
  }, [events, cutoff]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortBy === 'conversion_rate') return b.conversion_rate - a.conversion_rate;
      if (sortBy === 'leads')           return b.leads - a.leads;
      return b.views - a.views;
    });
  }, [rows, sortBy]);

  // Summary stats
  const totals = useMemo(() => rows.reduce((acc, r) => ({
    views:        acc.views        + r.views,
    quiz_starts:  acc.quiz_starts  + r.quiz_starts,
    leads:        acc.leads        + r.leads,
    bridge_clicks: acc.bridge_clicks + r.bridge_clicks,
  }), { views: 0, quiz_starts: 0, leads: 0, bridge_clicks: 0 }), [rows]);

  const overallCvr = totals.views > 0 ? ((totals.leads / totals.views) * 100).toFixed(1) : '0.0';

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-[#c8ff00]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-24 text-red-400">
      <AlertCircle className="w-8 h-8" />
      <p>Failed to load events</p>
      <Button onClick={() => refetch()} size="sm" variant="outline">Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#c8ff00]" />
            Programmatic Pages Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} active slugs · real ConversionEvent data</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {TIME_RANGES.map(r => (
            <Button
              key={r.label}
              size="sm"
              onClick={() => setTimeRange(r.label)}
              className={timeRange === r.label
                ? 'bg-[#c8ff00] text-black font-bold hover:bg-[#d4ff33]'
                : 'border-gray-700 hover:border-[#c8ff00] hover:text-[#c8ff00]'}
              variant={timeRange === r.label ? 'default' : 'outline'}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}
            className="border-gray-700 hover:border-[#c8ff00] gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Page Views',    value: totals.views,         icon: BarChart3,  color: 'text-blue-400' },
          { label: 'Quiz Starts',   value: totals.quiz_starts,   icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Leads Created', value: totals.leads,         icon: Users,      color: 'text-green-400' },
          { label: 'Bridge Clicks', value: totals.bridge_clicks, icon: ArrowUpDown,color: 'text-orange-400' },
          { label: 'Overall CVR',   value: `${overallCvr}%`,     icon: TrendingUp, color: 'text-[#c8ff00]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-gray-900/60 border-gray-800">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
                </div>
                <Icon className="w-7 h-7 text-gray-700" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sort + Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-white text-base">Page Performance by Slug</CardTitle>
          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <Button
                key={opt.key}
                size="sm"
                variant={sortBy === opt.key ? 'default' : 'outline'}
                onClick={() => setSortBy(opt.key)}
                className={sortBy === opt.key
                  ? 'bg-[#c8ff00] text-black font-bold text-xs h-7 hover:bg-[#d4ff33]'
                  : 'border-gray-700 text-xs h-7 hover:border-[#c8ff00]'}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No programmatic page events in this time range.</p>
              <p className="text-xs mt-2">Visit a CityNicheLanding page to generate data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Slug</th>
                    <th className="px-4 py-3 text-left">City</th>
                    <th className="px-4 py-3 text-left">Industry</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Quiz Starts</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Bridge</th>
                    <th className="px-4 py-3 text-right">CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const cvr = row.conversion_rate;
                    const cvrColor = cvr >= 10 ? 'text-green-400' : cvr >= 5 ? 'text-yellow-400' : 'text-gray-400';
                    return (
                      <tr key={row.slug} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors ${i === 0 ? 'bg-[#c8ff00]/5' : ''}`}>
                        <td className="px-5 py-3 font-mono text-[#c8ff00] text-xs">{row.slug}</td>
                        <td className="px-4 py-3 text-white capitalize">{row.city}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-gray-800 text-gray-300 border-gray-700 text-xs capitalize">{row.industry}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-semibold">{row.views}</td>
                        <td className="px-4 py-3 text-right text-purple-300">{row.quiz_starts}</td>
                        <td className="px-4 py-3 text-right text-green-400 font-semibold">{row.leads}</td>
                        <td className="px-4 py-3 text-right text-orange-300">{row.bridge_clicks}</td>
                        <td className={`px-4 py-3 text-right font-bold ${cvrColor}`}>{cvr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}