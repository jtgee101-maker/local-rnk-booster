import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Circle, Clock, Zap, Target, TrendingUp } from 'lucide-react';

export default function ActionRoadmap({ auditData }) {
  const [selectedPhase, setSelectedPhase] = useState(1);

  const roadmap = {
    phase1: {
      title: '30 Days: Foundation',
      icon: Zap,
      color: 'red',
      actions: [
        { task: 'Fix NAP inconsistencies across all platforms', impact: 'High', effort: 'Low', status: 'pending' },
        { task: 'Upload 10+ high-quality photos to GMB', impact: 'High', effort: 'Low', status: 'pending' },
        { task: 'Set up Q&A section with 5 common questions', impact: 'Medium', effort: 'Low', status: 'pending' },
        { task: 'Request reviews from last 20 customers', impact: 'High', effort: 'Medium', status: 'pending' },
        { task: 'Create weekly GMB post schedule', impact: 'Medium', effort: 'Low', status: 'pending' },
      ],
      expectedGains: '+15 health score points, +3 rank positions',
      revenueImpact: `+$${Math.round((auditData?.revenue?.monthlyOpportunity || 0) * 0.3).toLocaleString()}/mo`,
    },
    phase2: {
      title: '60 Days: Growth',
      icon: TrendingUp,
      color: 'yellow',
      actions: [
        { task: 'Launch location-specific landing pages', impact: 'High', effort: 'High', status: 'pending' },
        { task: 'Build citations in top 50 directories', impact: 'High', effort: 'Medium', status: 'pending' },
        { task: 'Implement review automation system', impact: 'High', effort: 'Medium', status: 'pending' },
        { task: 'Create AI-ready content (schema, FAQ)', impact: 'High', effort: 'Medium', status: 'pending' },
        { task: 'Optimize for voice search queries', impact: 'Medium', effort: 'Low', status: 'pending' },
      ],
      expectedGains: '+25 health score points, +5 rank positions',
      revenueImpact: `+$${Math.round((auditData?.revenue?.monthlyOpportunity || 0) * 0.6).toLocaleString()}/mo`,
    },
    phase3: {
      title: '90 Days: Dominance',
      icon: Target,
      color: 'green',
      actions: [
        { task: 'Achieve #1 ranking in weak zones', impact: 'Critical', effort: 'High', status: 'pending' },
        { task: 'Get featured in AI recommendations', impact: 'Critical', effort: 'High', status: 'pending' },
        { task: 'Build backlinks from 20+ local sites', impact: 'High', effort: 'High', status: 'pending' },
        { task: 'Launch competitor conquesting campaign', impact: 'Medium', effort: 'Medium', status: 'pending' },
        { task: 'Establish expert authority signals', impact: 'High', effort: 'Medium', status: 'pending' },
      ],
      expectedGains: '+40 health score points, Map Pack domination',
      revenueImpact: `+$${(auditData?.revenue?.monthlyOpportunity || 0).toLocaleString()}/mo`,
    },
  };

  const phases = [
    { num: 1, ...roadmap.phase1 },
    { num: 2, ...roadmap.phase2 },
    { num: 3, ...roadmap.phase3 },
  ];

  const currentPhase = phases.find(p => p.num === selectedPhase);
  const PhaseIcon = currentPhase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-[#c8ff00]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Target className="w-7 h-7 text-[#c8ff00]" />
              Your 90-Day Battle Plan
            </CardTitle>
            <Badge className="bg-[#c8ff00] text-black px-4 py-2 font-bold">
              Foxy's Roadmap
            </Badge>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            🦊 Strategic action plan to dominate your local market
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Phase Selector */}
          <div className="flex items-center gap-4">
            {phases.map((phase) => (
              <Button
                key={phase.num}
                onClick={() => setSelectedPhase(phase.num)}
                variant={selectedPhase === phase.num ? 'default' : 'outline'}
                className={`flex-1 ${
                  selectedPhase === phase.num
                    ? 'bg-[#c8ff00] text-black hover:bg-[#b8ef00]'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Phase {phase.num}
              </Button>
            ))}
          </div>

          {/* Phase Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(selectedPhase / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-red-400 text-xs font-bold">Start</span>
              <span className="text-yellow-400 text-xs font-bold">Building</span>
              <span className="text-green-400 text-xs font-bold">Dominating</span>
            </div>
          </div>

          {/* Phase Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPhase}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Phase Header */}
              <div className={`bg-gradient-to-r from-${currentPhase.color}-500/20 to-${currentPhase.color}-500/5 border-2 border-${currentPhase.color}-500/40 rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PhaseIcon className={`w-8 h-8 text-${currentPhase.color}-400`} />
                    <h3 className="text-white font-black text-xl">{currentPhase.title}</h3>
                  </div>
                  <Badge className={`bg-${currentPhase.color}-500 text-white text-lg px-4 py-2 font-bold`}>
                    {currentPhase.revenueImpact}
                  </Badge>
                </div>
                <p className="text-gray-200 text-sm">
                  <span className="font-bold">Expected Gains:</span> {currentPhase.expectedGains}
                </p>
              </div>

              {/* Action Items */}
              <div className="space-y-3">
                {currentPhase.actions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 hover:border-[#c8ff00]/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Circle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{action.task}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              action.impact === 'Critical' ? 'bg-red-500' :
                              action.impact === 'High' ? 'bg-orange-500' :
                              'bg-yellow-500'
                            } text-white`}>
                              {action.impact}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-gray-400">
                              {action.effort} effort
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#c8ff00]/20 to-green-500/10 border-2 border-[#c8ff00]/40 rounded-xl p-6 text-center">
            <h4 className="text-white font-black text-xl mb-3">
              🦊 Let Foxy Execute This Plan For You
            </h4>
            <p className="text-gray-200 text-sm mb-4 leading-relaxed">
              Don't wait for competitors to get ahead. Start Phase 1 today and see 
              results in <span className="text-[#c8ff00] font-bold">30 days</span> or your money back.
            </p>
            <Button size="lg" className="bg-[#c8ff00] text-black hover:bg-[#b8ef00] font-black text-xl px-12 py-6">
              <Zap className="w-5 h-5 mr-2" />
              Start Phase 1 Now - $497/mo
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}