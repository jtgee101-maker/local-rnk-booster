import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const leadSources = [
  { id: 'thumbtack', label: 'Thumbtack', cost: '$100/lead', desc: 'Sold to 5 competitors' },
  { id: 'homeadvisor', label: 'HomeAdvisor', cost: '$150/lead', desc: 'No exclusivity' },
  { id: 'angi', label: 'Angi', cost: '$125/lead', desc: 'Shared leads' },
  { id: 'scorpion', label: 'Scorpion/Agency', cost: '$2,000/mo', desc: 'Contract lock-in' },
  { id: 'olly', label: 'Olly Olly', cost: '$1,800/mo', desc: 'Zero ownership' },
  { id: 'other', label: 'Other Platform', cost: 'Varies', desc: 'Renting visibility' }
];

export default function V2LeadSourceStep({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-red-400 font-semibold">QUESTION 1 OF 3</span>
        </motion.div>
        
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          Which <span className="text-red-400">Lead-Gen Platform</span> Is Currently<br />
          "Taxing" Your Profit?
        </h2>
        <p className="text-gray-400 text-lg">
          Select the platform you're currently using (or recently left)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {leadSources.map((source, index) => (
          <motion.button
            key={source.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(source.id)}
            className="relative group bg-gray-900/50 border-2 border-red-500/20 hover:border-red-500/50 rounded-2xl p-6 text-left transition-all min-h-[120px] touch-manipulation"
          >
            {/* Red X Badge */}
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-5 h-5 text-white" />
            </div>

            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                {source.label}
              </h3>
              <span className="text-red-400 font-semibold text-sm">{source.cost}</span>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">{source.desc}</p>
            
            <div className="text-[#c8ff00] text-sm font-medium group-hover:underline">
              Select this platform →
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}