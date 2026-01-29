import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { name: 'Google Partner', icon: '🔍' },
  { name: 'Inc. 5000', icon: '📈' },
  { name: 'Forbes Featured', icon: '📰' },
  { name: 'TechCrunch', icon: '💻' },
  { name: 'BBB A+', icon: '⭐' },
  { name: 'Clutch Top Rated', icon: '🏆' }
];

export default function TrustLogos({ variant = 'default' }) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-6 flex-wrap opacity-60">
        {logos.slice(0, 4).map((logo, idx) => (
          <div key={idx} className="text-2xl grayscale hover:grayscale-0 transition-all">
            {logo.icon}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-12 border-t border-b border-gray-800">
      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">
          As Trusted By & Featured In
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
        {logos.map((logo, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-900/50 transition-all cursor-pointer"
          >
            <div className="text-4xl grayscale hover:grayscale-0 transition-all">
              {logo.icon}
            </div>
            <span className="text-gray-500 text-xs font-semibold">
              {logo.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}