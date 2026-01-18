import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Clock, TrendingUp } from 'lucide-react';

export default function CompetitorComparison() {
  const features = [
    { feature: 'Implementation Time', manual: '28 Days of DIY Work', automated: '60-Second AI Scan', icon: Clock },
    { feature: 'Directory Submissions', manual: '40+ Hours of Manual Entry', automated: '1-Click Automated Sync', icon: Zap },
    { feature: 'Technical Knowledge', manual: 'Must Learn 100+ Page Blueprint', automated: 'Zero Learning Required', icon: TrendingUp },
    { feature: 'Ongoing Maintenance', manual: 'Endless Manual Updates', automated: 'AI Auto-Optimization', icon: Check },
    { feature: 'Support', manual: 'Figure It Out Yourself', automated: 'Dedicated Specialist', icon: Check },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 mb-8"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Why Blueprints Are Built for <span className="text-red-400">Architects</span>
        </h3>
        <p className="text-gray-400 text-lg">
          Not Business Owners Who Need Phones Ringing <span className="text-[#c8ff00]">Today</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-4 text-gray-500 font-medium"></th>
              <th className="text-center py-4 px-4">
                <div className="text-red-400 font-bold text-lg mb-1">Manual Blueprints</div>
                <div className="text-gray-500 text-sm">40+ Hours of Homework</div>
              </th>
              <th className="text-center py-4 px-4">
                <div className="text-[#c8ff00] font-bold text-lg mb-1">AI-Powered Execution</div>
                <div className="text-gray-400 text-sm">60-Second Automation</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-gray-800/50"
              >
                <td className="py-5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-white font-medium">{item.feature}</span>
                  </div>
                </td>
                <td className="py-5 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{item.manual}</span>
                  </div>
                </td>
                <td className="py-5 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-[#c8ff00] flex-shrink-0" />
                    <span className="text-gray-300 text-sm font-medium">{item.automated}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-6 py-3">
          <Zap className="w-5 h-5 text-[#c8ff00]" />
          <span className="text-[#c8ff00] font-semibold">
            Stop "Learning" How to Rank. Start <span className="underline">Ranking</span>.
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}