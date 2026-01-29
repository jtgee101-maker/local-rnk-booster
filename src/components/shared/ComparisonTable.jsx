import React from 'react';
import { Check, X } from 'lucide-react';
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
  { name: 'Real-time Monitoring', foxy: true, diy: false, agency: 'partial' },
  { name: 'Monthly Investment', foxy: '$497', diy: 'Free (time)', agency: '$1,500+' }
];

const CheckIcon = ({ value }) => {
  if (value === true) {
    return <Check className="w-5 h-5 text-green-400" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-red-400" />;
  }
  return <span className="text-xs text-gray-400">{value}</span>;
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

      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 sm:p-6 text-gray-400 font-semibold">Feature</th>
                <th className="p-4 sm:p-6 text-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                  >
                    <Badge className="bg-[#c8ff00] text-gray-900 font-black mb-2">
                      RECOMMENDED
                    </Badge>
                    <div className="text-white font-bold text-lg">Foxy AI</div>
                  </motion.div>
                </th>
                <th className="p-4 sm:p-6 text-center">
                  <div className="text-gray-400 font-semibold">DIY</div>
                </th>
                <th className="p-4 sm:p-6 text-center">
                  <div className="text-gray-400 font-semibold">Agency</div>
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
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="p-4 sm:p-6 text-white font-medium">{feature.name}</td>
                  <td className="p-4 sm:p-6 text-center bg-[#c8ff00]/5">
                    <CheckIcon value={feature.foxy} />
                  </td>
                  <td className="p-4 sm:p-6 text-center">
                    <CheckIcon value={feature.diy} />
                  </td>
                  <td className="p-4 sm:p-6 text-center">
                    <CheckIcon value={feature.agency} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 text-center"
      >
        <p className="text-gray-400 text-sm">
          <span className="text-[#c8ff00] font-bold">The Bottom Line:</span> Get agency-level results at a fraction of the cost, 
          without the time investment of DIY. Foxy works 24/7 so you don't have to.
        </p>
      </motion.div>
    </div>
  );
}