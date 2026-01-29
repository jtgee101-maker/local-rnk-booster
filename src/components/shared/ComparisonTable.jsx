import React from 'react';
import { Check, X, Zap, Clock, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const features = [
  { name: 'GMB Health Score', foxy: true, diy: 'partial', agency: true },
  { name: 'Geographic Heatmap', foxy: true, diy: false, agency: false },
  { name: 'AI Search Visibility', foxy: true, diy: false, agency: false },
  { name: 'Revenue Leak Calculator', foxy: true, diy: false, agency: 'partial' },
  { name: 'Competitor Analysis', foxy: true, diy: 'manual', agency: true },
  { name: '90-Day Action Plan', foxy: true, diy: false, agency: true },
  { name: 'Weekly GMB Posts', foxy: true, diy: 'manual', agency: true },
  { name: 'Review Management', foxy: true, diy: 'manual', agency: true },
  { name: 'Citation Building', foxy: true, diy: 'hours', agency: true },
  { name: 'AI Content Generation', foxy: true, diy: false, agency: false },
  { name: 'Real-time Monitoring', foxy: true, diy: false, agency: 'partial' }
];

const CheckIcon = ({ value, isHighlight = false }) => {
  if (value === true) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className="inline-block"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isHighlight ? 'bg-[#c8ff00]/20 border-2 border-[#c8ff00]' : 'bg-green-500/20'
        }`}>
          <Check className={`w-4 h-4 ${isHighlight ? 'text-[#c8ff00]' : 'text-green-400'}`} />
        </div>
      </motion.div>
    );
  }
  if (value === false) {
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
        <X className="w-4 h-4 text-red-400" />
      </div>
    );
  }
  return (
    <div className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
      {value}
    </div>
  );
};

export default function ComparisonTable() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <Badge className="bg-[#c8ff00]/20 border-[#c8ff00]/50 text-[#c8ff00] px-4 py-2 mb-4">
          Why Choose Foxy
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Foxy vs. <span className="text-gray-500">DIY</span> vs. <span className="text-gray-500">Traditional Agencies</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto">
          See why local businesses are choosing AI-powered automation over expensive agencies and time-consuming DIY
        </p>
      </div>

      <div className="relative">
        {/* Glow effect behind Foxy column */}
        <div className="absolute left-1/4 top-0 bottom-0 w-1/4 bg-[#c8ff00]/5 blur-3xl" />
        
        <Card className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-700">
                  <th className="text-left p-6 text-gray-400 font-semibold text-base">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#c8ff00]" />
                      What You Get
                    </div>
                  </th>
                  <th className="p-6 text-center relative">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      {/* Premium glow */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-[#c8ff00] rounded-xl blur-xl"
                      />
                      
                      <div className="relative bg-gradient-to-br from-[#c8ff00] to-[#a0d000] p-4 rounded-xl">
                        <Badge className="bg-gray-900 text-[#c8ff00] font-black mb-2 text-xs">
                          ⚡ BEST VALUE
                        </Badge>
                        <div className="text-gray-900 font-black text-xl mb-1">Foxy AI</div>
                        <div className="text-gray-800 text-xs font-semibold">Automated Excellence</div>
                      </div>
                    </motion.div>
                  </th>
                  <th className="p-6 text-center bg-gray-800/30">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5 text-gray-500 mb-1" />
                      <div className="text-gray-400 font-semibold text-base">DIY</div>
                      <div className="text-gray-600 text-xs">Time Intensive</div>
                    </div>
                  </th>
                  <th className="p-6 text-center bg-gray-800/30">
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="w-5 h-5 text-gray-500 mb-1" />
                      <div className="text-gray-400 font-semibold text-base">Agency</div>
                      <div className="text-gray-600 text-xs">Expensive</div>
                    </div>
                  </th>
                </tr>
              </thead>
            <tbody>
              {features.map((feature, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group"
                >
                  <td className="p-5 text-white font-medium text-sm group-hover:text-[#c8ff00] transition-colors">
                    {feature.name}
                  </td>
                  <td className="p-5 text-center bg-gradient-to-r from-[#c8ff00]/5 via-[#c8ff00]/10 to-[#c8ff00]/5 relative">
                    {/* Highlight shimmer */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c8ff00]/10 to-transparent"
                    />
                    <CheckIcon value={feature.foxy} isHighlight={true} />
                  </td>
                  <td className="p-5 text-center bg-gray-800/20">
                    <CheckIcon value={feature.diy} />
                  </td>
                  <td className="p-5 text-center bg-gray-800/20">
                    <CheckIcon value={feature.agency} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom gradient bar */}
        <div className="h-2 bg-gradient-to-r from-[#c8ff00] via-[#00ff88] to-[#c8ff00]" />
      </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-6 text-center"
      >
        <p className="text-gray-300 text-base max-w-3xl mx-auto leading-relaxed">
          <span className="text-[#c8ff00] font-bold text-lg">The Bottom Line:</span> Get agency-level results at 67% less cost, 
          with AI automation doing the heavy lifting 24/7. No manual work, no guessing, just results.
        </p>
      </motion.div>
    </div>
  );
}