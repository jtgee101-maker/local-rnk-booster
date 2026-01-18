import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, Shield } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Audit in Minutes',
    description: 'See your ranking power instantly. No technical jargon—just clear insights you can act on immediately.',
    color: 'text-yellow-400'
  },
  {
    icon: Target,
    title: 'Personalize Your Growth',
    description: 'Custom strategy for your niche. Every business is unique, and your audit reflects that.',
    color: 'text-purple-400'
  },
  {
    icon: TrendingUp,
    title: 'Beat the Competition',
    description: 'See exactly why they outrank you. Get the specific fixes that will put you on top.',
    color: 'text-green-400'
  },
  {
    icon: Shield,
    title: 'Zero Effort Setup',
    description: 'We handle the technical junk. You just handle the new phone calls flooding in.',
    color: 'text-blue-400'
  }
];

export default function FeaturesSection() {
  return (
    <div className="py-16 px-4 border-y border-gray-800">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            The Local Dominance Protocol
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to own the Map Pack in your area
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-6 bg-[#c8ff00]/5 border border-[#c8ff00]/30 rounded-2xl"
        >
          <Shield className="w-12 h-12 text-[#c8ff00] mx-auto mb-3" />
          <h3 className="font-bold text-white text-xl mb-2">
            The "Visible or It's Free" Ironclad Promise
          </h3>
          <p className="text-gray-400">
            If we don't identify at least 3 ranking errors, your audit is on us. Risk-free visibility guaranteed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}