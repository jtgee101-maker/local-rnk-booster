import React from 'react';
import { motion } from 'framer-motion';

export default function SectionProgress({ sections, currentSection }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Section Title */}
      <div className="text-center mb-4">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-purple-900/30 border border-purple-500/50 rounded-full px-6 py-2"
        >
          <span className="text-purple-300 text-sm font-semibold tracking-wider">
            {sections[currentSection]?.name.toUpperCase()}
          </span>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentSection + 1) / sections.length) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Progress Text */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Step {currentSection + 1} of {sections.length}</span>
        <span>{Math.round(((currentSection + 1) / sections.length) * 100)}% complete</span>
      </div>
    </div>
  );
}