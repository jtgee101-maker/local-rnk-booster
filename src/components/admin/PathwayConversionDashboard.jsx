import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Crown, Wrench, GraduationCap, TrendingUp, TrendingDown, DollarSign, Users, MousePointerClick, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PATHWAYS = [
  { key: 'grant', label: 'Gov Tech Grant', icon: Crown,         color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'dfy',   label: 'Done For You',   icon: Wrench,        color: '#3b82f6', bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  { key: 'diy',   label: 'DIY License',    icon: GraduationCap, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
];

function StatBox({ label, value, sub, color }) {
  return (
    <div className="bg-gray-900/60 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function FunnelBar({ stage, count, dropOffPct, maxCount }) {
  const width = maxCount > 0 ? Math.max(4, Math.round((count / maxCount) * 100)) : 4;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-32 text-right">
        <span className="text-xs text-gray-400 truncate block">{stage.label}</span>
      </div>
      <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#c8ff00]/60 to-[#c8ff00] rounded transition-all duration-500 flex items-center px-2"
          style={{ width: `${width}%` }}
        >
          <span className="text-xs font-bold text-black whitespace-nowrap">{count.toLocaleString()}</span>
        </div>
      </div>
      {dropOffPct > 0 && (
        <div className="w-16 text-right">
          <span className="text-xs text-red-400">-{dropOffPct}%</span>
        </div>
      )}
    </div>
  );
}

export default function PathwayConversionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVariants, setExpandedVariants] = useState({});

  const load = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('admin/getPathwayAnalytics', {});
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { globalFunnel, pathwayStats, totalRevenue } = data;
  const maxCount = globalFunnel?.[0]?.count || 1;

  // Build bar chart data for comparison
  const comparisonChart = PATHWAYS.map(p => ({
    name: p.label,
    Leads: pathwayStats?.[p.key]?.totalLeads || 0,
    Converted: pathwayStats?.[p.key]?.convertedLeads || 0,
    AOV: parseFloat(pathwayStats?.[p.key]?.aov || 0),
    color: p.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">Pathway Conversion Analytics</h2>
        <button onClick={load} className="text-xs text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Global Total Revenue */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-[#c8ff00]" />
          <span className="text-sm text-gray-400">Total Pathway Revenue</span>
        </div>
        <p className="text-3xl font-black text-[#c8ff00]">${Number(totalRevenue).toLocaleString()}</p>
      </div>

      {/* Per-Pathway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PATHWAYS.map(({ key, label, icon: Icon, color, bg, border }) => {
          const s = pathwayStats?.[key];
          if (!s) return null;
          const expanded = expandedVariants[key];
          return (
            <div key={key} className={`${bg} ${border} border rounded-xl p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-white text-sm font-bold">{label}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color }}>{s.mom} MoM</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatBox label="Clicks"      value={s.totalClicks}       color={color} />
                <StatBox label="Conv Rate"   value={s.convRate}          color={color} />
                <StatBox label="AOV"         value={`$${s.aov}`}         color={color} />
                <StatBox label="Revenue"     value={`$${Number(s.revenue).toLocaleString()}`} color={color} />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-white/10">
                <span>{s.totalLeads} leads → {s.convertedLeads} converted</span>
                <span className="text-gray-300">{s.clickThroughRate} CTR</span>
              </div>

              {/* A/B Variants */}
              {s.variants?.length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    onClick={() => setExpandedVariants(prev => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    A/B Variants ({s.variants.length})
                  </button>
                  {expanded && (
                    <div className="mt-2 space-y-1">
                      {s.variants.map(v => (
                        <div key={v.name} className="flex items-center justify-between text-xs bg-black/20 rounded px-2 py-1">
                          <span className="text-gray-300">{v.name}</span>
                          <span className="text-gray-400">{v.clicks} clicks</span>
                          <span style={{ color }}>{v.convRate}% conv</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Funnel Drop-off */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-[#c8ff00]" /> Global Funnel Drop-off
        </h3>
        <div className="space-y-2">
          {globalFunnel?.map((stage) => (
            <FunnelBar key={stage.key} stage={stage} count={stage.count} dropOffPct={stage.dropOffPct} maxCount={maxCount} />
          ))}
        </div>
      </div>

      {/* Conversion Comparison Bar Chart */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#c8ff00]" /> Pathway Comparison — Leads vs Conversions
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={comparisonChart} barGap={4}>
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontSize: 12 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="Leads" radius={[4,4,0,0]}>
              {comparisonChart.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.4} />
              ))}
            </Bar>
            <Bar dataKey="Converted" radius={[4,4,0,0]}>
              {comparisonChart.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-600 text-center mt-2">Light = Total Leads · Dark = Converted</p>
      </div>
    </div>
  );
}