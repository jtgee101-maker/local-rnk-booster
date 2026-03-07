import React from 'react';
import { Crown, Wrench, GraduationCap, MousePointerClick, Eye } from 'lucide-react';

const PATHWAYS = [
  { key: 'grant', label: 'Gov Tech Grant', icon: Crown,       color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'dfy',   label: 'Done For You',   icon: Wrench,      color: '#3b82f6', bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  { key: 'diy',   label: 'DIY License',    icon: GraduationCap, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
];

export default function BridgePathwaySplit({ bridge }) {
  if (!bridge) return null;

  const { totalViews, totalClicks, ctr, pathways } = bridge;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Bridge Pathway Split</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{totalViews} views</span>
          <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{totalClicks} clicks</span>
          <span className="text-[#c8ff00] font-semibold">{ctr} CTR</span>
        </div>
      </div>

      <div className="space-y-3">
        {PATHWAYS.map(({ key, label, icon: Icon, color, bg, border }) => {
          const data = pathways?.[key] || { total: 0, thisMonth: 0, pct: '0' };
          const pct = parseFloat(data.pct) || 0;
          return (
            <div key={key} className={`${bg} ${border} border rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-white text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{data.thisMonth} this mo</span>
                  <span className="font-bold text-white">{data.total} total</span>
                  <span className="font-bold" style={{ color }}>{data.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalClicks === 0 && (
        <p className="text-xs text-gray-600 text-center pt-1">No pathway clicks recorded yet</p>
      )}
    </div>
  );
}