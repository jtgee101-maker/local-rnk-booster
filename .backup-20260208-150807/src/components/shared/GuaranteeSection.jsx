import React from 'react';
import { Shield, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function GuaranteeSection({ variant = 'full' }) {
  const guarantees = [
    {
      icon: TrendingUp,
      title: "Results or Refund",
      description: "See ranking improvements in 60 days or get your money back"
    },
    {
      icon: DollarSign,
      title: "ROI Guarantee",
      description: "Break even within 6 months or we work for free until you do"
    },
    {
      icon: CheckCircle,
      title: "Cancel Anytime",
      description: "No long-term contracts. Cancel with 30 days notice, no questions asked"
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <Shield className="w-8 h-8 text-green-400" />
        <div className="text-left">
          <div className="text-green-300 font-bold">60-Day Money-Back Guarantee</div>
          <div className="text-gray-400 text-sm">Zero risk. See results or get a full refund.</div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-500/10 via-gray-900 to-gray-900 border-2 border-green-500/30 p-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full mb-4"
        >
          <Shield className="w-10 h-10 text-green-400" />
        </motion.div>
        <h3 className="text-3xl font-black text-white mb-2">
          Our <span className="text-green-400">Iron-Clad</span> Guarantee
        </h3>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          We're so confident in Foxy's ability to dominate your local market, 
          we back it with three bulletproof guarantees
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {guarantees.map((guarantee, idx) => {
          const Icon = guarantee.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition-all"
            >
              <Icon className="w-10 h-10 text-green-400 mb-4" />
              <h4 className="text-white font-bold text-lg mb-2">{guarantee.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{guarantee.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          <span className="text-green-400 font-bold">Bottom Line:</span> You only pay if Foxy delivers. 
          That's how confident we are in our AI-powered local domination system.
        </p>
      </div>
    </Card>
  );
}