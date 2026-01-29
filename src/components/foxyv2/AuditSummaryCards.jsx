import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, MapPin, Sparkles, Users, Calculator, ChevronRight } from 'lucide-react';

export default function AuditSummaryCards({ auditData, onExpand }) {
  const cards = [
    {
      id: 'health',
      icon: TrendingUp,
      title: 'GMB Health Score',
      value: auditData.health?.overallScore || 0,
      suffix: '/100',
      status: (auditData.health?.overallScore || 0) >= 80 ? 'healthy' : (auditData.health?.overallScore || 0) >= 60 ? 'warning' : 'critical',
      insight: `${auditData.health?.criticalIssues?.length || 0} critical issues found`,
      gradient: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/40',
      textColor: 'text-blue-400',
    },
    {
      id: 'revenue',
      icon: TrendingDown,
      title: 'Monthly Revenue Leak',
      value: `$${(auditData.revenue?.monthlyOpportunity || 0).toLocaleString()}`,
      suffix: '/mo',
      status: 'critical',
      insight: `$${((auditData.revenue?.monthlyOpportunity || 0) * 12).toLocaleString()} annual loss`,
      gradient: 'from-red-500/20 to-red-500/5',
      borderColor: 'border-red-500/40',
      textColor: 'text-red-400',
    },
    {
      id: 'heatmap',
      icon: MapPin,
      title: 'Visibility Score',
      value: auditData.heatmap?.visibilityScore || 0,
      suffix: '%',
      status: (auditData.heatmap?.visibilityScore || 0) >= 70 ? 'healthy' : 'warning',
      insight: `${auditData.heatmap?.weakZones || 0} weak zones detected`,
      gradient: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-400',
    },
    {
      id: 'ai',
      icon: Sparkles,
      title: 'AI Search Presence',
      value: auditData.ai?.overallScore || 0,
      suffix: '/100',
      status: (auditData.ai?.overallScore || 0) >= 70 ? 'healthy' : 'warning',
      insight: `Found on ${Array.isArray(auditData.ai?.platforms) ? auditData.ai.platforms.filter(p => p.found).length : 0}/${Array.isArray(auditData.ai?.platforms) ? auditData.ai.platforms.length : 6} platforms`,
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/40',
      textColor: 'text-cyan-400',
    },
    {
      id: 'competitor',
      icon: Users,
      title: 'Market Position',
      value: `#${Math.ceil(auditData.heatmap?.averageRank || 7)}`,
      suffix: '',
      status: (auditData.heatmap?.averageRank || 7) <= 3 ? 'healthy' : 'warning',
      insight: 'vs. top 3 competitors',
      gradient: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/40',
      textColor: 'text-indigo-400',
    },
    {
      id: 'roi',
      icon: Calculator,
      title: 'ROI Potential',
      value: '450',
      suffix: '%',
      status: 'healthy',
      insight: 'Break even in 3 months',
      gradient: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/40',
      textColor: 'text-green-400',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onExpand(card.id)}
            className="w-full text-left"
          >
            <Card className={`bg-gradient-to-br ${card.gradient} border-2 ${card.borderColor} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gray-900/50 border ${card.borderColor}`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  <Badge className={`border ${getStatusColor(card.status)}`}>
                    {card.status === 'healthy' ? '✓ Good' : card.status === 'warning' ? '⚠ Risk' : '✗ Critical'}
                  </Badge>
                </div>
                
                <h3 className="text-gray-300 text-sm font-medium mb-2">{card.title}</h3>
                
                <div className="flex items-baseline gap-1 mb-3">
                  <div className={`text-4xl font-black ${card.textColor}`}>
                    {card.value}
                  </div>
                  {card.suffix && (
                    <div className="text-xl text-gray-500 font-bold">
                      {card.suffix}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-xs">{card.insight}</p>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#c8ff00] group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}